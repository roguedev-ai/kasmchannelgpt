import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { proxyRequest } from '@/lib/api/proxy-handler';
import { getPersonaSystemPrompt, type VoiceOption, type PersonaOption } from '@/store/voice-settings';

const VOICE_LANGUAGE = process.env.VOICE_LANGUAGE || 'en';

// Helper function to get OpenAI client (lazy initialization)
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  console.log('🎤 [VOICE-API] Request received');
  
  try {
    // Get audio file and conversation from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const projectId = formData.get('projectId') as string;
    const sessionId = formData.get('sessionId') as string | null;
    const voice = (formData.get('voice') as VoiceOption) || 'alloy';
    const persona = (formData.get('persona') as PersonaOption) || 'assistant';
    const conversationHeader = request.headers.get('conversation') || '';
    
    console.log('📦 [VOICE-API] Request data:', {
      hasAudioFile: !!audioFile,
      audioSize: audioFile ? `${(audioFile.size / 1024).toFixed(2)}KB` : 'N/A',
      audioType: audioFile?.type || 'unknown',
      audioName: audioFile?.name || 'unknown',
      projectId,
      sessionId,
      voice,
      persona,
      hasConversation: !!conversationHeader
    });
    
    if (!audioFile) {
      console.error('❌ [VOICE-API] No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!projectId) {
      console.error('❌ [VOICE-API] No projectId provided');
      return NextResponse.json({ error: 'No projectId provided' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      console.error('❌ [VOICE-API] OpenAI API key not configured');
      return NextResponse.json({ 
        error: 'Voice feature requires OpenAI API key. Please add OPENAI_API_KEY to your .env.local file.',
        userMessage: 'Voice chat is not available. OpenAI API key is required for this feature.'
      }, { status: 503 }); // 503 Service Unavailable is more appropriate
    }

    // Step 1: Transcribe audio using Whisper
    console.log('🎯 [VOICE-API] Step 1: Transcribing audio with Whisper...');
    const transcription = await transcribeAudio(audioFile, openai);
    console.log('✅ [VOICE-API] Transcription complete:', transcription);

    // Step 2: Get completion from CustomGPT
    console.log('🎯 [VOICE-API] Step 2: Getting AI response...');
    const conversation = conversationHeader 
      ? JSON.parse(Buffer.from(conversationHeader, 'base64').toString('utf-8'))
      : [];
    
    console.log('💬 [VOICE-API] Conversation history length:', conversation.length);
    
    const { response: aiResponse, sessionId: newSessionId } = await getCustomGPTCompletion(transcription, conversation, projectId, sessionId, persona, request);
    console.log('✅ [VOICE-API] AI response received:', aiResponse, 'session:', newSessionId);

    // Step 3: Convert response to speech
    console.log('🎯 [VOICE-API] Step 3: Converting to speech with voice:', voice);
    const audioBuffer = await textToSpeech(aiResponse, voice, openai);
    console.log('✅ [VOICE-API] Speech synthesis complete, size:', `${(audioBuffer.length / 1024).toFixed(2)}KB`);

    // Construct response header with conversation (keep existing format for compatibility)
    // Only include the new messages in the response to avoid duplicates
    const newMessages = [
      { role: 'user', content: transcription },
      { role: 'assistant', content: aiResponse }
    ];
    
    const responseHeader = Buffer.from(JSON.stringify(newMessages)).toString('base64');

    // Return audio response with conversation in header
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'text': responseHeader,
        // Pass back any new session_id if we got one
        ...(newSessionId && { 'x-session-id': newSessionId }),
      },
    });

  } catch (error) {
    console.error('❌ [VOICE-API] Voice inference error:', error);
    
    // Provide more specific error messages based on the error
    let errorMessage = 'Failed to process voice request';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to transcribe audio')) {
        errorMessage = 'Failed to transcribe audio. Check your OpenAI API key and ensure it has access to Whisper.';
      } else if (error.message.includes('Failed to get AI completion')) {
        errorMessage = 'Failed to get AI response. Check your CustomGPT API key configuration.';
      } else if (error.message.includes('Failed to convert text to speech')) {
        errorMessage = 'Failed to convert text to speech. Check your OpenAI API key and ensure it has access to TTS.';
      } else if (error.message.includes('OPENAI_API_KEY')) {
        errorMessage = 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: statusCode }
    );
  }
}

