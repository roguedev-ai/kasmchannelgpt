import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VOICE_LANGUAGE = process.env.VOICE_LANGUAGE || 'en';
const CUSTOMGPT_API_KEY = process.env.CUSTOMGPT_API_KEY || '';
const CUSTOMGPT_API_BASE_URL = process.env.CUSTOMGPT_API_BASE_URL || 'https://app.customgpt.ai/api/v1';

export async function POST(request: NextRequest) {
  console.log('🎤 [VOICE-API] Request received');
  
  try {
    // Get audio file and conversation from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const projectId = formData.get('projectId') as string;
    const conversationHeader = request.headers.get('conversation') || '';
    
    console.log('📦 [VOICE-API] Request data:', {
      hasAudioFile: !!audioFile,
      audioSize: audioFile ? `${(audioFile.size / 1024).toFixed(2)}KB` : 'N/A',
      projectId,
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

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ [VOICE-API] OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Step 1: Transcribe audio using Whisper
    console.log('🎯 [VOICE-API] Step 1: Transcribing audio with Whisper...');
    const transcription = await transcribeAudio(audioFile);
    console.log('✅ [VOICE-API] Transcription complete:', transcription);

    // Step 2: Get completion from CustomGPT
    console.log('🎯 [VOICE-API] Step 2: Getting AI response...');
    const conversation = conversationHeader 
      ? JSON.parse(Buffer.from(conversationHeader, 'base64').toString('utf-8'))
      : [];
    
    console.log('💬 [VOICE-API] Conversation history length:', conversation.length);
    
    const aiResponse = await getCustomGPTCompletion(transcription, conversation, projectId);
    console.log('✅ [VOICE-API] AI response received:', aiResponse);

    // Step 3: Convert response to speech
    console.log('🎯 [VOICE-API] Step 3: Converting to speech...');
    const audioBuffer = await textToSpeech(aiResponse);
    console.log('✅ [VOICE-API] Speech synthesis complete, size:', `${(audioBuffer.length / 1024).toFixed(2)}KB`);

    // Construct response header with conversation (keep existing format for compatibility)
    const updatedConversation = [
      ...conversation,
      { role: 'user', content: transcription },
      { role: 'assistant', content: aiResponse }
    ];
    
    const responseHeader = Buffer.from(JSON.stringify(updatedConversation)).toString('base64');

    // Return audio response with conversation in header
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'text': responseHeader,
      },
    });

  } catch (error) {
    console.error('Voice inference error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    );
  }
}

async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a File-like object for OpenAI
    const file = new File([buffer], audioFile.name || 'audio.wav', {
      type: audioFile.type || 'audio/wav',
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: VOICE_LANGUAGE,
    });

    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

async function getCustomGPTCompletion(userPrompt: string, conversation: any[], projectId: string): Promise<string> {
  try {
    console.log('🎯 [VOICE-API] Using CustomGPT OpenAI-compatible endpoint');
    
    // Create CustomGPT client using OpenAI SDK compatibility
    const customGPTClient = new OpenAI({
      apiKey: CUSTOMGPT_API_KEY,
      baseURL: `${CUSTOMGPT_API_BASE_URL}/projects/${projectId}/`, // OpenAI-compatible base URL
    });
    
    // Build messages array in OpenAI format
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful assistant with a voice interface. Keep your responses very succinct and limited to 1-2 sentences since the user is interacting through voice.'
      },
      // Add conversation history
      ...conversation,
      // Add current user message
      { role: 'user' as const, content: userPrompt }
    ];
    
    console.log('📱 [VOICE-API] Sending OpenAI-format request to CustomGPT');
    
    // Use standard OpenAI chat completion call
    const completion = await customGPTClient.chat.completions.create({
      model: 'gpt-3.5-turbo', // Model parameter ignored by CustomGPT but required by SDK
      messages: messages,
      max_tokens: 150, // Keep responses concise for voice
      temperature: 0.7,
    });
    
    const responseText = completion.choices[0].message.content || 'I couldn\'t generate a response.';
    console.log('🎯 [VOICE-API] CustomGPT OpenAI response:', responseText.substring(0, 100) + '...');
    
    return responseText;
  } catch (error) {
    console.error('CustomGPT OpenAI-compatible completion error:', error);
    // Fallback to OpenAI if CustomGPT fails
    return await getOpenAICompletion(userPrompt, conversation);
  }
}

async function getOpenAICompletion(userPrompt: string, conversation: any[]): Promise<string> {
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

async function textToSpeech(text: string): Promise<Buffer> {
  // Always use OpenAI TTS for now
  return await openaiTextToSpeech(text);
}

async function openaiTextToSpeech(text: string): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    throw new Error('Failed to convert text to speech');
  }
}