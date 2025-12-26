# Voice Support in Distri

Distri now supports voice interactions including speech-to-text (STT) and text-to-speech (TTS) functionality.

## Features

- 🎤 **Voice Recording**: Click and hold to record voice messages that are automatically transcribed to text
- 🗣️ **Text-to-Speech**: Convert AI responses to speech using OpenAI or Gemini TTS
- 🔄 **Real-time Transcription**: Audio is processed using OpenAI's Whisper model
- 🎛️ **Configurable**: Support for multiple TTS providers and voice settings

## Backend Setup

### 1. Add TTS API Keys

Add the following to your `.env` file:

```bash
# TTS API Keys (for voice support)
OPENAI_API_KEY="sk-your-openai-api-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 2. Start the Distri Server

The voice functionality is automatically available when you start the Distri server:

```bash
cd distri
cargo run --bin distri-server
```

### 3. API Endpoints

The following endpoints are available:

- `POST /v1/tts/synthesize` - Convert text to speech
- `GET /v1/tts/voices` - Get available voices for each provider

## Frontend Integration

### 1. Enable Voice in Chat Component

```tsx
import { Chat } from '@distri/react';

function MyApp() {
  return (
    <Chat
      agent={agent}
      threadId="your-thread-id"
      voiceEnabled={true}
      ttsConfig={{
        model: 'openai', // or 'gemini'
        voice: 'alloy',  // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
        speed: 1.0
      }}
    />
  );
}
```

### 2. Available Hooks

You can also use the voice functionality directly:

```tsx
import { useSpeechToText, useTts } from '@distri/react';

function MyComponent() {
  const speechToText = useSpeechToText({
    model: 'whisper-1'
  });
  
  const tts = useTts({
    baseUrl: 'http://localhost:8080/v1'
  });

  const handleAudioBlob = async (audioBlob: Blob) => {
    // Transcribe audio to text
    const text = await speechToText.transcribe(audioBlob);
    console.log('Transcribed text:', text);
  };

  const handleTextToSpeech = async (text: string) => {
    // Convert text to speech
    const audioBlob = await tts.synthesize({
      text,
      model: 'openai',
      voice: 'alloy'
    });
    
    // Play the audio
    await tts.playAudio(audioBlob);
  };
}
```

## Configuration Options

### TTS Models

**OpenAI TTS**
- Model: `tts-1`
- Voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- Speed: 0.25 to 4.0

**Gemini TTS**
- Voices: `en-US-Standard-A`, `en-US-Standard-B`, `en-US-Wavenet-A`, etc.
- Speed: 0.25 to 4.0

### Speech-to-Text

- Uses OpenAI Whisper (`whisper-1`)
- Supports multiple languages
- Configurable temperature for creativity

## Example Usage

See the Maps Demo for a complete example:

```bash
cd distrijs/samples/maps-demo
pnpm install
pnpm dev
```

The demo includes a voice toggle button that enables/disables voice recording functionality.

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Requires HTTPS for microphone access

## Troubleshooting

### Microphone Permission Issues
- Ensure your browser has microphone permissions
- Use HTTPS in production (required by browsers)
- Check browser console for error messages

### API Key Issues
- Verify OpenAI API key is valid and has credits
- Check Gemini API key has Text-to-Speech API enabled
- Ensure environment variables are properly loaded

### Audio Playback Issues
- Check browser audio settings
- Verify Content-Type headers are correct
- Test with different browsers

## Security Notes

- API keys should never be exposed in client-side code in production
- Consider using a proxy server for API calls in production
- Implement rate limiting for TTS endpoints
- Audio data is processed securely and not stored

## Performance Tips

- Audio files are typically 50-200KB per 10 seconds of speech
- Transcription usually takes 1-3 seconds
- TTS synthesis takes 2-5 seconds depending on text length
- Consider caching frequently used TTS responses