async function transcribeAudio(audioFile: File, openai: OpenAI): Promise<string> {
  try {
    console.log('🎙️ [VOICE-API] Starting audio transcription...');
    
    // Debug: Save audio file to check format (only in development)
    if (process.env.NODE_ENV === 'development') {
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      const fs = await import('fs');
      const path = await import('path');
      const debugPath = path.join(process.cwd(), 'debug-audio.wav');
      fs.writeFileSync(debugPath, buffer);
      console.log('🔍 [DEBUG] Audio file saved to:', debugPath);
    }
    
    // The OpenAI SDK in Node.js expects a File-like object with specific properties
    // We need to pass the File object directly as it comes from FormData
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile as any, // The FormData File object works directly
      model: 'whisper-1',
      // Try with English language explicitly
      language: 'en',
      response_format: 'verbose_json', // Get more detailed response
      temperature: 0, // More deterministic transcription
    });

    console.log('✅ [VOICE-API] Transcription successful:', {
      text: transcription.text,
      language: (transcription as any).language || 'unknown',
      duration: (transcription as any).duration || 'unknown',
      audioSize: `${(audioFile.size / 1024).toFixed(2)}KB`
    });
    
    return transcription.text;
  } catch (error: any) {
    console.error('❌ [VOICE-API] Transcription error:', error);
    
    // Check for specific OpenAI errors
    if (error?.error?.code === 'invalid_api_key' || error?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local');
    } else if (error?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error?.status === 400) {
      throw new Error('Invalid audio format. Please ensure the audio is in WAV format.');
    } else if (error?.message?.includes('File is not defined')) {
      // This is a Node.js environment issue - try alternative approach
      throw new Error('Server environment error. Unable to process audio file.');
    }
    
    throw new Error(`Failed to transcribe audio: ${error?.message || 'Unknown error'}`);
  }
}

