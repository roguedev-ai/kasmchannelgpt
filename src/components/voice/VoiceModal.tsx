'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMicVAD, utils } from '@ricky0123/vad-react';
import RotateLoader from 'react-spinners/RotateLoader';
import { X, StopCircle, Mic, MicOff, Settings } from 'lucide-react';
import Canvas from './Canvas';
import { VoiceSettings } from './VoiceSettings';
import { speechManager } from '@/lib/voice/speech-manager';
import { useMessageStore, useConversationStore } from '@/hooks/useWidgetStore';
import { useAgentStore } from '@/store/agents';
import { generateId, generateConversationName } from '@/lib/utils';
import { useVoiceSettingsStore } from '@/store/voice-settings';
import { parseMarkdownForVoice } from '@/lib/voice/utils';
import { useDemoStore } from '@/store/demo';
import { AlertTriangle } from 'lucide-react';

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
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Streaming state
  const [isStreamingText, setIsStreamingText] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  // Message store integration
  const { addMessage, messages, loadMessages } = useMessageStore();
  const { currentConversation, ensureConversation, updateConversation } = useConversationStore();
  const [currentUserMessageId, setCurrentUserMessageId] = useState<string | null>(null);
  const [voiceConversation, setVoiceConversation] = useState<any>(null);
  
  // Guard to prevent multiple conversation creation attempts
  const conversationSetupRef = useRef<boolean>(false);
  
  // Voice settings integration
  const { selectedVoice, selectedPersona, setVoiceModalOpen } = useVoiceSettingsStore();
  
  // Demo mode check
  const { isDemoMode, openAIApiKey } = useDemoStore();
  
  // Check if OpenAI API key is available
  const checkOpenAIKeyAvailability = useCallback(() => {
    const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
    if (deploymentMode === 'demo' && !openAIApiKey) {
      return false;
    }
    // In production mode, we can't check server-side env from client
    // We'll let the API handle validation
    return true;
  }, [openAIApiKey]);

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
      speechManager.onSpeechStart();
    },
    onSpeechEnd: (audio) => {
      console.log('🎤 [VAD] Speech ended, audio length:', audio.length);
      speechManager.onSpeechEnd(audio);
    },
    onVADMisfire: () => {
      console.log('🎤 [VAD] Misfire detected');
      speechManager.onMisfire();
    }
  });

  // Control global voice modal state for hiding mobile navigation
  useEffect(() => {
    setVoiceModalOpen(isOpen);
    
    // Extra cleanup when closing to ensure mobile navigation reappears
    if (!isOpen) {
      // Reset conversation setup guard when modal closes
      conversationSetupRef.current = false;
      // Clear voice conversation reference when modal closes
      setVoiceConversation(null);
      
      // Small delay to ensure the state change is processed
      setTimeout(() => {
        setVoiceModalOpen(false);
      }, 100);
    }
  }, [isOpen, setVoiceModalOpen]);

  // Set up speech manager when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      console.log('🔧 [VOICE-MODAL] Setting up speech manager');
      speechManager.setProjectId(projectId);
      
      // Apply voice settings to speech manager
      speechManager.setVoiceSettings(selectedVoice, selectedPersona);
      
      // Pass demo keys to window object for speech manager (only in demo mode)
      if (isDemoMode) {
        if (openAIApiKey) {
          (window as any).__demoOpenAIKey = openAIApiKey;
        }
        // Also pass CustomGPT API key from demo store
        const demoApiKey = useDemoStore.getState().apiKey;
        if (demoApiKey) {
          (window as any).__demoCustomGPTKey = demoApiKey;
        }
      }
      
      // Theme is now handled directly by Canvas component through themeId prop
      
      // Check if agent is active
      const currentAgentStore = useAgentStore.getState();
      const agent = currentAgentStore.agents.find(a => a.id === parseInt(projectId));
      
      if (agent && !agent.is_chat_active) {
        console.warn('⚠️ [VOICE-MODAL] Agent is inactive - may fall back to OpenAI');
      }
      
      // Set the model based on agent settings or use fast default for voice
      if (agent?.settings?.chatbot_model) {
        speechManager.setChatbotModel(agent.settings.chatbot_model);
      } else {
        // Default to fast model for voice if agent doesn't have a model configured
        speechManager.setChatbotModel('gpt-3.5-turbo');
      }
      
      // Ensure we have a conversation before starting voice
      const setupConversation = async () => {
        // Prevent multiple setup attempts
        if (conversationSetupRef.current) {
          console.log('🔄 [VOICE-MODAL] Conversation setup already in progress, skipping');
          return;
        }
        
        try {
          conversationSetupRef.current = true;
          let conversation = currentConversation;
          
          // If no current conversation and no voice conversation stored, create one for voice
          if (!conversation && !voiceConversation) {
            console.log('🔄 [VOICE-MODAL] No current conversation, creating one for voice');
            // Create conversation with voice title
            conversation = await ensureConversation(parseInt(projectId), 'Voice Conversation');
            console.log('✅ [VOICE-MODAL] Created conversation:', conversation.id, 'session:', conversation.session_id);
            
            // Immediately update the title to ensure it's set correctly
            try {
              await updateConversation(conversation.id, conversation.session_id, { name: 'Voice Conversation' });
              console.log('📝 [VOICE-MODAL] Set initial voice conversation title');
            } catch (error) {
              console.error('❌ [VOICE-MODAL] Failed to set initial title:', error);
            }
            
            // Store the conversation reference for reuse
            setVoiceConversation(conversation);
          } else if (conversation) {
            // Store existing conversation reference
            setVoiceConversation(conversation);
          } else if (voiceConversation) {
            // Use the existing voice conversation
            conversation = voiceConversation;
          }
          
          // Ensure we have a valid conversation before proceeding
          if (!conversation) {
            console.error('❌ [VOICE-MODAL] No conversation available after setup');
            return;
          }
          
          // Load conversation history and session ID
          const conversationMessages = messages.get(conversation.id.toString()) || [];
          console.log('📝 [VOICE-MODAL] Loading conversation history:', conversationMessages.length, 'messages');
          console.log('📝 [VOICE-MODAL] Agent status:', agent?.is_chat_active ? 'Active' : 'Inactive');
          
          // Filter out any duplicate messages and ensure proper ordering
          const cleanedMessages = conversationMessages.filter((msg, index, self) => 
            // Keep only the first occurrence of each message ID
            index === self.findIndex(m => m.id === msg.id)
          ).sort((a, b) => 
            // Sort by timestamp to ensure proper ordering
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          speechManager.setConversationHistory(cleanedMessages);
          speechManager.setSessionId(conversation.session_id);
        } catch (error) {
          console.error('❌ [VOICE-MODAL] Failed to setup conversation:', error);
        } finally {
          // Reset the guard after setup is complete (success or failure)
          conversationSetupRef.current = false;
        }
      };
      
      setupConversation();
      
      speechManager.setCallbacks({
        onUserSpeaking: () => {
          (Canvas as any).onUserSpeaking?.();
          setTranscript('');
          setStreamingResponse(''); // Clear streaming response
          setIsStreamingText(false);
          setVoiceState('recording');
        },
        onProcessing: async () => {
          (Canvas as any).onProcessing?.();
          setVoiceState('processing');
          
          // Use existing conversation - don't create a new one
          // The conversation should already be set up in setupConversation()
          
          const placeholderUserMessage = {
            id: generateId(),
            role: 'user' as const,
            content: '🎤 Processing voice input...',
            timestamp: new Date().toISOString(),
            status: 'sending' as const,
          };
          
          setCurrentUserMessageId(placeholderUserMessage.id);
          const targetConversation = voiceConversation || currentConversation;
          if (targetConversation) {
            addMessage(targetConversation.id.toString(), placeholderUserMessage);
            console.log('🎤 [VOICE-MODAL] Added placeholder user message');
          }
        },
        onAiSpeaking: () => {
          (Canvas as any).onAiSpeaking?.();
          setIsAgentSpeaking(true);
          setVoiceState('speaking');
        },
        onReset: () => {
          (Canvas as any).reset?.();
          setIsAgentSpeaking(false);
          setIsStreamingText(false);
          setVoiceState('idle');
        },
        onDebug: (message: string, data?: any) => {
          // Debug logging removed for production
        },
        onError: (error: string) => {
          console.error('❌ [VOICE-MODAL] Error from speech manager:', error);
          // Check if it's an API key error
          if (error.includes('OpenAI API key') || error.includes('API key')) {
            setApiKeyError(true);
            // Also show a toast error
            const deploymentMode = typeof window !== 'undefined' ? localStorage.getItem('customgpt.deploymentMode') : null;
            const isDemoMode = deploymentMode === 'demo';
            const errorMsg = isDemoMode 
              ? 'Voice feature requires an OpenAI API key. Please enable voice capability in demo settings and provide your OpenAI API key.'
              : 'Voice feature requires OpenAI API key configuration. Please add OPENAI_API_KEY to your .env.local file.';
            
            // Import toast at the top of the file
            import('sonner').then(({ toast }) => {
              toast.error(errorMsg);
            });
          }
          setIsStreamingText(false);
          setVoiceState('idle');
        },
        onTranscriptReceived: async (transcript: string) => {
          console.log('🎯 [VOICE-MODAL] Transcript received:', transcript);
          setTranscript(transcript);
          
          // Update conversation title for voice conversations
          const targetConversation = voiceConversation || currentConversation;
          if (targetConversation) {
            const conversationMessages = messages.get(targetConversation.id.toString()) || [];
            // If this is the first message and conversation doesn't have a proper title yet, set voice title
            if (conversationMessages.length <= 1) {
              const currentTitle = targetConversation.name || '';
              const needsVoiceTitle = !currentTitle || 
                                      currentTitle === 'New voice conversation' || 
                                      currentTitle === 'New Conversation' ||
                                      currentTitle === 'Processing...' ||
                                      currentTitle.startsWith('Chat ') ||
                                      currentTitle.startsWith('OpenAI-') ||
                                      currentTitle.includes('OpenAI-');
              
              if (needsVoiceTitle) {
                // Generate a more descriptive title based on the transcript
                let voiceTitle = 'Voice Conversation';
                if (transcript && transcript.length > 0) {
                  // Use the first few words of the transcript as the title, but clean it first
                  const cleanTranscript = transcript
                    .replace(/^(OpenAI-|System-|API-|Assistant:|User:)\s*/i, '')
                    .trim();
                  if (cleanTranscript.length > 0) {
                    const words = cleanTranscript.split(/\s+/).slice(0, 6).join(' ');
                    voiceTitle = `Voice: ${words.length > 40 ? words.substring(0, 40).trim() + '...' : words}`;
                  }
                }
                
                console.log('📝 [VOICE-MODAL] Setting voice conversation title:', voiceTitle);
                try {
                  await updateConversation(targetConversation.id, targetConversation.session_id, { name: voiceTitle });
                } catch (error) {
                  console.error('❌ [VOICE-MODAL] Failed to update conversation title:', error);
                }
              }
            }
          }
          
          // Update the placeholder message with actual transcript
          
          if (targetConversation && currentUserMessageId) {
            // Update the existing placeholder message
            const updatedUserMessage = {
              id: currentUserMessageId,
              role: 'user' as const,
              content: transcript,
              timestamp: new Date().toISOString(),
              status: 'sent' as const,
            };
            
            addMessage(targetConversation.id.toString(), updatedUserMessage);
            console.log('✅ [VOICE-MODAL] Updated user message with transcript');
          } else {
            // Fallback: create new message if no placeholder exists
            // Use the existing conversation from voiceConversation or currentConversation
            const conversation = voiceConversation || currentConversation;
            if (!conversation) {
              console.error('❌ [VOICE-MODAL] No conversation available for user message');
              return;
            }
            
            const userMessage = {
              id: generateId(),
              role: 'user' as const,
              content: transcript,
              timestamp: new Date().toISOString(),
              status: 'sent' as const,
            };
            
            setCurrentUserMessageId(userMessage.id);
            addMessage(conversation.id.toString(), userMessage);
          }
        },
        onResponseReceived: async (response: string) => {
          console.log('🎯 [VOICE-MODAL] Response received:', response);
          console.log('🎯 [VOICE-MODAL] Response includes "individuals":', response.includes('individuals'));
          console.log('🎯 [VOICE-MODAL] Response includes "like":', response.includes('like'));
          console.log('🎯 [VOICE-MODAL] Response includes "CustomGPT":', response.includes('CustomGPT'));
          
          // For streaming responses, this will be called with the final response
          // Don't update the display here as it's already being updated via streaming chunks
          // This is mainly for adding the message to the conversation history
          
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
            
            // Force refresh conversation to ensure proper syncing
            const currentMessages = messages.get(targetConversation.id.toString()) || [];
            console.log('🔄 [VOICE-MODAL] Current conversation messages:', currentMessages.length, 'messages');
            
          } else {
            console.warn('⚠️ [VOICE-MODAL] No conversation available for adding assistant message');
          }
        },
        // New streaming callbacks
        onStreamingTextChunk: (textChunk: string) => {
          console.log('📝 [VOICE-MODAL] Streaming text chunk:', textChunk);
          setIsStreamingText(true);
          setStreamingResponse(prev => {
            const newText = prev + textChunk;
            console.log('📝 [VOICE-MODAL] Accumulated streaming text length:', newText.length);
            // Update the displayed response immediately for streaming
            const cleanResponse = parseMarkdownForVoice(newText);
            setAgentResponse(cleanResponse);
            return newText;
          });
        },
        onStreamingAudioReady: (audioUrl: string, chunkId: string) => {
          console.log('🎵 [VOICE-MODAL] Audio chunk ready:', chunkId, 'URL length:', audioUrl.length);
          
          // Ensure we're in speaking state when audio arrives
          if (voiceState !== 'speaking') {
            setVoiceState('speaking');
            setIsAgentSpeaking(true);
          }
        },
        onStreamingComplete: (fullResponse: string, transcript: string) => {
          console.log('✅ [VOICE-MODAL] Streaming complete:', { fullResponse: fullResponse.length, transcript });
          console.log('✅ [VOICE-MODAL] Full response includes "individuals":', fullResponse.includes('individuals'));
          console.log('✅ [VOICE-MODAL] Full response includes "like":', fullResponse.includes('like'));
          console.log('✅ [VOICE-MODAL] Full response includes "CustomGPT":', fullResponse.includes('CustomGPT'));
          
          // Final cleanup - ensure we have the complete response
          const cleanResponse = parseMarkdownForVoice(fullResponse);
          console.log('✅ [VOICE-MODAL] Final clean response:', cleanResponse);
          setAgentResponse(cleanResponse);
          setStreamingResponse(fullResponse);
          setIsStreamingText(false);
          
          // Don't add messages here - they've already been added via onTranscriptReceived and onResponseReceived
          // This prevents duplicate messages in the conversation
        }
      });
    }
    
    // Clean up when modal closes
    if (!isOpen) {
      // Don't clear conversation history to maintain context
      setTranscript('');
      setAgentResponse('');
      setStreamingResponse('');
      setIsStreamingText(false);
      setIsAgentSpeaking(false);
      setVoiceConversation(null); // Clear voice conversation reference
      setVoiceState('idle'); // Reset voice state to idle
      setCurrentUserMessageId(null); // Clear current user message ID
      
      // Clean up demo keys from window object (only in demo mode)
      if ((window as any).__demoOpenAIKey) {
        delete (window as any).__demoOpenAIKey;
      }
      if ((window as any).__demoCustomGPTKey) {
        delete (window as any).__demoCustomGPTKey;
      }
      
      // Ensure VAD is stopped if it was running
      if (vad.listening) {
        vad.pause();
      }
      
      // Clean up speech manager streaming resources
      speechManager.destroy();
      
      // Ensure global state is properly reset
      setVoiceModalOpen(false);
      
      // Reload messages to ensure sync with API format
      if (currentConversation) {
        // Use the loadMessages function directly from the hook
        loadMessages(currentConversation.id.toString());
      }
    }
  }, [isOpen, projectId, currentConversation, messages, selectedVoice, selectedPersona, isDemoMode, openAIApiKey, loadMessages]);
  
  // Update settings when they change
  useEffect(() => {
    if (isOpen && projectId) {
      // Update speech manager with new voice settings
      speechManager.setVoiceSettings(selectedVoice, selectedPersona);
      
      // Get agent's configured model
      const currentAgentStore = useAgentStore.getState();
      const agent = currentAgentStore.agents.find(a => a.id === parseInt(projectId));
      if (agent?.settings?.chatbot_model) {
        speechManager.setChatbotModel(agent.settings.chatbot_model);
      }
      
      // Theme is now handled directly by Canvas component through themeId prop
      // The Canvas component automatically switches themes when themeId changes
    }
  }, [selectedVoice, selectedPersona, isOpen, projectId]);
  
  // Monitor VAD state changes
  useEffect(() => {
    if (vad.errored) {
    } else if (!vad.loading && !vad.errored) {
    }
  }, [vad.loading, vad.errored]);

  // Define handleToggleListening before useEffect that uses it
  const handleToggleListening = useCallback(async () => {
    console.log('🔘 [VOICE-MODAL] Toggle listening clicked', { 
      vadLoading: vad.loading,
      vadListening: vad.listening,
      vadErrored: vad.errored
    });
    
    // Check OpenAI key availability first
    if (!checkOpenAIKeyAvailability()) {
      console.error('❌ [VOICE-MODAL] OpenAI API key not available');
      setApiKeyError(true);
      const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
      const errorMsg = deploymentMode === 'demo' 
        ? 'Voice feature requires an OpenAI API key. Please enable voice capability in demo settings and provide your OpenAI API key.'
        : 'Voice feature requires OpenAI API key. Please add OPENAI_API_KEY to your .env.local file.';
      
      import('sonner').then(({ toast }) => {
        toast.error(errorMsg);
      });
      return;
    }
    
    // Enhanced error handling for VAD
    if (vad.errored) {
      console.error('❌ [VOICE-MODAL] VAD is in error state, attempting recovery...');
      
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
        return;
      }
    }
    
    try {
      if (vad.listening) {
        console.log('⏸️ [VOICE-MODAL] Pausing VAD');
        vad.pause();
        setVoiceState('idle');
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
        } catch (permissionError) {
          console.error('❌ [VOICE-MODAL] Microphone permission failed:', permissionError);
          const errorMessage = permissionError instanceof Error ? permissionError.message : 'Permission denied';
          
          // Still try to start VAD - it might handle permissions internally
        }
        
        // Start VAD with additional error handling
        try {
          vad.start();
        } catch (vadError) {
          console.error('❌ [VOICE-MODAL] VAD start failed:', vadError);
          const errorMessage = vadError instanceof Error ? vadError.message : 'Unknown error';
        }
      }
    } catch (error) {
      console.error('❌ [VOICE-MODAL] Error in toggle listening:', error);
    }
  }, [vad, checkOpenAIKeyAvailability]);

  // Manual recording fallback when VAD fails
  const handleManualRecording = useCallback(async () => {
    console.log('🎤 [MANUAL] Starting manual recording fallback');
    
    // Check OpenAI key availability first
    if (!checkOpenAIKeyAvailability()) {
      console.error('❌ [MANUAL] OpenAI API key not available');
      setApiKeyError(true);
      const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
      const errorMsg = deploymentMode === 'demo' 
        ? 'Voice feature requires an OpenAI API key. Please enable voice capability in demo settings and provide your OpenAI API key.'
        : 'Voice feature requires OpenAI API key. Please add OPENAI_API_KEY to your .env.local file.';
      
      import('sonner').then(({ toast }) => {
        toast.error(errorMsg);
      });
      return;
    }
    
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
          }
          
          // Clean up recording resources
          stream.getTracks().forEach(track => track.stop());
          setIsManualRecording(false);
          setMediaRecorder(null);
        };
        
        setMediaRecorder(recorder);
        setIsManualRecording(true);
        recorder.start();
        
        
      } else {
        // Stop manual recording
        if (mediaRecorder) {
          mediaRecorder.stop();
        }
      }
    } catch (error) {
      console.error('❌ [MANUAL] Manual recording failed:', error);
    }
  }, [isManualRecording, mediaRecorder, checkOpenAIKeyAvailability]);

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
      return;
    }
    
    // Don't auto-start VAD - wait for user interaction
    // This prevents microphone permission request on modal open
    if (isOpen && !vad.loading && !vad.listening && !vad.errored) {
      console.log('🎯 [VOICE-MODAL] VAD loaded successfully, ready for manual start');
    }
    
    // If VAD is in error state but we haven't tried recovery, attempt recovery
    if (isOpen && !vad.loading && vad.errored && hasAutoStarted) {
      console.log('🔄 [VOICE-MODAL] VAD in error state, scheduling recovery attempt...');
      
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
      setStreamingResponse('');
      setIsStreamingText(false);
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
        <>
          <style jsx global>{`
            /* Custom scrollbar styles for voice modal */
            .voice-response-scroll::-webkit-scrollbar {
              width: 6px;
            }
            
            .voice-response-scroll::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
            }
            
            .voice-response-scroll::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 3px;
            }
            
            .voice-response-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
            
            /* Firefox scrollbar */
            .voice-response-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
            }
            
            /* Mobile touch scrolling optimization */
            .voice-response-scroll {
              -webkit-overflow-scrolling: touch;
              scroll-behavior: smooth;
            }
          `}</style>
          {/* Settings and Close buttons - moved outside main container to avoid click issues */}
          <div 
            className="fixed top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex items-center gap-2 sm:gap-3 z-[10000]"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Settings button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 Settings button clicked, current state:', isSettingsOpen);
                setIsSettingsOpen(true);
                console.log('🔧 Settings state should now be true');
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all transform active:scale-95"
              aria-label="Voice settings"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Close button clicked');
                onClose();
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all transform active:scale-95"
              aria-label="Close voice mode"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
          
          <div 
            className="fixed inset-0 z-[9999] overflow-hidden"
          >
          {/* Dynamic gradient background based on voice state */}
          <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
            voiceState === 'idle' ? 'voice-gradient-idle' :
            voiceState === 'listening' ? 'voice-gradient-listening' :
            voiceState === 'recording' ? 'voice-gradient-recording' :
            voiceState === 'processing' ? 'voice-gradient-processing' :
            'voice-gradient-speaking'
          }`} />
          
          {/* Wave overlay effect for processing and speaking states */}
          {(voiceState === 'processing' || voiceState === 'speaking') && (
            <div className="absolute inset-0 voice-overlay-wave pointer-events-none" />
          )}
          
          {/* Pulse overlay for recording state */}
          {voiceState === 'recording' && (
            <div className="absolute inset-0 bg-red-500/10 voice-overlay-pulse pointer-events-none" />
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
              <div className="absolute inset-0 pointer-events-none z-0">
                <Canvas />
              </div>
              
              {/* Top-left settings display */}
              <div className="absolute top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 z-20 space-y-2">
                {/* Demo mode indicator */}
                {isDemoMode && (
                  <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg px-3 py-2 text-amber-300 text-xs flex items-center gap-2 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">Demo Mode</span>
                  </div>
                )}
                
                {/* Voice settings */}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 text-white/70 text-xs space-y-1">
                  <div>Voice: {selectedVoice}</div>
                  <div>Persona: {selectedPersona}</div>
                  <div>Model: {(() => {
                    const currentAgentStore = useAgentStore.getState();
                    const currentAgent = currentAgentStore.agents.find(a => a.id === parseInt(projectId));
                    return currentAgent?.settings?.chatbot_model || 'gpt-3.5-turbo';
                  })()}</div>
                </div>
              </div>

              
              

              {/* Status display - mobile optimized with better text handling */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center px-4 z-10 pointer-events-auto max-w-full" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
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
                    <p className="text-sm sm:text-lg text-white/90 max-w-xs sm:max-w-md mx-auto px-2">&ldquo;{transcript}&rdquo;</p>
                  </div>
                )}
                
                {/* Show agent's response - mobile optimized with scrollable area */}
                {agentResponse && (
                  <div className="animate-fade-in pointer-events-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-white/70">Agent:</p>
                      {isStreamingText && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-400/70">streaming...</span>
                        </div>
                      )}
                    </div>
                    <div className="voice-response-scroll max-h-[40vh] sm:max-h-[50vh] overflow-y-auto overflow-x-hidden px-4 py-2 -mx-2 rounded-lg bg-white/5 relative">
                      <p className="text-sm sm:text-base text-white max-w-xs sm:max-w-md mx-auto leading-relaxed break-words whitespace-pre-wrap">
                        {agentResponse}
                        {isStreamingText && (
                          <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse"></span>
                        )}
                      </p>
                    </div>
                    
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
              <div 
                className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 px-4"
                style={{ pointerEvents: 'auto', zIndex: 10000 }}
              >
                {/* API Key error warning */}
                {(() => {
                  const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                  const showWarning = deploymentMode === 'demo' ? !openAIApiKey : false;
                  if (!showWarning) return null;
                  
                  return (
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-2 border border-red-500/30 max-w-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Voice requires OpenAI API key. Add it in demo settings.</span>
                    </div>
                  );
                })()}
                
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
                      disabled={(() => {
                        const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                        return deploymentMode === 'demo' && !openAIApiKey;
                      })()}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-sm transition-all transform shadow-lg border-2 ${
                        (() => {
                          const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                          return deploymentMode === 'demo' && !openAIApiKey;
                        })() 
                          ? 'bg-gray-500/20 border-gray-500/50 cursor-not-allowed opacity-50' 
                          : 'bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 hover:scale-105 active:scale-95 pointer-events-auto border-blue-500/50'
                      }`}
                      style={{ pointerEvents: 'auto' }}
                      aria-label={(() => {
                        const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                        return deploymentMode === 'demo' && !openAIApiKey ? "Voice disabled - API key required" : "Start voice chat";
                      })()}
                    >
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-sm"></div>
                      
                      <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <Mic className={`w-8 h-8 sm:w-10 sm:h-10 ${
                          (() => {
                            const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                            return deploymentMode === 'demo' && !openAIApiKey ? 'text-gray-500' : 'text-blue-500';
                          })()
                        }`} />
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
                  {(() => {
                    const deploymentMode = localStorage.getItem('customgpt.deploymentMode') || 'production';
                    return deploymentMode === 'demo' && !openAIApiKey ? 'API key required' : '';
                  })() ||
                   vad.loading ? 'Initializing...' :
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
        </>
      )}
      
      {/* Voice Settings Modal */}
      <VoiceSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        projectId={projectId}
      />
    </>
  );
}

// Main component that conditionally renders the VAD component
export function VoiceModal(props: VoiceModalProps) {
  const { setVoiceModalOpen } = useVoiceSettingsStore();
  
  // Ensure global state is synchronized with props
  React.useEffect(() => {
    setVoiceModalOpen(props.isOpen);
  }, [props.isOpen, setVoiceModalOpen]);
  
  // Only render the content (and initialize VAD) when modal is open
  if (!props.isOpen) {
    return null;
  }
  
  return <VoiceModalContent {...props} />;
}