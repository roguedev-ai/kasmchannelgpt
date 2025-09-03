'use client'

import { useState } from 'react'
import { VoiceIcon, RecordIcon } from './icons'

const voiceOptions = [
  { id: 'alloy', name: 'Alloy', personality: 'Neutral', active: true },
  { id: 'echo', name: 'Echo', personality: 'Warm', active: false },
  { id: 'fable', name: 'Fable', personality: 'Friendly', active: false },
  { id: 'onyx', name: 'Onyx', personality: 'Professional', active: false },
  { id: 'nova', name: 'Nova', personality: 'Energetic', active: false },
  { id: 'shimmer', name: 'Shimmer', personality: 'Soft', active: false }
]

export function VoiceFeaturesSection() {
  const [activeVoice, setActiveVoice] = useState('alloy')
  const [isRecording, setIsRecording] = useState(false)
  
  return (
    <section className="py-20 bg-landing-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Advanced Voice Capabilities
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Powered by OpenAI Whisper and TTS with 6 voice options for natural conversations
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Voice Demo */}
          <div className="bg-white rounded-2xl p-8 border border-landing-surface-light shadow-xl">
            <h3 className="text-2xl font-bold text-landing-text text-center mb-6">
              Try Voice Mode
            </h3>
            
            {/* Voice Visualizer */}
            <div className="h-40 bg-gradient-to-b from-customgpt-primary/10 to-transparent rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="flex items-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-customgpt-primary rounded-full transition-all duration-200 ${
                      isRecording ? 'animate-wave' : ''
                    }`}
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 15}px`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
              
              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Recording...
                </div>
              )}
            </div>
            
            {/* Voice Controls */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 justify-center ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white hover:shadow-lg hover:shadow-customgpt-primary/25'
                }`}
              >
                {isRecording ? (
                  <>
                    <RecordIcon size={20} /> Stop Recording
                  </>
                ) : (
                  <>
                    <VoiceIcon size={20} /> Start Recording
                  </>
                )}
              </button>
              <button className="bg-landing-surface text-landing-text px-6 py-3 rounded-lg font-semibold hover:bg-customgpt-primary hover:text-white transition-all duration-200 flex items-center gap-2">
                <VoiceIcon size={20} /> Play Response
              </button>
            </div>
          </div>
          
          {/* Voice Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-landing-text mb-4">
                Choose Your AI Voice
              </h3>
              <p className="text-landing-text-secondary mb-6">
                Select from 6 different voice personalities for text-to-speech synthesis
              </p>
            </div>
            
            {/* Voice Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {voiceOptions.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setActiveVoice(voice.id)}
                  className={`p-4 rounded-xl text-center transition-all duration-200 ${
                    activeVoice === voice.id
                      ? 'bg-customgpt-primary text-white border-2 border-customgpt-primary'
                      : 'bg-white border-2 border-landing-surface-light hover:border-customgpt-primary hover:-translate-y-1'
                  }`}
                >
                  <div className={`font-bold mb-1 ${activeVoice === voice.id ? 'text-white' : 'text-landing-text'}`}>
                    {voice.name}
                  </div>
                  <div className={`text-sm ${activeVoice === voice.id ? 'text-customgpt-accent' : 'text-landing-text-secondary'}`}>
                    {voice.personality}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Voice Features */}
            <div className="bg-white rounded-xl p-6 border border-landing-surface-light">
              <h4 className="font-bold text-landing-text mb-4">Voice Features:</h4>
              <div className="space-y-3">
                {[
                  'Real-time speech transcription',
                  'Natural voice synthesis',
                  'Voice activity detection', 
                  'Background noise filtering',
                  'Multi-language support',
                  'Conversation continuity'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-landing-text-secondary">
                    <div className="w-2 h-2 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Setup Info */}
            <div className="bg-landing-surface rounded-xl p-6">
              <h4 className="font-bold text-landing-text mb-2">Quick Setup</h4>
              <p className="text-landing-text-secondary text-sm mb-4">
                Enable voice features with just your OpenAI API key
              </p>
              <div className="bg-black rounded-lg p-3 font-mono text-customgpt-accent text-sm">
                OPENAI_API_KEY=sk-your-key-here
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}