async function getCustomGPTCompletion(userPrompt: string, conversation: any[], projectId: string, sessionId: string | null, persona: PersonaOption, voiceRequest: NextRequest): Promise<{ response: string; sessionId?: string }> {
  console.log('🎯 [VOICE-API] Using CustomGPT proxy API', { projectId, sessionId });
  
  try {
    // If we have a sessionId, use the session-aware endpoint for better conversation context
    // This ensures proper knowledge base activation and conversation continuity
    if (sessionId) {
      console.log('📝 [VOICE-API] Using session-aware endpoint with sessionId:', sessionId);
      
      // For session-aware endpoint, we use the standard message format
      // Include persona context in the prompt if this is the first message in conversation
      let enhancedPrompt = userPrompt;
      if (conversation.length === 0) {
        const personaPrompt = getPersonaSystemPrompt(persona);
        enhancedPrompt = `${personaPrompt}\n\nUser: ${userPrompt}`;
        console.log('🎭 [VOICE-API] Added persona context for new conversation');
      }
      
      const requestBody = {
        prompt: enhancedPrompt,
        stream: false,
        source_ids: undefined // Let agent use all sources
      };
      
      console.log('📝 [VOICE-API] Session-aware request:', {
        projectId,
        sessionId,
        hasPersonaContext: conversation.length === 0,
        promptLength: enhancedPrompt.length
      });
      
      // Create a new request for the proxy
      const mockRequest = new NextRequest(voiceRequest.url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Use the session-aware endpoint
      const proxyResponse = await proxyRequest(
        `/projects/${projectId}/conversations/${sessionId}/messages`,
        mockRequest,
        { method: 'POST' }
      );
      
      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        console.error('❌ [VOICE-API] Session-aware endpoint error:', {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          body: errorText,
          projectId: projectId,
          sessionId: sessionId
        });
        
        // If session-aware endpoint fails, fall back to OpenAI-style endpoint
        console.log('⚠️ [VOICE-API] Falling back to OpenAI-style endpoint');
        return getCustomGPTCompletionFallback(userPrompt, conversation, projectId, persona, voiceRequest);
      }
      
      const data = await proxyResponse.json();
      console.log('✅ [VOICE-API] Session-aware response structure:', {
        hasData: !!data.data,
        keys: Object.keys(data).slice(0, 10)
      });
      
      // Handle session-aware response format
      let responseContent = '';
      if (data.data && data.data.openai_response) {
        responseContent = data.data.openai_response;
      } else if (data.data && data.data.user_query) {
        // This is the message object format, get the response
        responseContent = data.data.openai_response || 'No response available';
      } else {
        console.error('❌ [VOICE-API] Unexpected session-aware response format:', data);
        responseContent = 'I couldn\'t understand the response format.';
      }
      
      return { response: responseContent, sessionId: sessionId };
      
    } else {
      // No sessionId - use OpenAI-style endpoint as fallback
      console.log('⚠️ [VOICE-API] No sessionId provided, using OpenAI-style endpoint');
      return getCustomGPTCompletionFallback(userPrompt, conversation, projectId, persona, voiceRequest);
    }
  } catch (error) {
    console.error('❌ [VOICE-API] CustomGPT proxy error details:', error);
    console.error('📊 [VOICE-API] Error context:', { projectId, sessionId, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
    
    // Return error instead of falling back to OpenAI
    throw new Error(`CustomGPT API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fallback function for OpenAI-style endpoint (original logic)
async function getCustomGPTCompletionFallback(userPrompt: string, conversation: any[], projectId: string, persona: PersonaOption, voiceRequest: NextRequest): Promise<{ response: string; sessionId?: string }> {
  console.log('🔄 [VOICE-API] Using OpenAI-style endpoint fallback');
  
  // Build conversation history in CustomGPT format
  // Start with a system message based on selected persona
  const messages = [
    {
      role: 'system',
      content: getPersonaSystemPrompt(persona)
    }
  ];
  
  // Add conversation history
  conversation.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });
  
  // Add the current user message
  messages.push({ role: 'user', content: userPrompt });
  
  // Build request body matching the format used in the main chat
  const requestBody: any = {
    messages: messages,
    stream: false,
    lang: 'en',
    is_inline_citation: false
  };
  
  console.log('📝 [VOICE-API] Fallback request body:', {
    projectId,
    messageCount: messages.length
  });
  
  // Create a new request for the proxy
  const mockRequest = new NextRequest(voiceRequest.url, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Use the proxy handler to make the request
  const proxyResponse = await proxyRequest(
    `/projects/${projectId}/chat/completions`,
    mockRequest,
    { method: 'POST' }
  );
  
  if (!proxyResponse.ok) {
    const errorText = await proxyResponse.text();
    console.error('❌ [VOICE-API] CustomGPT fallback proxy error:', {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      body: errorText,
      projectId: projectId
    });
    
    // Check if it's a 403 (agent not active) or other known errors
    if (proxyResponse.status === 403) {
      console.error('🚫 [VOICE-API] Agent is inactive or not configured.');
      throw new Error('Agent is inactive - no documents uploaded');
    }
    
    throw new Error(`CustomGPT API error (${proxyResponse.status}): ${errorText}`);
  }
  
  const data = await proxyResponse.json();
  console.log('✅ [VOICE-API] CustomGPT fallback response structure:', {
    hasChoices: !!data.choices,
    hasResponse: !!data.response,
    hasAnswer: !!data.answer,
    hasData: !!data.data,
    hasSessionId: !!data.session_id,
    keys: Object.keys(data).slice(0, 10)
  });
  
  // Handle the response format from CustomGPT
  let responseContent = '';
  if (data.choices && data.choices[0] && data.choices[0].message) {
    responseContent = data.choices[0].message.content;
  } else if (data.data && data.data.openai_response) {
    responseContent = data.data.openai_response;
  } else if (data.response) {
    responseContent = data.response;
  } else if (data.answer) {
    responseContent = data.answer;
  } else {
    console.error('❌ [VOICE-API] Unexpected fallback response format:', data);
    responseContent = 'I couldn\'t understand the response format.';
  }
  
  // Log if we're getting a GPT-3 response instead of CustomGPT knowledge
  if (responseContent.includes("I'm powered by OpenAI") || responseContent.includes("GPT-3")) {
    console.warn('⚠️ [VOICE-API] Response indicates OpenAI fallback despite successful CustomGPT call');
  }
  
  return { response: responseContent, sessionId: undefined };
}

// OpenAI fallback function removed - only using CustomGPT now

async function textToSpeech(text: string, voice: VoiceOption, openai: OpenAI): Promise<Buffer> {
  // Always use OpenAI TTS for now
  return await openaiTextToSpeech(text, voice, openai);
}

async function openaiTextToSpeech(text: string, voice: VoiceOption, openai: OpenAI): Promise<Buffer> {
  try {
    console.log('🔊 [VOICE-API] Starting text-to-speech conversion with voice:', voice);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log('✅ [VOICE-API] Text-to-speech successful');
    return buffer;
  } catch (error: any) {
    console.error('❌ [VOICE-API] OpenAI TTS error:', error);
    
    // Check for specific OpenAI errors
    if (error?.status === 401) {
      throw new Error('Invalid OpenAI API key for TTS. Please check your OPENAI_API_KEY in .env.local');
    } else if (error?.status === 429) {
      throw new Error('OpenAI TTS rate limit exceeded. Please try again later.');
    } else if (error?.status === 400) {
      throw new Error('Invalid text for TTS. Text may be too long or contain invalid characters.');
    }
    
    throw new Error(`Failed to convert text to speech: ${error?.message || 'Unknown error'}`);
  }
}