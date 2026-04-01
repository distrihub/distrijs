import {
  TtsSpeechRequest,
  TtsSpeechResponse,
  TtsVoiceInfo,
} from '../types';

describe('TTS Types', () => {
  describe('TtsSpeechRequest', () => {
    it('should allow minimal request with just input', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello world',
      };
      expect(request.input).toBe('Hello world');
      expect(request.model).toBeUndefined();
      expect(request.voice).toBeUndefined();
      expect(request.provider).toBeUndefined();
    });

    it('should allow full request with all fields', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello world',
        model: 'tts-1-hd',
        voice: 'nova',
        provider: 'openai',
        response_format: 'mp3',
        speed: 1.5,
        instructions: 'Speak with enthusiasm',
      };
      expect(request.model).toBe('tts-1-hd');
      expect(request.voice).toBe('nova');
      expect(request.provider).toBe('openai');
      expect(request.response_format).toBe('mp3');
      expect(request.speed).toBe(1.5);
      expect(request.instructions).toBe('Speak with enthusiasm');
    });

    it('should support Azure OpenAI specific fields', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello',
        provider: 'azure_openai',
        model: 'tts-1',
        azure_deployment: 'my-tts-deployment',
      };
      expect(request.azure_deployment).toBe('my-tts-deployment');
    });

    it('should support Azure Speech specific fields', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello',
        provider: 'azure',
        voice: 'en-US-JennyNeural',
        azure_region: 'westus2',
      };
      expect(request.azure_region).toBe('westus2');
    });

    it('should support ElevenLabs specific fields', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello',
        provider: 'elevenlabs',
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        elevenlabs_model_id: 'eleven_multilingual_v2',
      };
      expect(request.voice_id).toBe('21m00Tcm4TlvDq8ikWAM');
      expect(request.elevenlabs_model_id).toBe('eleven_multilingual_v2');
    });

    it('should serialize to JSON correctly with optional fields omitted', () => {
      const request: TtsSpeechRequest = {
        input: 'Hello world',
        model: 'tts-1',
      };
      const json = JSON.stringify(request);
      const parsed = JSON.parse(json);
      expect(parsed.input).toBe('Hello world');
      expect(parsed.model).toBe('tts-1');
      expect(parsed.voice).toBeUndefined();
      expect(parsed.provider).toBeUndefined();
    });
  });

  describe('TtsSpeechResponse', () => {
    it('should represent a response with all fields', () => {
      const response: TtsSpeechResponse = {
        audio: new ArrayBuffer(100),
        contentType: 'audio/mpeg',
        provider: 'openai',
        model: 'tts-1',
        voice: 'alloy',
      };
      expect(response.audio.byteLength).toBe(100);
      expect(response.contentType).toBe('audio/mpeg');
      expect(response.provider).toBe('openai');
    });

    it('should allow optional metadata fields', () => {
      const response: TtsSpeechResponse = {
        audio: new ArrayBuffer(50),
        contentType: 'audio/wav',
      };
      expect(response.provider).toBeUndefined();
      expect(response.model).toBeUndefined();
      expect(response.voice).toBeUndefined();
    });
  });

});

describe('TTS Request building patterns', () => {
  it('should build a workspace-defaults request (mirrors Rust TtsSpeechRequest::new)', () => {
    const request: TtsSpeechRequest = { input: 'Hello world' };
    // Verify all optional fields are absent (server uses workspace defaults)
    const json = JSON.parse(JSON.stringify(request));
    expect(Object.keys(json)).toEqual(['input']);
  });

  it('should build explicit provider/model request', () => {
    const request: TtsSpeechRequest = {
      input: 'Testing explicit config',
      provider: 'azure_openai',
      model: 'tts-1-hd',
      voice: 'echo',
      response_format: 'wav',
    };
    const json = JSON.parse(JSON.stringify(request));
    expect(json.provider).toBe('azure_openai');
    expect(json.model).toBe('tts-1-hd');
    expect(json.voice).toBe('echo');
    expect(json.response_format).toBe('wav');
  });

  it('should support partial override (only provider, server resolves model)', () => {
    const request: TtsSpeechRequest = {
      input: 'Partial override',
      provider: 'openai',
    };
    const json = JSON.parse(JSON.stringify(request));
    expect(json.provider).toBe('openai');
    expect(json.model).toBeUndefined();
  });
});
