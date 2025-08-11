import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get deployment mode from header
    const deploymentMode = request.headers.get('X-Deployment-Mode') || 'production';
    
    // Get OpenAI API key based on deployment mode
    let openaiApiKey: string | undefined;
    
    if (deploymentMode === 'demo') {
      // In demo mode, get OpenAI key from header
      openaiApiKey = request.headers.get('X-OpenAI-API-Key') || undefined;
    } else {
      // In production mode, use environment variable
      openaiApiKey = process.env.OPENAI_API_KEY;
    }
    
    if (!openaiApiKey) {
      const errorMessage = deploymentMode === 'demo'
        ? 'OpenAI API key is required for speech transcription. Please add it in demo settings.'
        : 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Parse request body
    const { audio, mimeType } = await request.json();
    
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Determine file extension based on mime type
    let fileExtension = 'webm';
    if (mimeType === 'audio/mp4') {
      fileExtension = 'mp4';
    } else if (mimeType === 'audio/mpeg') {
      fileExtension = 'mp3';
    } else if (mimeType === 'audio/wav') {
      fileExtension = 'wav';
    }

    // Create form data for OpenAI API
    const formData = new FormData();
    
    // Create a blob from the buffer
    const blob = new Blob([audioBuffer], { type: mimeType });
    
    // Append the audio file
    formData.append('file', blob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // You can make this configurable
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      return NextResponse.json(
        { error: 'Transcription failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the transcribed text
    return NextResponse.json({
      text: data.text,
      language: data.language,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}