'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMicVAD, utils } from '@ricky0123/vad-react';
import RotateLoader from 'react-spinners/RotateLoader';
import { X, StopCircle, Mic, MicOff, Settings } from 'lucide-react';
import Canvas from './Canvas';
import { VoiceSettings } from './VoiceSettings';
import { speechManager } from '@/lib/voice/speech-manager';
import { particleActions } from '@/lib/voice/particle-manager';
import { useMessageStore, useConversationStore } from '@/hooks/useWidgetStore';
import { useAgentStore } from '@/store/agents';
import { generateId } from '@/lib/utils';
import { useVoiceSettingsStore } from '@/store/voice-settings';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

// Voice states for UI animations
type VoiceState = 'idle' | 'listening' | 'recording' | 'processing' | 'speaking';

// Separate component that handles VAD initialization
function VoiceModalContent({ isOpen, onClose, projectId, projectName }: VoiceModalProps) {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Message store integration
  const { addMessage, messages } = useMessageStore();
  const { currentConversation, ensureConversation } = useConversationStore();
  const [currentUserMessageId, setCurrentUserMessageId] = useState<string | null>(null);
  const [voiceConversation, setVoiceConversation] = useState<any>(null);
  
  // Voice settings integration
  const { selectedVoice, selectedPersona, selectedColorScheme, setVoiceModalOpen } = useVoiceSettingsStore();

  // Initialize VAD with error handling
  const vad = useMicVAD({
    preSpeechPadFrames: 10,
    positiveSpeechThreshold: 0.8,   // Lower threshold for easier detection
    negativeSpeechThreshold: 0.6,   // Lower threshold
    minSpeechFrames: 3,              // Reduce minimum frames
    startOnLoad: false,              // Start manually
    workletURL: '/vad.worklet.bundle.min.js',
    modelURL: '/silero_vad.onnx',
    // VAD configuration
    onSpeechStart: () => {
      console.log('🎤 [VAD] Speech started detected');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Speech started`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onSpeechStart();
    },
    onSpeechEnd: (audio) => {
      console.log('🎤 [VAD] Speech ended, audio length:', audio.length);
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Speech ended, audio length: ${audio.length}`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onSpeechEnd(audio);
    },
    onVADMisfire: () => {
      console.log('🎤 [VAD] Misfire detected');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD: Misfire (noise detected)`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      speechManager.onMisfire();
    }
  });

  // Control global voice modal state for hiding mobile navigation
  useEffect(() => {
    setVoiceModalOpen(isOpen);
  }, [isOpen, setVoiceModalOpen]);

  // Set up speech manager when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      console.log('🔧 [VOICE-MODAL] Setting up speech manager');
      speechManager.setProjectId(projectId);
      
      // Apply voice settings to speech manager
      speechManager.setVoiceSettings(selectedVoice, selectedPersona);
      
      // Apply color scheme to particle manager
      particleActions.setColorScheme(selectedColorScheme);
      
      // Check if agent is active
      const currentAgentStore = useAgentStore.getState();
      const agent = currentAgentStore.agents.find(a => a.id === parseInt(projectId));
      
      if (agent && !agent.is_chat_active) {
        console.warn('⚠️ [VOICE-MODAL] Agent is inactive - may fall back to OpenAI');
        const warningMsg = `${new Date().toLocaleTimeString()} - WARNING: Agent is inactive. Upload documents to activate.`;
        setDebugMessages(prev => [...prev.slice(-10), warningMsg]);
      }
      
      // Ensure we have a conversation before starting voice
      const setupConversation = async () => {
        try {
          let conversation = currentConversation;
          
          // If no current conversation, create one for voice
          if (!conversation) {
            console.log('🔄 [VOICE-MODAL] No current conversation, creating one for voice');
            conversation = await ensureConversation(parseInt(projectId), 'Voice conversation');
            console.log('✅ [VOICE-MODAL] Created conversation:', conversation.id, 'session:', conversation.session_id);
          }
          
          // Load conversation history and session ID
          const conversationMessages = messages.get(conversation.id.toString()) || [];
          console.log('📝 [VOICE-MODAL] Loading conversation history:', conversationMessages.length, 'messages');
          console.log('📝 [VOICE-MODAL] Agent status:', agent?.is_chat_active ? 'Active' : 'Inactive');
          speechManager.setConversationHistory(conversationMessages);
          speechManager.setSessionId(conversation.session_id);
        } catch (error) {
          console.error('❌ [VOICE-MODAL] Failed to setup conversation:', error);
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: Failed to setup conversation`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        }
      };
      
      setupConversation();
      
      speechManager.setCallbacks({
        onUserSpeaking: () => {
          particleActions.onUserSpeaking();
          setTranscript('');
          setVoiceState('recording');
        },
        onProcessing: () => {
          particleActions.onProcessing();
          setVoiceState('processing');
        },
        onAiSpeaking: () => {
          particleActions.onAiSpeaking();
          setIsAgentSpeaking(true);
          setVoiceState('speaking');
        },
        onReset: () => {
          particleActions.reset();
          setIsAgentSpeaking(false);
          setVoiceState('idle');
        },
        onDebug: (message: string, data?: any) => {
          const debugMsg = `${new Date().toLocaleTimeString()} - ${message}`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        },
        onError: (error: string) => {
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: ${error}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          
          // Check if it's an API key error
          if (error.includes('OpenAI API key')) {
            setApiKeyError(true);
          }
        },
        onTranscriptReceived: async (transcript: string) => {
          console.log('🎯 [VOICE-MODAL] Transcript received:', transcript);
          setTranscript(transcript);
          
          // Ensure we have a conversation
          const conversation = await ensureConversation(parseInt(projectId), transcript);
          
          // Store conversation reference for voice messages to prevent race condition
          setVoiceConversation(conversation);
          
          // Update sessionId if we got a new conversation
          if (conversation.session_id && conversation.session_id !== speechManager.getSessionId()) {
            console.log('🔄 [VOICE-MODAL] Updating session ID:', conversation.session_id);
            speechManager.setSessionId(conversation.session_id);
          }
          
          // Create and add user message to chat
          const userMessage = {
            id: generateId(),
            role: 'user' as const,
            content: transcript,
            timestamp: new Date().toISOString(),
            status: 'sent' as const,
          };
          
          setCurrentUserMessageId(userMessage.id);
          addMessage(conversation.id.toString(), userMessage);
          
          const debugMsg = `${new Date().toLocaleTimeString()} - Added user message to chat: "${transcript}"`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        },
        onResponseReceived: async (response: string) => {
          console.log('🎯 [VOICE-MODAL] Response received:', response);
          
          // Display the agent's response in the voice window
          setAgentResponse(response);
          
          // Use voiceConversation to ensure we're adding to the same conversation as the user message
          // This prevents race condition where messages could be added out of order
          const targetConversation = voiceConversation || currentConversation;
          
          if (targetConversation) {
            // Create and add assistant message to chat
            const assistantMessage = {
              id: generateId(),
              role: 'assistant' as const,
              content: response,
              timestamp: new Date().toISOString(),
              status: 'sent' as const,
              citations: [], // Voice responses typically don't have citations
            };
            
            addMessage(targetConversation.id.toString(), assistantMessage);
            
            const debugMsg = `${new Date().toLocaleTimeString()} - Added AI response to chat: "${response.substring(0, 50)}..."`;
            setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
          } else {
            console.warn('⚠️ [VOICE-MODAL] No conversation available for adding assistant message');
          }
        }
      });
    }
    
    // Clean up when modal closes
    if (!isOpen) {
      // Don't clear conversation history to maintain context
      setTranscript('');
      setAgentResponse('');
      setDebugMessages([]);
      setIsAgentSpeaking(false);
      setVoiceConversation(null); // Clear voice conversation reference
    }
  }, [isOpen, projectId, currentConversation, messages, selectedVoice, selectedPersona, selectedColorScheme]);
  
  // Update settings when they change
  useEffect(() => {
    if (isOpen && projectId) {
      // Update speech manager with new voice settings
      speechManager.setVoiceSettings(selectedVoice, selectedPersona);
      
      // Update particle manager with new color scheme
      particleActions.setColorScheme(selectedColorScheme);
    }
  }, [selectedVoice, selectedPersona, selectedColorScheme, isOpen, projectId]);
  
  // Monitor VAD state changes
  useEffect(() => {
    if (vad.errored) {
      const errorMsg = `${new Date().toLocaleTimeString()} - VAD failed to initialize. Manual recording available.`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
    } else if (!vad.loading && !vad.errored) {
      const successMsg = `${new Date().toLocaleTimeString()} - VAD loaded successfully`;
      setDebugMessages(prev => [...prev.slice(-10), successMsg]);
    }
  }, [vad.loading, vad.errored]);

  // Define handleToggleListening before useEffect that uses it
  const handleToggleListening = useCallback(async () => {
    console.log('🔘 [VOICE-MODAL] Toggle listening clicked', { 
      vadLoading: vad.loading,
      vadListening: vad.listening,
      vadErrored: vad.errored
    });
    
    // Add immediate user feedback
    const clickMsg = `${new Date().toLocaleTimeString()} - Button clicked, processing...`;
    setDebugMessages(prev => [...prev.slice(-10), clickMsg]);
    
    // Enhanced error handling for VAD
    if (vad.errored) {
      console.error('❌ [VOICE-MODAL] VAD is in error state, attempting recovery...');
      const errorMsg = `${new Date().toLocaleTimeString()} - VAD ERROR: Attempting to recover. Check browser console.`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
      
      // Try to restart VAD after error
      try {
        console.log('🔄 [VOICE-MODAL] Attempting VAD recovery...');
        // Wait a moment then try to start
        setTimeout(() => {
          if (!vad.listening && !vad.loading) {
            console.log('🔄 [VOICE-MODAL] Retry VAD start after error');
            vad.start();
          }
        }, 1000);
        return;
      } catch (recoveryError) {
        console.error('❌ [VOICE-MODAL] VAD recovery failed:', recoveryError);
        const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: VAD recovery failed. Try refreshing the page.`;
        setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        return;
      }
    }
    
    try {
      if (vad.listening) {
        console.log('⏸️ [VOICE-MODAL] Pausing VAD');
        vad.pause();
        setVoiceState('idle');
        const debugMsg = `${new Date().toLocaleTimeString()} - VAD paused`;
        setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      } else {
        console.log('▶️ [VOICE-MODAL] Starting VAD');
        setVoiceState('listening');
        
        // Simplified microphone permission check
        try {
          console.log('🎤 [VOICE-MODAL] Checking microphone permissions...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true
          });
          
          // Clean up immediately - we just needed to check permission
          stream.getTracks().forEach(track => track.stop());
          
          console.log('🎯 [VOICE-MODAL] Microphone permission granted');
          const successMsg = `${new Date().toLocaleTimeString()} - Microphone permission granted`;
          setDebugMessages(prev => [...prev.slice(-10), successMsg]);
        } catch (permissionError) {
          console.error('❌ [VOICE-MODAL] Microphone permission failed:', permissionError);
          const errorMessage = permissionError instanceof Error ? permissionError.message : 'Permission denied';
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: Microphone permission failed. ${errorMessage}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          
          // Still try to start VAD - it might handle permissions internally
        }
        
        // Start VAD with additional error handling
        try {
          vad.start();
          const debugMsg = `${new Date().toLocaleTimeString()} - VAD started successfully`;
          setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        } catch (vadError) {
          console.error('❌ [VOICE-MODAL] VAD start failed:', vadError);
          const errorMessage = vadError instanceof Error ? vadError.message : 'Unknown error';
          const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: VAD failed to start. ${errorMessage}`;
          setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
        }
      }
    } catch (error) {
      console.error('❌ [VOICE-MODAL] Error in toggle listening:', error);
      const errorMsg = `${new Date().toLocaleTimeString()} - ERROR: ${error instanceof Error ? error.message : 'Failed to toggle VAD'}`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
    }
  }, [vad]);

  // Manual recording fallback when VAD fails
  const handleManualRecording = useCallback(async () => {
    console.log('🎤 [MANUAL] Starting manual recording fallback');
    
    try {
      if (!isManualRecording) {
        // Start manual recording with better audio quality
        setVoiceState('recording');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          } 
        });
        
        // Choose the best available audio format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm';
          
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = async () => {
          console.log('🎤 [MANUAL] Recording stopped, processing audio...');
          // MediaRecorder doesn't produce WAV, it produces webm/opus or similar
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          
          try {
            // Create audio context for decoding compressed audio
            const audioContext = new AudioContext();
            
            // Convert blob to ArrayBuffer
            const audioBuffer = await audioBlob.arrayBuffer();
            
            // Decode the compressed audio to get raw PCM data
            const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
            console.log('🎯 [MANUAL] Audio decoded:', {
              sampleRate: decodedAudio.sampleRate,
              channels: decodedAudio.numberOfChannels,
              duration: decodedAudio.duration,
              length: decodedAudio.length
            });
            
            // Convert to mono Float32Array (match VAD format)
            const channelData = decodedAudio.getChannelData(0); // Get first channel
            
            // CRITICAL: Resample from 48kHz to 16kHz for VAD/Whisper compatibility
            let audioArray: Float32Array;
            if (decodedAudio.sampleRate !== 16000) {
              console.log('🔄 [MANUAL] Resampling from', decodedAudio.sampleRate, 'to 16kHz');
              const resampleRatio = 16000 / decodedAudio.sampleRate;
              const newLength = Math.floor(channelData.length * resampleRatio);
              audioArray = new Float32Array(newLength);
              
              // Simple linear interpolation resampling
              for (let i = 0; i < newLength; i++) {
                const srcIndex = i / resampleRatio;
                const srcIndexFloor = Math.floor(srcIndex);
                const srcIndexCeil = Math.min(srcIndexFloor + 1, channelData.length - 1);
                const fraction = srcIndex - srcIndexFloor;
                
                audioArray[i] = channelData[srcIndexFloor] * (1 - fraction) + 
                               channelData[srcIndexCeil] * fraction;
              }
            } else {
              audioArray = new Float32Array(channelData);
            }
            
            console.log('🎯 [MANUAL] Audio ready:', audioArray.length, 'samples at 16kHz');
            
            // Process through speech manager
            speechManager.onSpeechStart();
            await speechManager.onSpeechEnd(audioArray);
            
            // Clean up audio context
            await audioContext.close();
            
          } catch (error) {
            console.error('❌ [MANUAL] Audio decoding failed:', error);
            const errorMsg = `${new Date().toLocaleTimeString()} - Manual recording audio decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
          }
          
          // Clean up recording resources
          stream.getTracks().forEach(track => track.stop());
          setIsManualRecording(false);
          setMediaRecorder(null);
        };
        
        setMediaRecorder(recorder);
        setIsManualRecording(true);
        recorder.start();
        
        const debugMsg = `${new Date().toLocaleTimeString()} - Manual recording started (VAD fallback)`;
        setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
        
      } else {
        // Stop manual recording
        if (mediaRecorder) {
          mediaRecorder.stop();
        }
      }
    } catch (error) {
      console.error('❌ [MANUAL] Manual recording failed:', error);
      const errorMsg = `${new Date().toLocaleTimeString()} - Manual recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
    }
  }, [isManualRecording, mediaRecorder]);

  // Track if we've already auto-started to prevent loops
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Handle stopping the agent's speech
  const handleStopSpeech = useCallback(() => {
    console.log('🛑 [VOICE-MODAL] Stopping agent speech');
    speechManager.stopAudio();
    setIsAgentSpeaking(false);
  }, []);

  // Handle VAD state updates with comprehensive error checking
  useEffect(() => {
    console.log('🔄 [VOICE-MODAL] VAD state changed', { 
      isOpen,
      vadLoading: vad.loading, 
      vadListening: vad.listening,
      vadUserSpeaking: vad.userSpeaking,
      vadErrored: vad.errored,
      hasAutoStarted
    });
    
    // Check for VAD errors
    if (vad.errored) {
      console.error('❌ [VOICE-MODAL] VAD encountered an error');
      const errorMsg = `${new Date().toLocaleTimeString()} - VAD ERROR: Check console and microphone permissions`;
      setDebugMessages(prev => [...prev.slice(-10), errorMsg]);
      return;
    }
    
    // Don't auto-start VAD - wait for user interaction
    // This prevents microphone permission request on modal open
    if (isOpen && !vad.loading && !vad.listening && !vad.errored) {
      console.log('🎯 [VOICE-MODAL] VAD loaded successfully, ready for manual start');
      const debugMsg = `${new Date().toLocaleTimeString()} - Click to start listening`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
    }
    
    // If VAD is in error state but we haven't tried recovery, attempt recovery
    if (isOpen && !vad.loading && vad.errored && hasAutoStarted) {
      console.log('🔄 [VOICE-MODAL] VAD in error state, scheduling recovery attempt...');
      const debugMsg = `${new Date().toLocaleTimeString()} - VAD error detected, will attempt recovery`;
      setDebugMessages(prev => [...prev.slice(-10), debugMsg]);
      
      // Don't continuously retry, just once more after a delay
      setTimeout(() => {
        if (vad.errored && !vad.listening) {
          console.log('🔄 [VOICE-MODAL] Executing VAD recovery attempt');
          handleToggleListening();
        }
      }, 1500);
    }
    
    // Pause when modal closes
    if (!isOpen && vad.listening) {
      console.log('🛑 [VOICE-MODAL] Pausing VAD (modal closed)');
      vad.pause();
    }
  }, [isOpen, vad.loading, vad.listening, vad.errored, hasAutoStarted]);

  // Reset auto-start flag and error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAutoStarted(false);
      setApiKeyError(false);
      setTranscript('');
      setAgentResponse('');
      setIsAgentSpeaking(false);
      setVoiceConversation(null); // Reset voice conversation for new session
    }
  }, [isOpen]);

  useEffect(() => {
    setLoading(vad.loading);
  }, [vad.loading]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Dynamic gradient background based on voice state */}
          <div className={`absolute inset-0 transition-all duration-1000 ${
            voiceState === 'idle' ? 'voice-gradient-idle' :
            voiceState === 'listening' ? 'voice-gradient-listening' :
            voiceState === 'recording' ? 'voice-gradient-recording' :
            voiceState === 'processing' ? 'voice-gradient-processing' :
            'voice-gradient-speaking'
          }`} />
          
          {/* Wave overlay effect for processing and speaking states */}
          {(voiceState === 'processing' || voiceState === 'speaking') && (
            <div className="absolute inset-0 voice-overlay-wave" />
          )}
          
          {/* Pulse overlay for recording state */}
          {voiceState === 'recording' && (
            <div className="absolute inset-0 bg-red-500/10 voice-overlay-pulse" />
          )}
          {loading ? (
            <div className="flex items-center justify-center h-full relative z-10">
              <RotateLoader
                loading={loading}
                color="#ffffff"
                aria-label="Loading Voice"
                data-testid="loader"
              />
            </div>
          ) : (
            <>
              {/* Canvas for particle animation */}
              <Canvas draw={particleActions.draw} />
              
              {/* Top-left settings display */}
              <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 z-10">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 text-white/70 text-xs space-y-1">
                  <div>Voice: {selectedVoice}</div>
                  <div>Persona: {selectedPersona}</div>
                  <div>Theme: {selectedColorScheme}</div>
                </div>
              </div>

              {/* Top-right controls - responsive */}
              <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex items-center gap-2 sm:gap-3 z-10">
                {/* Settings button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all transform active:scale-95 pointer-events-auto"
                  aria-label="Voice settings"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all transform active:scale-95 pointer-events-auto"
                  aria-label="Close voice mode"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
              
              

              {/* Status display - responsive with animations */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center px-4 z-10">
                <div className="relative">
                  {/* Main status text with state-based colors - no blinking */}
                  <p className={`text-2xl sm:text-3xl md:text-4xl font-light mb-4 leading-tight transition-all duration-300 ${
                    voiceState === 'recording' ? 'text-red-400' :
                    voiceState === 'processing' ? 'text-purple-400' :
                    voiceState === 'speaking' ? 'text-green-400' :
                    voiceState === 'listening' ? 'text-blue-400' :
                    'text-white/90'
                  }`}>
                    {isManualRecording 
                      ? 'Analyzing...' 
                      : voiceState === 'listening'
                      ? 'Listening...'
                      : voiceState === 'processing'
                      ? 'Thinking...'
                      : voiceState === 'speaking'
                      ? 'Speaking...'
                      : vad.loading
                      ? 'Initializing...'
                      : 'Ready to chat'}
                  </p>
                  
                  {/* Animated dots for processing state */}
                  {voiceState === 'processing' && (
                    <div className="flex justify-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                
                {/* Show user's transcript - responsive */}
                {transcript && (
                  <div className="mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-white/70 mb-1">You said:</p>
                    <p className="text-sm sm:text-lg text-white/90 max-w-xs sm:max-w-md mx-auto px-2">"{transcript}"</p>
                  </div>
                )}
                
                {/* Show agent's response - responsive */}
                {agentResponse && (
                  <div className="animate-fade-in">
                    <p className="text-xs sm:text-sm text-white/70 mb-1">Agent:</p>
                    <p className="text-base sm:text-xl text-white max-w-xs sm:max-w-md mx-auto px-2 leading-relaxed">"{agentResponse}"</p>
                    
                    {/* Audio wave visualization for speaking state */}
                    {voiceState === 'speaking' && (
                      <div className="flex justify-center items-center gap-1 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-green-400 rounded-full audio-wave-bar"
                            style={{
                              height: '20px',
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                
              </div>

              {/* Bottom control buttons - Mobile optimized */}
              <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 px-4 z-10">
                
                {/* Main voice control button */}
                <div className="flex items-center justify-center">
                  {/* Recording/Listening State */}
                  {(isManualRecording || voiceState === 'listening') && (
                    <button
                      onClick={isManualRecording ? handleManualRecording : handleToggleListening}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 backdrop-blur-sm transition-all transform active:scale-95 pointer-events-auto shadow-lg border-2 border-red-500/50"
                      style={{ pointerEvents: 'auto' }}
                      aria-label={isManualRecording ? "Stop recording" : "Stop listening"}
                    >
                      {/* Pulsing animation ring */}
                      <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
                      
                      {/* Inner button content */}
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-sm"></div>
                      </div>
                    </button>
                  )}

                  {/* Processing State */}
                  {voiceState === 'processing' && (
                    <button
                      disabled
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-500/20 backdrop-blur-sm shadow-lg border-2 border-purple-500/50"
                      aria-label="Processing"
                    >
                      {/* Processing animation */}
                      <div className="absolute inset-3 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-6 border-2 border-purple-500/20 border-t-purple-500/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </button>
                  )}

                  {/* Speaking State - Stop button */}
                  {voiceState === 'speaking' && (
                    <button
                      onClick={handleStopSpeech}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-orange-500/20 hover:bg-orange-500/30 active:bg-orange-500/40 backdrop-blur-sm transition-all transform active:scale-95 pointer-events-auto shadow-lg border-2 border-orange-500/50"
                      style={{ pointerEvents: 'auto' }}
                      aria-label="Stop response"
                    >
                      {/* Sound wave animation */}
                      <div className="absolute inset-0 rounded-full">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute inset-0 rounded-full border border-orange-500/30 animate-ping"
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              animationDuration: '1.5s'
                            }}
                          />
                        ))}
                      </div>
                      
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <StopCircle className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
                      </div>
                    </button>
                  )}

                  {/* Idle State - Start button */}
                  {!vad.loading && !isManualRecording && voiceState !== 'speaking' && voiceState !== 'listening' && voiceState !== 'processing' && (
                    <button
                      onClick={vad.errored ? handleManualRecording : handleToggleListening}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 pointer-events-auto shadow-lg border-2 border-blue-500/50"
                      style={{ pointerEvents: 'auto' }}
                      aria-label="Start voice chat"
                    >
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-sm"></div>
                      
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
                      </div>
                    </button>
                  )}

                  {/* Loading State */}
                  {vad.loading && (
                    <button
                      disabled
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-500/20 backdrop-blur-sm shadow-lg border-2 border-gray-500/50"
                      aria-label="Loading"
                    >
                      <div className="absolute inset-4 border-3 border-gray-500/30 border-t-gray-500 rounded-full animate-spin"></div>
                    </button>
                  )}
                </div>

                {/* State indicator text (subtle) */}
                <div className="text-xs text-white/60 text-center">
                  {vad.loading ? 'Initializing...' :
                   isManualRecording ? 'Tap to stop' :
                   voiceState === 'listening' ? 'Listening...' :
                   voiceState === 'processing' ? 'Processing...' :
                   voiceState === 'speaking' ? 'Tap to stop' :
                   'Tap to speak'}
                </div>
              </div>

            </>
          )}
        </div>
      )}
      
      {/* Voice Settings Modal */}
      <VoiceSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}

// Main component that conditionally renders the VAD component
export function VoiceModal(props: VoiceModalProps) {
  // Only render the content (and initialize VAD) when modal is open
  if (!props.isOpen) {
    return null;
  }
  
  return <VoiceModalContent {...props} />;
}