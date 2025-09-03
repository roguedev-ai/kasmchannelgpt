import { utils } from "@ricky0123/vad-react";
import type { VoiceOption, PersonaOption } from '@/store/voice-settings';
import { StreamingTTSManager } from './streaming-tts';

export interface VoiceCallbacks {
  onUserSpeaking?: () => void;
  onProcessing?: () => void;
  onAiSpeaking?: () => void;
  onReset?: () => void;
  onError?: (error: string) => void;
  onDebug?: (message: string, data?: any) => void;
  // New callbacks for message store integration
  onTranscriptReceived?: (transcript: string) => void;
  onResponseReceived?: (response: string) => void;
  // Streaming callbacks
  onStreamingTextChunk?: (textChunk: string) => void;
  onStreamingAudioReady?: (audioUrl: string, chunkId: string) => void;
  onStreamingComplete?: (fullResponse: string, transcript: string) => void;
}

class SpeechManager {
  private source: AudioBufferSourceNode | null = null;
  private sourceIsStarted = false;
  private conversationThusFar: any[] = [];
  private callbacks: VoiceCallbacks = {};
  private projectId: string | null = null;
  private sessionId: string | null = null;
  private voiceSettings: { voice: VoiceOption; persona: PersonaOption } | null = null;
  private streamingTTS: StreamingTTSManager | null = null;
  private chatbotModel: string = 'gpt-3.5-turbo'; // Default to fast model for voice if not specified by agent
  // Streaming is always enabled for optimal performance

  setCallbacks(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
    this.debug("Callbacks set", { hasCallbacks: Object.keys(callbacks) });
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
    this.debug("Project ID set", { projectId });
  }

  setSessionId(sessionId: string | null) {
    this.sessionId = sessionId;
    this.debug("Session ID set", { sessionId });
  }

  setVoiceSettings(voice: VoiceOption, persona: PersonaOption) {
    this.voiceSettings = { voice, persona };
    this.debug("Voice settings set", { voice, persona });
  }

  setChatbotModel(model: string) {
    this.chatbotModel = model;
    this.debug("Chatbot model set", { model });
  }

  private debug(message: string, data?: any) {
    // Production: Debug logging disabled
    // Uncomment for development debugging:
    // const timestamp = new Date().toISOString();
    // console.log(`🎯 [SPEECH-MANAGER ${timestamp}] ${message}`, data || '');
    this.callbacks.onDebug?.(message, data);
  }

