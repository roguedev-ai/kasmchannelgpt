/**
 * Streaming TTS Manager
 * 
 * Handles chunked text-to-speech for faster voice responses
 */

export class StreamingTTSManager {
  private audioQueue: AudioBuffer[] = [];
  private pendingChunks: Map<number, AudioBuffer> = new Map(); // Store chunks by ID
  private nextExpectedChunkId = 0; // Track which chunk should play next
  private isPlaying = false;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private onPlaybackComplete?: () => void;
  private onError?: (error: string) => void;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Add a text chunk to be converted to speech and queued
   */
  async addTextChunk(text: string, voice: string = 'alloy') {
    try {
      // Convert text to speech
      const audioBuffer = await this.textToSpeech(text, voice);
      
      // Add to queue
      this.audioQueue.push(audioBuffer);
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextChunk();
      }
    } catch (error) {
      console.error('Failed to add text chunk:', error);
      this.onError?.('Failed to generate speech for chunk');
    }
  }

  /**
   * Add a pre-generated audio buffer directly to the queue
   * Used for streaming responses that provide ready audio chunks
   */
  async addAudioBuffer(audioBuffer: AudioBuffer) {
    try {
      // Add to queue - for backward compatibility without chunk ID
      this.audioQueue.push(audioBuffer);
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextChunk();
      }
    } catch (error) {
      console.error('Failed to add audio buffer:', error);
      this.onError?.('Failed to queue audio buffer');
    }
  }

  /**
   * Add an audio buffer with a specific chunk ID to ensure ordered playback
   */
  async addAudioBufferWithId(audioBuffer: AudioBuffer, chunkId: number) {
    try {
      console.log(`[StreamingTTS] Adding chunk ${chunkId}, expecting ${this.nextExpectedChunkId}`);
      
      // Store the chunk
      this.pendingChunks.set(chunkId, audioBuffer);
      
      // Check if we can queue any pending chunks in order
      while (this.pendingChunks.has(this.nextExpectedChunkId)) {
        const chunk = this.pendingChunks.get(this.nextExpectedChunkId)!;
        this.pendingChunks.delete(this.nextExpectedChunkId);
        
        console.log(`[StreamingTTS] Queuing chunk ${this.nextExpectedChunkId} in order`);
        this.audioQueue.push(chunk);
        this.nextExpectedChunkId++;
        
        // Start playing if not already playing
        if (!this.isPlaying) {
          this.playNextChunk();
        }
      }
      
      console.log(`[StreamingTTS] Pending chunks: ${Array.from(this.pendingChunks.keys()).sort().join(', ')}`);
    } catch (error) {
      console.error('Failed to add audio buffer with ID:', error);
      this.onError?.('Failed to queue audio buffer');
    }
  }

  /**
   * Convert text to speech using OpenAI TTS API
   */
  private async textToSpeech(text: string, voice: string): Promise<AudioBuffer> {
    if (!text.trim()) {
      throw new Error('Empty text provided');
    }

    // Call TTS API
    const response = await fetch('/api/proxy/tts/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Use faster model for streaming
        input: text,
        voice: voice,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Play the next audio chunk in the queue
   */
  private async playNextChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.onPlaybackComplete?.();
      return;
    }

    if (!this.audioContext) {
      console.error('AudioContext not available');
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift();

    if (!audioBuffer) return;

    try {
      // Create and configure audio source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      // Set up completion handler
      this.currentSource.onended = () => {
        this.currentSource = null;
        // Add a small delay between chunks for smoother playback
        setTimeout(() => {
          this.playNextChunk(); // Play next chunk
        }, 50);
      };

      // Start playback
      this.currentSource.start(0);
      
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
      // Try to continue with the next chunk
      setTimeout(() => {
        this.playNextChunk();
      }, 100);
    }
  }

  /**
   * Stop all playback and clear queue
   */
  stopPlayback() {
    // Stop current audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Ignore errors from stopping already stopped sources
      }
      this.currentSource = null;
    }

    // Clear queue and pending chunks
    this.audioQueue = [];
    this.pendingChunks.clear();
    this.nextExpectedChunkId = 0;
    this.isPlaying = false;
  }

  /**
   * Reset the chunk ID counter for a new streaming session
   */
  resetChunkCounter() {
    this.nextExpectedChunkId = 0;
    this.pendingChunks.clear();
    console.log('[StreamingTTS] Chunk counter reset for new session');
  }

  /**
   * Check if audio is currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get number of chunks in queue
   */
  getQueueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Set callback for when all queued audio finishes playing
   */
  onPlaybackCompleted(callback: () => void) {
    this.onPlaybackComplete = callback;
  }

  /**
   * Set callback for errors
   */
  onStreamingError(callback: (error: string) => void) {
    this.onError = callback;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopPlayback();
    this.pendingChunks.clear();
    this.nextExpectedChunkId = 0;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Text chunking utilities for optimal TTS streaming
 */
export class TextChunker {
  /**
   * Split text into optimal chunks for TTS
   * Aims for natural speech breaks while keeping chunks reasonably sized
   */
  static chunkText(text: string, maxChunkSize: number = 200): string[] {
    const chunks: string[] = [];
    
    // Split by sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      // If adding this sentence would exceed max size and we have content, finalize chunk
      if (currentChunk && (currentChunk.length + trimmedSentence.length + 2) > maxChunkSize) {
        chunks.push(currentChunk.trim() + '.');
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim() + (currentChunk.endsWith('.') ? '' : '.'));
    }
    
    return chunks;
  }

  /**
   * Smart chunking that considers punctuation and natural breaks
   */
  static smartChunk(text: string, targetChunkSize: number = 150): string[] {
    const chunks: string[] = [];
    
    // Priority order for splitting: sentences, clauses, phrases, words
    const breakPoints = [
      /[.!?]+\s+/g,  // Sentence endings
      /[,;:]\s+/g,   // Clause breaks
      /\s+(?=and|but|or|so|yet|for|nor)\s+/g, // Conjunctions
      /\s+/g         // Word breaks (fallback)
    ];
    
    let remainingText = text;
    
    while (remainingText.length > targetChunkSize) {
      let bestSplit = -1;
      
      // Try each break point type in order of preference
      for (const breakRegex of breakPoints) {
        const matches = Array.from(remainingText.matchAll(breakRegex));
        
        // Find the best split point (closest to target size without going over)
        for (const match of matches) {
          const splitIndex = match.index! + match[0].length;
          if (splitIndex <= targetChunkSize && splitIndex > bestSplit) {
            bestSplit = splitIndex;
          }
        }
        
        if (bestSplit > 0) break; // Found a good split
      }
      
      // If no good split found, split at target size
      if (bestSplit <= 0) {
        bestSplit = targetChunkSize;
      }
      
      chunks.push(remainingText.slice(0, bestSplit).trim());
      remainingText = remainingText.slice(bestSplit).trim();
    }
    
    // Add final chunk
    if (remainingText) {
      chunks.push(remainingText);
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }
}