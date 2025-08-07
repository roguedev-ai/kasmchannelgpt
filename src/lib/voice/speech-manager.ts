import { utils } from "@ricky0123/vad-react";

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
}

class SpeechManager {
  private source: AudioBufferSourceNode | null = null;
  private sourceIsStarted = false;
  private conversationThusFar: any[] = [];
  private callbacks: VoiceCallbacks = {};
  private projectId: string | null = null;

  setCallbacks(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
    this.debug("Callbacks set", { hasCallbacks: Object.keys(callbacks) });
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
    this.debug("Project ID set", { projectId });
  }

  private debug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`🎯 [SPEECH-MANAGER ${timestamp}] ${message}`, data || '');
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
    this.callbacks.onReset?.();
    this.debug("Audio stopped by user");
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
    this.debug("Preparing to send audio data to server");
    
    if (!this.projectId) {
      this.error('No project ID set - cannot send audio');
      this.callbacks.onReset?.();
      return;
    }

    const formData = new FormData();
    formData.append("audio", blob, "audio.wav");
    formData.append("projectId", this.projectId);

    this.debug("Sending request to voice API", {
      projectId: this.projectId,
      conversationLength: this.conversationThusFar.length,
      audioSize: `${(blob.size / 1024).toFixed(2)}KB`
    });

    try {
      const response = await fetch("/api/proxy/voice/inference", {
        method: "POST",
        body: formData,
        headers: {
          'conversation': this.base64Encode(JSON.stringify(this.conversationThusFar))
        }
      });

      this.debug("Response received", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
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
        
        throw new Error(`API Error (${response.status}): ${errorData.error || errorText}`);
      }

      const textHeader = response.headers.get("text");
      if (!textHeader) {
        throw new Error("No text header in response");
      }

      const newMessages = JSON.parse(this.base64Decode(textHeader));
      this.debug("Messages decoded", { newMessages });
      
      // Extract user transcript and AI response for conversation store
      if (newMessages.length > 0) {
        if (newMessages[0].role === 'user') {
          const transcript = newMessages[0].content;
          this.callbacks.onDebug?.(`You said: "${transcript}"`, newMessages[0]);
          this.callbacks.onTranscriptReceived?.(transcript);
        }
        
        if (newMessages.length > 1 && newMessages[1].role === 'assistant') {
          const response = newMessages[1].content;
          this.callbacks.onResponseReceived?.(response);
        } else if (newMessages.length === 1 && newMessages[0].role === 'assistant') {
          // Sometimes only the assistant response is returned
          const response = newMessages[0].content;
          this.callbacks.onResponseReceived?.(response);
        }
      }
      
      this.conversationThusFar.push(...newMessages);
      
      const audioBlob = await response.blob();
      this.debug("Audio blob received", {
        size: `${(audioBlob.size / 1024).toFixed(2)}KB`,
        type: audioBlob.type
      });
      
      await this.handleSuccess(audioBlob);
    } catch (error) {
      this.error("Failed to send audio data", error);
      this.handleError(error);
    }
  };

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
}

export const speechManager = new SpeechManager();