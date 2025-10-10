/**
 * Streaming Voice API Route
 * 
 * Ultra-fast streaming implementation that returns text chunks as they're generated
 * and audio chunks via separate binary stream. Optimized for <1s first audio response.
 */

import { NextRequest, NextResponse } from 'next/server';
// Removed getPersonaSystemPrompt import - CustomGPT doesn't use system messages
import { getStreamHeaders } from '@/lib/api/headers';

// Enable streaming for this route
export const runtime = 'nodejs';
export const maxDuration = 60;

interface VoiceStreamChunk {
  type: 'text' | 'audio_ref' | 'complete' | 'error';
  text?: string;
  audioId?: string; // Reference to audio chunk, not the data itself
  chunkId?: string;
  error?: string;
}

// Store audio chunks temporarily in memory (in production, use Redis or similar)
// Using a global to persist across hot reloads in development
declare global {
  var audioChunkStore: Map<string, Buffer> | undefined;
  var audioChunkCleanupInterval: NodeJS.Timeout | undefined;
}

if (!global.audioChunkStore) {
  global.audioChunkStore = new Map<string, Buffer>();
}
const audioChunkStore = global.audioChunkStore as Map<string, Buffer>;

// Cleanup old chunks after 5 minutes
if (!global.audioChunkCleanupInterval) {
  global.audioChunkCleanupInterval = setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, chunk] of audioChunkStore.entries()) {
      const timestamp = parseInt(id.split('_')[1] || '0');
      if (timestamp < fiveMinutesAgo) {
        audioChunkStore.delete(id);
      }
    }
  }, 60 * 1000); // Run every minute
}

