'use client'

import { useState } from 'react'
import { VoiceIcon, RecordIcon } from './icons'

const voiceOptions = [
  { id: 'alloy', name: 'Alloy', personality: 'Neutral' },
  { id: 'echo', name: 'Echo', personality: 'Warm' },
  { id: 'fable', name: 'Fable', personality: 'Friendly' },
  { id: 'onyx', name: 'Onyx', personality: 'Professional' },
  { id: 'nova', name: 'Nova', personality: 'Energetic' },
  { id: 'shimmer', name: 'Shimmer', personality: 'Soft' }
]

const voiceFeatures = [
  'Real-time speech transcription',
  'Natural voice synthesis',
  'Voice activity detection', 
  'Background noise filtering',
  'Multi-language support',
  'Conversation continuity'
]

export function VoiceFeaturesSection() {
  const [activeVoice, setActiveVoice] = useState('alloy')
  const [isRecording, setIsRecording] = useState(false)
  
  return (
    <section className="py-20 bg-landing-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Advanced Voice Capabilities
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Powered by OpenAI Whisper and TTS with 6 voice options for natural conversations
          </p>
        </div>
        
        {/* Main Voice Demo Card */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-landing-surface-light shadow-xl overflow-hidden">
            {/* Voice Selection Header */}
            <div className="bg-gradient-to-r from-customgpt-primary to-customgpt-secondary p-6">
              <h3 className="text-xl font-bold text-white text-center mb-4">
                Choose Your AI Voice
              </h3>
              {/* Voice Options - Horizontal on Desktop, 3x2 Grid on Mobile */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-3xl mx-auto">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setActiveVoice(voice.id)}
                    className={`p-3 rounded-lg text-center transition-all duration-200 ${
                      activeVoice === voice.id
                        ? 'bg-white text-customgpt-primary shadow-lg scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">{voice.name}</div>
                    <div className="text-xs opacity-80">{voice.personality}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Voice Demo Body */}
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Voice Visualizer */}
                <div className="h-32 bg-gradient-to-b from-customgpt-primary/5 to-transparent rounded-xl mb-6 flex items-center justify-center relative">
                  <div className="flex items-center gap-1.5">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 bg-customgpt-primary rounded-full transition-all duration-200 ${
                          isRecording ? 'animate-wave' : ''
                        }`}
                        style={{
                          height: isRecording 
                            ? `${25 + Math.sin(i * 0.5) * 20}px`
                            : '4px',
                          animationDelay: `${i * 100}ms`,
                          opacity: isRecording ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Recording...
                    </div>
                  )}
                </div>
                
                {/* Voice Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
                      isRecording
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white hover:shadow-lg hover:shadow-customgpt-primary/25'
                    }`}
                  >
                    <RecordIcon size={20} />
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  <button className="bg-landing-surface text-landing-text px-8 py-3 rounded-lg font-semibold hover:bg-customgpt-primary hover:text-white transition-all duration-200 flex items-center gap-2 justify-center">
                    <VoiceIcon size={20} /> Play Response
                  </button>
                </div>
                
                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                  {voiceFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-landing-text-secondary">
                      <div className="w-2 h-2 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Quick Setup */}
                <div className="bg-landing-surface rounded-xl p-4 text-center">
                  <h4 className="font-semibold text-landing-text mb-2">Quick Setup</h4>
                  <div className="bg-black rounded-lg px-4 py-2 font-mono text-customgpt-accent text-sm inline-block">
                    OPENAI_API_KEY=sk-your-key-here
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}