  private error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`❌ [SPEECH-MANAGER ${timestamp}] ${message}`, error || '');
    this.callbacks.onError?.(message);
  }

  onSpeechStart = () => {
    this.debug("Speech started - user is speaking");
    this.callbacks.onUserSpeaking?.();
    this.stopSourceIfNeeded();
  };

  onSpeechEnd = async (audio: Float32Array) => {
    this.debug("Speech ended", { 
      audioLength: audio.length,
      audioDuration: `${audio.length / 16000}s` // Assuming 16kHz sample rate
    });
    await this.processAudio(audio);
  };

  onMisfire = () => {
    this.debug("VAD misfire - noise detected but not speech");
    this.callbacks.onReset?.();
  };

  private stopSourceIfNeeded = () => {
    if (this.source && this.sourceIsStarted) {
      this.debug("Stopping current audio playback");
      this.source.stop(0);
      this.sourceIsStarted = false;
    }
  };

  // Public method to stop audio playback
  public stopAudio = () => {
    this.stopSourceIfNeeded();
    
    // Also stop streaming TTS if active
    if (this.streamingTTS) {
      this.streamingTTS.stopPlayback();
      this.debug("🛑 Streaming TTS stopped");
    }
    
    this.callbacks.onReset?.();
    this.debug("Audio stopped by user");
  };

  // Public method to process manually recorded audio
  public processManualAudio = async (audioBlob: Blob) => {
    this.debug("Processing manual audio", { 
      size: `${(audioBlob.size / 1024).toFixed(2)}KB`,
      type: audioBlob.type
    });
    this.callbacks.onProcessing?.();
    
    try {
      await this.validate(audioBlob);
      await this.sendData(audioBlob);
    } catch (error) {
      this.error('Error processing manual audio', error);
      this.callbacks.onReset?.();
    }
  };

  private processAudio = async (audio: Float32Array) => {
    this.debug("Processing audio started");
    this.callbacks.onProcessing?.();
    
    try {
      const blob = this.createAudioBlob(audio);
      await this.validate(blob);
      await this.sendData(blob);
    } catch (error) {
      this.error('Error processing audio', error);
      this.callbacks.onReset?.();
    }
  };

  private createAudioBlob = (audio: Float32Array): Blob => {
    const wavBuffer = utils.encodeWAV(audio);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    this.debug("Created audio blob", { 
      size: `${(blob.size / 1024).toFixed(2)}KB`,
      type: blob.type,
      samples: audio.length,
      duration: `${audio.length / 16000}s` // Assuming 16kHz from VAD
    });
    return blob;
  };

  private sendData = async (blob: Blob) => {
    // Always use streaming mode
    await this.sendStreamingData(blob);
  };

  private sendStreamingData = async (blob: Blob) => {
    this.debug("🚀 Sending audio data to streaming API");
    
    if (!this.projectId) {
      this.error('No project ID set - cannot send audio');
      this.callbacks.onReset?.();
      return;
    }

    // Initialize streaming TTS manager
    if (!this.streamingTTS) {
      this.streamingTTS = new StreamingTTSManager();
      this.streamingTTS.onPlaybackCompleted(() => {
        this.debug("🔄 Streaming playback completed");
        this.callbacks.onReset?.();
      });
      this.streamingTTS.onStreamingError((error) => {
        this.error('🎵 Streaming TTS error', error);
      });
    } else {
      // Reset chunk counter for new streaming session
      this.streamingTTS.resetChunkCounter();
    }

    const formData = new FormData();
    formData.append("audio", blob, "audio.wav");
    console.log('📤 [SPEECH-MANAGER] Sending project_id:', this.projectId);
    formData.append("project_id", this.projectId);
    if (this.sessionId) {
      console.log('📤 [SPEECH-MANAGER] Sending session_id:', this.sessionId);
      formData.append("session_id", this.sessionId);
    }
    
    // Add voice settings to the request
    if (this.voiceSettings) {
      formData.append("voice", this.voiceSettings.voice);
      formData.append("persona", this.voiceSettings.persona);
    }
    
    // Note: chatbot_model is not sent to voice API
    // The agent's configured model will be used automatically

    this.debug("🔄 Starting streaming voice request", {
      projectId: this.projectId,
      sessionId: this.sessionId,
      conversationLength: this.conversationThusFar.length,
      audioSize: `${(blob.size / 1024).toFixed(2)}KB`,
      voice: this.voiceSettings?.voice,
      persona: this.voiceSettings?.persona,
      lastMessages: this.conversationThusFar.slice(-2).map(m => ({ role: m.role, preview: m.content.slice(0, 50) }))
    });

    try {
      // Check for demo mode OpenAI key
      const headers: Record<string, string> = {
        'conversation': this.base64Encode(JSON.stringify(this.conversationThusFar))
      };
      
      // Add deployment mode header
      const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
      headers['X-Deployment-Mode'] = deploymentMode;
      
      console.log('🔍 [SPEECH-MANAGER] Deployment mode from localStorage:', deploymentMode);
      console.log('🔍 [SPEECH-MANAGER] localStorage value:', localStorage.getItem('customgpt.deploymentMode'));
      console.log('🔍 [SPEECH-MANAGER] Sending headers:', headers);
      
      // In demo mode, add keys from window object if available
      if (deploymentMode === 'demo') {
        // Add OpenAI key for TTS/STT
        if ((window as any).__demoOpenAIKey) {
          headers['X-OpenAI-API-Key'] = (window as any).__demoOpenAIKey;
        }
        // Add CustomGPT API key for chat completions
        if ((window as any).__demoCustomGPTKey) {
          headers['X-CustomGPT-API-Key'] = (window as any).__demoCustomGPTKey;
        }
      }
      
      const response = await fetch("/api/proxy/voice/streaming", {
        method: "POST",
        body: formData,
        headers
      });

      this.debug("🎯 Streaming response received", {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // Check if it's specifically an OpenAI API key error
        if (response.status === 503 && errorData.userMessage) {
          throw new Error(errorData.userMessage);
        }
        
        throw new Error(`Streaming API Error (${response.status}): ${errorData.error || errorText}`);
      }

      // Process streaming response
      await this.processStreamingResponse(response);
    } catch (error) {
      this.error("❌ Failed to process streaming voice", error);
      this.handleError(error);
    }
  };

  private processStreamingResponse = async (response: Response) => {
    if (!response.body) {
      throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let fullResponse = '';
    let transcript = '';
    let currentStreamingActive = false;

    this.debug("🔄 Processing streaming response chunks");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          this.debug("✅ Streaming response complete");
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'text') {
                // Stream text chunk
                fullResponse += parsed.text;
                
                // Trigger UI update for text streaming
                this.callbacks.onStreamingTextChunk?.(parsed.text);
                
                this.debug(`📝 Text chunk received: "${parsed.text}"`);
                
              } else if (parsed.type === 'audio' || parsed.type === 'audio_ref') {
                // Audio chunk ready - queue it for playback
                if (parsed.audioUrl || parsed.audioId) {
                  if (!currentStreamingActive) {
                    this.callbacks.onAiSpeaking?.();
                    currentStreamingActive = true;
                  }
                  
                  // Handle both legacy data URL and new audio reference
                  if (parsed.audioUrl) {
                    // Legacy: Convert data URL to audio and queue it
                    await this.queueAudioChunk(parsed.audioUrl, parsed.chunkId);
                  } else if (parsed.audioId) {
                    // New: Fetch audio chunk by ID
                    await this.queueAudioChunkById(parsed.audioId, parsed.chunkId);
                  }
                  
                  this.debug(`🎵 Audio chunk queued: ${parsed.chunkId} (${parsed.text?.slice(0, 50)}...)`);
                }
                
              } else if (parsed.type === 'complete') {
                // Stream complete
                fullResponse = parsed.fullResponse || fullResponse;
                transcript = parsed.transcript || transcript;
                
                this.debug("✅ Stream complete", { 
                  responseLength: fullResponse.length,
                  transcript 
                });
                
                console.log(`📝 [SPEECH-MANAGER] Complete fullResponse (${fullResponse.length} chars):`, fullResponse);
                console.log(`📝 [SPEECH-MANAGER] Includes "individuals":`, fullResponse.includes('individuals'));
                console.log(`📝 [SPEECH-MANAGER] Includes "like":`, fullResponse.includes('like'));
                console.log(`📝 [SPEECH-MANAGER] Includes "CustomGPT":`, fullResponse.includes('CustomGPT'));
                
                // Trigger callbacks for UI updates
                // Don't update conversationThusFar here - let the message store be the single source of truth
                if (transcript) {
                  this.callbacks.onTranscriptReceived?.(transcript);
                }
                
                if (fullResponse) {
                  this.callbacks.onResponseReceived?.(fullResponse);
                }
                
                this.callbacks.onStreamingComplete?.(fullResponse, transcript);
                
              } else if (parsed.type === 'error') {
                // Stream error
                this.error(`🚨 Stream error: ${parsed.error}`);
                this.callbacks.onReset?.();
              }
            } catch (parseError) {
              this.debug(`⚠️ Failed to parse chunk: ${data}`, parseError);
            }
          }
        }
      }
    } catch (error) {
      this.error("❌ Error processing streaming response", error);
      this.callbacks.onReset?.();
    } finally {
      reader.releaseLock();
    }
  };

  private queueAudioChunk = async (audioDataUrl: string, chunkId: string) => {
    if (!this.streamingTTS) {
      this.error("❌ StreamingTTS not initialized");
      return;
    }

    try {
      // Extract numeric chunk ID from the string (e.g., "chunk_0" -> 0)
      const numericChunkId = parseInt(chunkId.replace('chunk_', ''));
      
      // Convert data URL to blob
      const response = await fetch(audioDataUrl);
      const audioBlob = await response.blob();
      
      // Convert blob to ArrayBuffer for Web Audio API
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Queue the decoded audio buffer with ID for ordered playback
      await this.streamingTTS.addAudioBufferWithId(audioBuffer, numericChunkId);
      
      this.debug(`🎵 Audio chunk queued with ID ${numericChunkId}: ${chunkId}`);
    } catch (error) {
      this.error(`❌ Failed to queue audio chunk ${chunkId}`, error);
    }
  };

  // Legacy sendLegacyData method removed - streaming is always used
  
  private queueAudioChunkById = async (audioId: string, chunkId: string) => {
    if (!this.streamingTTS) {
      this.error("❌ StreamingTTS not initialized");
      return;
    }

    try {
      // Extract numeric chunk ID from the string (e.g., "chunk_0" -> 0)
      const numericChunkId = parseInt(chunkId.replace('chunk_', ''));
      
      // Fetch audio chunk by ID from the streaming endpoint
      const response = await fetch(`/api/proxy/voice/streaming?id=${audioId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Audio chunk not found - this can happen after server restart
          this.debug(`⚠️ Audio chunk not found (server may have restarted): ${chunkId}`);
          return; // Skip this chunk gracefully
        }
        throw new Error(`Failed to fetch audio chunk: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      
      // Convert blob to ArrayBuffer for Web Audio API
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Create audio context and decode
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Queue the decoded audio buffer with ID for ordered playback
      await this.streamingTTS.addAudioBufferWithId(audioBuffer, numericChunkId);
      
      this.debug(`🎵 Audio chunk fetched and queued with ID ${numericChunkId}: ${chunkId}`);
    } catch (error) {
      this.error(`❌ Failed to fetch/queue audio chunk ${chunkId}`, error);
    }
  };

  // Legacy sendLegacyData method removed - streaming is always used

  private base64Encode(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return window.btoa(String.fromCharCode(...new Uint8Array(data)));
  }

  private base64Decode(base64: string): string {
    const binaryStr = window.atob(base64);
    const bytes = new Uint8Array([...binaryStr].map((char) => char.charCodeAt(0)));
    return new TextDecoder().decode(bytes);
  }

  private handleSuccess = async (blob: Blob) => {
    this.debug("Playing AI response audio");
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.stopSourceIfNeeded();

      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      this.debug("Audio decoded", {
        duration: `${audioBuffer.duration.toFixed(2)}s`,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });

      this.source = audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.connect(audioContext.destination);
      this.source.start(0);
      this.sourceIsStarted = true;
      
      this.source.onended = () => {
        this.debug("Audio playback ended");
        this.callbacks.onReset?.();
      };

      this.callbacks.onAiSpeaking?.();
    } catch (error) {
      this.error("Failed to play audio", error);
      this.callbacks.onReset?.();
    }
  };

  private handleError = (error: any) => {
    this.error(`Error encountered: ${error.message}`, error);
    this.callbacks.onReset?.();
  };

  private validate = async (data: Blob) => {
    this.debug("Validating audio duration");
    
    try {
      // Clone the blob to avoid consuming the arrayBuffer
      const clonedBlob = new Blob([data], { type: data.type });
      const arrayBuffer = await clonedBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const decodedData = await audioContext.decodeAudioData(arrayBuffer);
      const duration = decodedData.duration;
      const minDuration = 0.4;

      this.debug("Audio validation", {
        duration: `${duration.toFixed(2)}s`,
        minDuration: `${minDuration}s`,
        valid: duration >= minDuration
      });

      if (duration < minDuration) {
        throw new Error(`Duration is ${duration}s, which is less than minimum of ${minDuration}s`);
      }
    } catch (error) {
      this.error("Audio validation failed", error);
      throw error;
    }
  };

  clearConversation() {
    this.conversationThusFar = [];
  }

  getConversationThusFar() {
    return this.conversationThusFar;
  }

  getSessionId() {
    return this.sessionId;
  }

  // Set the conversation history from existing messages
  setConversationHistory(messages: any[]) {
    // Clean and deduplicate messages before setting
    const cleanedMessages = messages
      .filter((msg, index, self) => 
        // Remove duplicates based on content and role
        index === self.findIndex(m => m.content === msg.content && m.role === msg.role)
      )
      .filter(msg => 
        // Filter out placeholder messages that shouldn't be sent to the API
        !msg.content.includes('🎤 Processing voice input') && 
        !msg.content.includes('Processing voice input...')
      )
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    this.conversationThusFar = cleanedMessages;
    this.debug("Conversation history loaded", {
      messageCount: this.conversationThusFar.length,
      originalCount: messages.length,
      filtered: messages.length - cleanedMessages.length
    });
  }


  // Public method to clean up streaming resources
  public destroy() {
    this.stopAudio();
    if (this.streamingTTS) {
      this.streamingTTS.destroy();
      this.streamingTTS = null;
    }
    this.debug("🧹 SpeechManager destroyed");
  }
}

export const speechManager = new SpeechManager();