# Voice Chat Feature

The CustomGPT UI includes a voice chat feature that allows users to interact with their AI agents using speech instead of typing. This feature uses OpenAI's Whisper for speech-to-text transcription and OpenAI's TTS (Text-to-Speech) for AI responses.

## Prerequisites

To use the voice chat feature, you need:

1. **OpenAI API Key** - Required for both speech transcription (Whisper) and text-to-speech generation
2. **CustomGPT API Key** - Your existing CustomGPT API key (already configured)

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Required for voice feature
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Set voice transcription language (defaults to 'en')
# Supported languages: en, es, fr, de, it, pt, ja, ko, zh, etc.
VOICE_LANGUAGE=en
```

### 3. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Using Voice Chat

1. **Open Voice Modal**: Click the microphone icon in the chat input area
2. **Start Recording**: 
   - The app will attempt to use Voice Activity Detection (VAD) for automatic recording
   - If VAD fails, use the manual recording button (hold to record)
3. **Speak Your Message**: The system will transcribe your speech
4. **Receive AI Response**: The AI's response will be played back as speech

## Troubleshooting

### Common Issues

#### "Failed to process voice request" Error
- **Cause**: Missing OpenAI API key
- **Solution**: Ensure `OPENAI_API_KEY` is set in your `.env.local` file

#### "Invalid OpenAI API key" Error
- **Cause**: Incorrect or expired API key
- **Solution**: Verify your OpenAI API key is correct and has sufficient credits

#### "VAD initialization failed" Error
- **Cause**: Browser doesn't support required WebAssembly features
- **Solution**: Use the manual recording mode (hold button to record)

#### No Audio Playback
- **Cause**: Browser audio permissions or autoplay restrictions
- **Solution**: Ensure the site has microphone permissions and try interacting with the page first

### API Requirements

The voice feature makes the following API calls:

1. **Whisper API** (`whisper-1` model) - For speech-to-text transcription
2. **TTS API** (`tts-1` model with `alloy` voice) - For text-to-speech generation
3. **CustomGPT API** - For generating AI responses (uses your existing setup)

### Cost Considerations

Using the voice feature incurs OpenAI API costs:
- **Whisper**: $0.006 per minute of audio
- **TTS**: $0.015 per 1,000 characters

## Technical Details

### Audio Format
- **Input**: WAV format (16kHz or higher recommended)
- **Output**: MP3 format for AI speech responses

### Browser Compatibility
- **Chrome/Edge**: Full support including VAD
- **Firefox**: Full support, VAD may require fallback
- **Safari**: Manual recording mode recommended

### Security
- All API keys are stored server-side only
- Audio data is processed through your Next.js API routes
- No audio is stored permanently

## Advanced Configuration

### Custom Voice Settings

You can modify the voice settings in `/src/app/api/proxy/voice/inference/route.ts`:

```typescript
// Change TTS voice (options: alloy, echo, fable, onyx, nova, shimmer)
voice: 'alloy',

// Change TTS model (options: tts-1, tts-1-hd)
model: 'tts-1',
```

### Language Support

The `VOICE_LANGUAGE` environment variable supports all languages that Whisper supports. Common codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

## Development Tips

1. **Test with Short Messages**: Voice responses are optimized for concise interactions
2. **Monitor Console**: Detailed logs are available in browser console for debugging
3. **Check API Usage**: Monitor your OpenAI dashboard for API usage and costs
4. **Handle Errors Gracefully**: The UI will show specific error messages to help with troubleshooting