export async function POST(request: NextRequest) {
  // Production: Reduced logging
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const conversationHeader = request.headers.get('conversation');
    const projectId = formData.get('project_id') as string;
    const sessionId = formData.get('session_id') as string;
    const voice = formData.get('voice') as string || 'alloy';
    const persona = formData.get('persona') as string || 'assistant';
    
    // Get deployment mode from header
    const deploymentMode = request.headers.get('X-Deployment-Mode') || 'production';
    
    console.log('🔍 [STREAMING-VOICE] Deployment mode:', deploymentMode);
    console.log('🔍 [STREAMING-VOICE] Headers:', {
      'X-Deployment-Mode': request.headers.get('X-Deployment-Mode'),
      'X-OpenAI-API-Key': request.headers.get('X-OpenAI-API-Key') ? 'present' : 'not present'
    });
    
    // Get OpenAI key based on deployment mode
    let openAIKey: string | null = null;
    if (deploymentMode === 'demo') {
      // In demo mode, ONLY use the key from header
      openAIKey = request.headers.get('X-OpenAI-API-Key');
    } else {
      // In production mode, use server-side env var
      openAIKey = process.env.OPENAI_API_KEY || null;
      console.log('🔍 [STREAMING-VOICE] Production mode - OpenAI key from env:', openAIKey ? 'present' : 'not present');
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    if (!openAIKey) {
      console.error('❌ [STREAMING-VOICE] OpenAI API key not configured');
      console.error('❌ [STREAMING-VOICE] Deployment mode when error occurred:', deploymentMode);
      console.error('❌ [STREAMING-VOICE] Environment OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
      
      const errorMessage = deploymentMode === 'demo'
        ? 'Voice feature requires an OpenAI API key. Please enable voice capability in demo settings and provide your OpenAI API key.'
        : 'Voice feature requires OpenAI API key. Please add OPENAI_API_KEY to your .env.local file.';
      
      // For debugging - include deployment mode in error
      return NextResponse.json({ 
        error: errorMessage + ` (Mode: ${deploymentMode})`,
        userMessage: errorMessage,
        deploymentMode: deploymentMode
      }, { status: 503 });
    }

    // Log only essential info in production

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Transcribe audio (0-500ms)
          const transcript = await transcribeAudio(audioFile, openAIKey || undefined);
          
          if (!transcript) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: 'Failed to transcribe audio'
            })}\n\n`));
            controller.close();
            return;
          }


          // Step 2: Start streaming chat response (500-1000ms)
          const conversation = conversationHeader ? 
            JSON.parse(Buffer.from(conversationHeader, 'base64').toString()) : [];
          
          // Step 3: Stream response with parallel TTS generation
          // Get demo CustomGPT API key if in demo mode
          const demoCustomGptKey = deploymentMode === 'demo' ? request.headers.get('X-CustomGPT-API-Key') || undefined : undefined;
          const chatStream = await streamChatResponse(transcript, projectId, sessionId, deploymentMode, demoCustomGptKey);
          let fullResponse = '';
          let chunkBuffer = '';
          const CHUNK_SIZE = 150; // Optimal size for natural speech breaks
          let chunkId = 0;
          const pendingTTSChunks: Promise<void>[] = []; // Track ALL TTS promises

          for await (const textChunk of chatStream) {
            fullResponse += textChunk;
            chunkBuffer += textChunk;

            // Send text chunk immediately
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'text',
              text: textChunk,
              chunkId: `chunk_${chunkId}`
            })}\n\n`));

            // Generate TTS for accumulated chunks
            if (chunkBuffer.length >= CHUNK_SIZE) {
              // Find a natural break point (sentence end, comma, etc.)
              let breakPoint = -1;
              const breakPatterns = ['. ', '? ', '! ', ', ', '; ', ': '];
              
              // Look for the last natural break point before CHUNK_SIZE
              for (const pattern of breakPatterns) {
                const lastIndex = chunkBuffer.lastIndexOf(pattern);
                if (lastIndex > 0 && lastIndex < CHUNK_SIZE * 1.5) {
                  breakPoint = lastIndex + pattern.length;
                  break;
                }
              }
              
              // If no natural break found, use the CHUNK_SIZE
              if (breakPoint === -1) {
                // Try to at least break at a word boundary
                const spaceIndex = chunkBuffer.lastIndexOf(' ', CHUNK_SIZE);
                breakPoint = spaceIndex > CHUNK_SIZE * 0.7 ? spaceIndex + 1 : CHUNK_SIZE;
              }
              
              const currentChunk = chunkBuffer.substring(0, breakPoint).trim();
              chunkBuffer = chunkBuffer.substring(breakPoint);
              
              if (currentChunk) {
                // Log the chunk being sent to TTS for debugging
                console.log(`🎤 [STREAMING-VOICE] TTS chunk ${chunkId}: "${currentChunk}"`);
                
                // Generate TTS in parallel and track the promise
                const currentChunkId = chunkId++;
                const ttsPromise = generateTTSChunkBinary(currentChunk, voice, currentChunkId, controller, encoder, openAIKey || undefined)
                  .catch(error => {
                    console.error(`❌ [STREAMING-VOICE] TTS chunk ${currentChunkId} failed:`, error);
                  });
                pendingTTSChunks.push(ttsPromise);
              }
            }
          }

          // Handle final chunk
          if (chunkBuffer.trim()) {
            const ttsPromise = generateTTSChunkBinary(chunkBuffer.trim(), voice, chunkId++, controller, encoder, openAIKey || undefined)
              .catch(error => {
                console.error('❌ [STREAMING-VOICE] Final TTS chunk failed:', error);
              });
            pendingTTSChunks.push(ttsPromise);
          }

          // Wait for all TTS chunks to complete before closing the stream
          await Promise.all(pendingTTSChunks);
          
          // Add extra delay to ensure all chunks are sent
          await new Promise(resolve => setTimeout(resolve, 500));

          // Log the complete response for debugging
          console.log(`✅ [STREAMING-VOICE] Complete response (${fullResponse.length} chars):`, fullResponse);
          console.log(`✅ [STREAMING-VOICE] Transcript:`, transcript);
          
          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            fullResponse,
            transcript
          })}\n\n`));

          controller.close();

        } catch (error) {
          console.error('❌ [STREAMING-VOICE] Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Stream failed'
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('❌ [STREAMING-VOICE] Request error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioFile: File, openAIKey?: string): Promise<string | null> {
  // Use the provided key directly - the caller determines if it's from demo or production
  const apiKey = openAIKey;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('❌ [STREAMING-VOICE] Transcription failed:', error);
    return null;
  }
}

/**
 * Stream chat response from CustomGPT
 */
async function* streamChatResponse(transcript: string, projectId: string, sessionId: string | null, deploymentMode?: string, demoApiKey?: string): AsyncGenerator<string> {
  // Get CustomGPT API key - using the same logic as proxy handler
  let customGptApiKey: string | undefined;
  
  if (deploymentMode === 'demo') {
    // Check if it's free trial mode (no demoApiKey provided)
    if (!demoApiKey) {
      // Use the demo-only API key for free trial
      customGptApiKey = process.env.CUSTOMGPT_API_KEY_DEMO_USE_ONLY;
    } else {
      // Use the user-provided demo API key
      customGptApiKey = demoApiKey;
    }
  } else {
    // Production mode - use regular API key
    customGptApiKey = process.env.CUSTOMGPT_API_KEY;
  }
  
  if (!customGptApiKey) {
    const errorMessage = deploymentMode === 'demo'
      ? 'CustomGPT API key is required. Please add it in demo settings.'
      : 'CUSTOMGPT_API_KEY not configured in environment';
    console.error('❌ [STREAMING-VOICE] API Key error:', errorMessage);
    console.error('❌ [STREAMING-VOICE] Deployment mode:', deploymentMode);
    console.error('❌ [STREAMING-VOICE] Demo API key provided:', !!demoApiKey);
    console.error('❌ [STREAMING-VOICE] ENV keys available:', {
      CUSTOMGPT_API_KEY: !!process.env.CUSTOMGPT_API_KEY,
      CUSTOMGPT_API_KEY_DEMO_USE_ONLY: !!process.env.CUSTOMGPT_API_KEY_DEMO_USE_ONLY
    });
    throw new Error(errorMessage);
  }

  if (!projectId) {
    throw new Error('Project ID is required');
  }

  try {
    // Use the stream headers from the headers utility
    const headers = getStreamHeaders(customGptApiKey);
    
    // Use CustomGPT's native format
    const requestBody = {
      prompt: transcript,
      stream: true
    };
    
    // Generate a session ID if not provided
    const conversationSessionId = sessionId || `voice-${Date.now()}`;
    
    console.log('🔍 [STREAMING-VOICE] Making request to CustomGPT:', {
      url: `https://app.customgpt.ai/api/v1/projects/${projectId}/conversations/${conversationSessionId}/messages`,
      projectId,
      sessionId: conversationSessionId,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 15)}...` : 'missing'
      },
      body: requestBody
    });
    
    // Use the correct CustomGPT messages endpoint
    const response = await fetch(`https://app.customgpt.ai/api/v1/projects/${projectId}/conversations/${conversationSessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [STREAMING-VOICE] CustomGPT API error:', response.status, errorText);
      console.error('❌ [STREAMING-VOICE] Request details:', {
        url: `https://app.customgpt.ai/api/v1/projects/${projectId}/conversations/${conversationSessionId}/messages`,
        projectId,
        sessionId: conversationSessionId,
        deploymentMode,
        hasApiKey: !!customGptApiKey,
        apiKeyLength: customGptApiKey?.length
      });
      
      // Log the actual request being sent for debugging
      console.error('❌ [STREAMING-VOICE] Full request body:', JSON.stringify(requestBody, null, 2));
      
      // Try to parse error for more details
      let errorDetails = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorDetails = parsed.message || parsed.error || errorText;
        
        // Log parsed error details
        console.error('❌ [STREAMING-VOICE] Parsed error:', parsed);
      } catch (e) {
        // Keep original error text if not JSON
      }
      
      // Special handling for 500 errors
      if (response.status === 500) {
        console.error('❌ [STREAMING-VOICE] Server error - this might be due to invalid message format or content');
        errorDetails = 'Server error - please try again with a different message';
      }
      
      throw new Error(`CustomGPT API error: ${response.status} - ${errorDetails}`);
    }

    if (!response.body) {
      throw new Error('No response body from CustomGPT');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle CustomGPT's native streaming format
            if (parsed.status === 'progress' && parsed.message !== undefined) {
              yield parsed.message;
            } else if (parsed.status === 'complete') {
              // Stream is complete
              return;
            }
          } catch (e) {
            console.log('Failed to parse SSE data:', data);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ [STREAMING-VOICE] Chat stream failed:', error);
    throw error;
  }
}

