import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { proxyRequest } from '@/lib/api/proxy-handler';

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
    const conversationHeader = request.headers.get('conversation') || '';
    
    console.log('📦 [VOICE-API] Request data:', {
      hasAudioFile: !!audioFile,
      audioSize: audioFile ? `${(audioFile.size / 1024).toFixed(2)}KB` : 'N/A',
      audioType: audioFile?.type || 'unknown',
      audioName: audioFile?.name || 'unknown',
      projectId,
      sessionId,
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
    
    const { response: aiResponse, sessionId: newSessionId } = await getCustomGPTCompletion(transcription, conversation, projectId, sessionId, request);
    console.log('✅ [VOICE-API] AI response received:', aiResponse, 'session:', newSessionId);

    // Step 3: Convert response to speech
    console.log('🎯 [VOICE-API] Step 3: Converting to speech...');
    const audioBuffer = await textToSpeech(aiResponse, openai);
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

async function getCustomGPTCompletion(userPrompt: string, conversation: any[], projectId: string, sessionId: string | null, voiceRequest: NextRequest): Promise<{ response: string; sessionId?: string }> {
  console.log('🎯 [VOICE-API] Using CustomGPT proxy API', { sessionId });
  
  try {
    // Build conversation history in CustomGPT format
    // Start with a system message for voice context
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant with a voice interface. Keep your responses very succinct and limited to 1-2 sentences since the user is interacting through voice.'
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
    
    // Only add session_id if it exists
    if (sessionId) {
      requestBody.session_id = sessionId;
    }
    
    console.log('📝 [VOICE-API] Request body:', {
      messageCount: messages.length,
      hasSessionId: !!sessionId,
      sessionId: sessionId
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
      console.error('❌ [VOICE-API] CustomGPT proxy error:', {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        body: errorText
      });
      throw new Error(`CustomGPT API error (${proxyResponse.status}): ${errorText}`);
    }
    
    const data = await proxyResponse.json();
    console.log('✅ [VOICE-API] CustomGPT response structure:', {
      hasChoices: !!data.choices,
      hasResponse: !!data.response,
      hasAnswer: !!data.answer,
      hasData: !!data.data,
      hasSessionId: !!data.session_id,
      keys: Object.keys(data).slice(0, 10)
    });
    
    // Extract session_id for future requests
    let newSessionId = undefined;
    if (data.session_id) {
      newSessionId = data.session_id;
      console.log('📝 [VOICE-API] Got new session ID from response:', newSessionId);
    } else if (!sessionId) {
      console.log('⚠️ [VOICE-API] No session ID in response and none provided - this might cause issues');
    }
    
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
      console.error('❌ [VOICE-API] Unexpected response format:', data);
      responseContent = 'I couldn\'t understand the response format.';
    }
    
    return { response: responseContent, sessionId: newSessionId };
  } catch (error) {
    console.error('❌ [VOICE-API] CustomGPT proxy error:', error);
    
    // Fallback to OpenAI if CustomGPT fails
    const openai = getOpenAIClient();
    const openaiResponse = await getOpenAICompletion(userPrompt, conversation, openai);
    return { response: openaiResponse, sessionId: sessionId || undefined };
  }
}

async function getOpenAICompletion(userPrompt: string, conversation: any[], openai: OpenAI | null): Promise<string> {
  if (!openai) {
    // If no OpenAI client, return a simple message
    return 'Voice chat requires OpenAI API key configuration.';
  }
  
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant with a voice interface. Keep your responses very succinct and limited to a single sentence since the user is interacting with you through a voice interface.'
      },
      ...conversation,
      { role: 'user', content: userPrompt }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      max_tokens: 100,
    });

    return completion.choices[0].message.content || 'I couldn\'t generate a response.';
  } catch (error) {
    console.error('OpenAI completion error:', error);
    throw new Error('Failed to get AI completion');
  }
}

async function textToSpeech(text: string, openai: OpenAI): Promise<Buffer> {
  // Always use OpenAI TTS for now
  return await openaiTextToSpeech(text, openai);
}

async function openaiTextToSpeech(text: string, openai: OpenAI): Promise<Buffer> {
  try {
    console.log('🔊 [VOICE-API] Starting text-to-speech conversion...');
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
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