/**
 * Generate TTS chunk and send audio reference
 */
async function generateTTSChunkBinary(
  text: string, 
  voice: string, 
  chunkId: number,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  openAIKey?: string
): Promise<void> {
  if (!text.trim()) return;

  // Use the provided key directly - the caller determines if it's from demo or production
  const apiKey = openAIKey;
  
  if (!apiKey) return;

  try {

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Faster model for streaming
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Store audio chunk with unique ID
    const audioId = `audio_${Date.now()}_${chunkId}`;
    audioChunkStore.set(audioId, Buffer.from(audioBuffer));

    // Check if controller is still open before writing
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'audio_ref',
        audioId: audioId,
        chunkId: `chunk_${chunkId}`,
        text: text
      })}\n\n`));
      
    } catch (enqueueError) {
      // Controller is closed, but this is OK - the stream has ended
      // Clean up stored chunk if stream is closed
      audioChunkStore.delete(audioId);
    }

  } catch (error) {
    console.error(`❌ [STREAMING-VOICE] TTS chunk ${chunkId} failed:`, error);
    
    // Try to send error for this chunk if controller is still open
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'error',
        error: `TTS failed for chunk ${chunkId}`,
        chunkId: `chunk_${chunkId}`
      })}\n\n`));
    } catch {
      // Controller is closed, ignore
    }
  }
}

/**
 * Audio chunk retrieval endpoint
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const audioId = url.searchParams.get('id');
  
  if (!audioId) {
    return NextResponse.json({ error: 'No audio ID provided' }, { status: 400 });
  }
  
  const audioBuffer = audioChunkStore.get(audioId);
  if (!audioBuffer) {
    console.warn(`[STREAMING-VOICE] Audio chunk not found: ${audioId}`);
    return NextResponse.json({ error: 'Audio chunk not found' }, { status: 404 });
  }
  
  
  // Return audio as binary
  return new NextResponse(audioBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'max-age=300', // Cache for 5 minutes
    },
  });
}

// Removed getPersonaPrompt function - CustomGPT doesn't use system messages for personas