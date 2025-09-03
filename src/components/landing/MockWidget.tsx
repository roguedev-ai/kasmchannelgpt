'use client'

import { useState, useEffect } from 'react'
import { ChatIcon, VoiceIcon, RecordIcon } from './icons'

interface MockWidgetProps {
  mode?: 'dashboard' | 'widget' | 'chatbot' | 'mobile' | 'voice'
}

export function MockWidget({ mode = 'dashboard' }: MockWidgetProps) {
  // Voice mode state - declare at top level to follow React hooks rules
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState(0)
  const [showResponse, setShowResponse] = useState(false)
  
  // Mock conversation data for voice mode
  const mockConversation = [
    { type: 'user', text: "How does voice mode work in CustomGPT.ai?" },
    { type: 'ai', text: "Voice mode allows natural conversation with 6 different AI voices. Just click record and speak!" },
    { type: 'user', text: "Can I choose different voices?" },
    { type: 'ai', text: "Yes! You can select from voices like Alloy, Echo, Fable, Onyx, Nova, or Shimmer." },
    { type: 'user', text: "What languages are supported?" },
    { type: 'ai', text: "We support over 50 languages including English, Spanish, French, German, Japanese, and more!" }
  ]
  
  // Simulate recording for voice mode
  useEffect(() => {
    if (mode === 'voice' && isRecording) {
      const timer = setTimeout(() => {
        setIsRecording(false)
        setShowResponse(true)
        // Simulate AI response delay
        setTimeout(() => {
          setIsPlaying(true)
          // Stop playing after 2 seconds
          setTimeout(() => {
            setIsPlaying(false)
            // Move to next transcript item
            if (currentTranscript < mockConversation.length - 1) {
              setCurrentTranscript(prev => prev + 1)
            }
          }, 2000)
        }, 500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [mode, isRecording, currentTranscript, mockConversation.length])
  
  const handleRecord = () => {
    if (!isRecording && currentTranscript < mockConversation.length - 1) {
      setIsRecording(true)
      setShowResponse(false)
      // Move to next user message
      if (currentTranscript % 2 === 1) {
        setCurrentTranscript(prev => prev + 1)
      }
    }
  }
  
  if (mode === 'chatbot') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
        {/* Simulated webpage background */}
        <div className="absolute inset-0 p-8 text-gray-400">
          <div className="w-full h-4 bg-gray-300 rounded mb-4"></div>
          <div className="w-3/4 h-4 bg-gray-300 rounded mb-4"></div>
          <div className="w-1/2 h-4 bg-gray-300 rounded mb-8"></div>
          <div className="w-full h-20 bg-gray-300 rounded mb-4"></div>
        </div>
        
        {/* Floating chat bubble */}
        <div className="absolute bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary rounded-full flex items-center justify-center text-white text-2xl shadow-2xl animate-float cursor-pointer hover:scale-110 transition-transform">
          <ChatIcon size={32} />
        </div>
        
        {/* Chat window (when expanded) */}
        <div className="absolute bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 opacity-90">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary rounded-full"></div>
              <div>
                <div className="font-semibold text-sm">CustomGPT.ai Assistant</div>
                <div className="text-xs text-green-500">● Online</div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              Hi! How can I help you today?
            </div>
            <div className="bg-customgpt-primary text-white rounded-lg p-3 text-sm ml-8">
              Tell me about your features
            </div>
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                disabled
              />
              <button className="w-8 h-8 bg-customgpt-primary text-white rounded-lg flex items-center justify-center">
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (mode === 'widget') {
    return (
      <div className="w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Widget embedded in a webpage */}
        <div className="h-full flex flex-col">
          <div className="bg-customgpt-primary text-white p-4 text-center font-semibold">
            CustomGPT.ai Embedded Widget
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              Welcome to our support chat! How can we help?
            </div>
            <div className="bg-customgpt-primary text-white rounded-lg p-3 text-sm ml-8">
              I need help with integration
            </div>
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              I&apos;d be happy to help with integration! What platform are you using?
            </div>
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                disabled
              />
              <button className="px-4 py-2 bg-customgpt-primary text-white rounded-lg text-sm">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (mode === 'mobile') {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-4">
        {/* Mobile PWA Version */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-48 h-96 bg-gray-900 rounded-3xl p-2 overflow-hidden">
            {/* Mobile phone frame */}
            <div className="w-full h-full bg-black rounded-2xl relative overflow-hidden">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-10"></div>
              
              {/* PWA Content */}
              <div className="w-full h-full bg-white">
                <div className="bg-customgpt-primary text-white p-3 pt-6 text-center relative">
                  <div className="font-semibold text-sm">CustomGPT.ai PWA</div>
                  
                  {/* PWA Install Button */}
                  <div className="absolute top-6 right-2 bg-white/20 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1 text-xs border border-white/30">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L12 14M12 14L7 9M12 14L17 9"/>
                      <path d="M3 16h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z"/>
                    </svg>
                    <span className="text-xs">Install</span>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  <div className="bg-gray-100 rounded p-2 text-xs">
                    Hey! I&apos;m your AI assistant.
                  </div>
                  <div className="bg-customgpt-primary text-white rounded p-2 text-xs ml-8">
                    How does voice mode work?
                  </div>
                </div>
                
                {/* Home indicator */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop PWA Version */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
              https://app.customgpt.ai
            </div>
            
            {/* PWA Install Button for Desktop */}
            <div className="bg-customgpt-primary/10 rounded px-2 py-1 flex items-center gap-1 text-xs border border-customgpt-primary/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-customgpt-primary">
                <path d="M12 2L12 14M12 14L7 9M12 14L17 9"/>
                <path d="M3 16h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4z"/>
              </svg>
              <span className="text-customgpt-primary font-medium">Install PWA</span>
            </div>
          </div>
          
          {/* Desktop PWA Content */}
          <div className="p-4 bg-gray-50">
            <div className="max-w-md mx-auto space-y-3">
              <div className="bg-white rounded-lg shadow-sm p-3 text-sm">
                Welcome to CustomGPT.ai PWA! Install this app for offline access and native features.
              </div>
              <div className="bg-customgpt-primary text-white rounded-lg shadow-sm p-3 text-sm ml-16">
                Can I use this offline?
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3 text-sm">
                Yes! Once installed, the PWA works offline with cached responses.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (mode === 'voice') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-customgpt-primary/10 to-customgpt-secondary/10 rounded-xl flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-landing-text mb-1">Voice Mode Active</h3>
          <p className="text-landing-text-secondary text-sm">
            {isRecording ? "I'm listening..." : isPlaying ? "Speaking..." : "Click record to start"}
          </p>
        </div>
        
        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-3 max-h-[200px]">
          {mockConversation.slice(0, currentTranscript + 1).map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-sm ${
                item.type === 'user' 
                  ? 'bg-customgpt-primary text-white ml-8' 
                  : 'bg-white/70 text-landing-text mr-8'
              } ${index === currentTranscript && showResponse ? 'animate-slideIn' : ''}`}
            >
              {item.text}
            </div>
          ))}
        </div>
        
        {/* Voice visualizer */}
        <div className="flex items-center justify-center gap-1 mb-6 h-16">
          {(isRecording || isPlaying) ? (
            [...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-full transition-all duration-300 ${
                  isRecording ? 'bg-red-500' : 'bg-customgpt-primary'
                }`}
                style={{
                  height: isRecording || isPlaying 
                    ? `${20 + Math.random() * 30}px`
                    : '4px',
                  animationDelay: `${i * 100}ms`,
                  transition: 'height 0.1s ease'
                }}
              />
            ))
          ) : (
            <div className="h-1 w-32 bg-customgpt-primary/30 rounded-full"></div>
          )}
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Recording...
          </div>
        )}
        
        {/* Voice controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button 
            onClick={handleRecord}
            disabled={isPlaying || currentTranscript >= mockConversation.length - 1}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 scale-110' 
                : isPlaying
                ? 'bg-gray-400 cursor-not-allowed'
                : currentTranscript >= mockConversation.length - 1
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-customgpt-primary hover:bg-customgpt-secondary hover:scale-105'
            }`}
          >
            <RecordIcon size={24} />
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isPlaying
                ? 'bg-customgpt-primary text-white'
                : 'bg-white/50 text-landing-text hover:bg-white/70'
            }`}
          >
            {isPlaying ? 'AI Speaking...' : 'Voice: Alloy'}
          </button>
        </div>
        
        {/* Instructions */}
        <div className="text-center">
          <p className="text-xs text-landing-text-secondary">
            {currentTranscript >= mockConversation.length - 1 
              ? "Demo complete - Try it in the full app!" 
              : "Click the record button to continue the conversation"}
          </p>
        </div>
      </div>
    )
  }
  
  // Default dashboard mode
  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-64 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="font-semibold text-customgpt-primary text-sm sm:text-base">Conversations</div>
            <div className="space-y-2 lg:space-y-2 flex flex-row lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {['Project Planning', 'API Integration', 'UI Components'].map((title, i) => (
                <div key={i} className="p-2 bg-white rounded-lg text-xs sm:text-sm border border-gray-200 whitespace-nowrap lg:whitespace-normal text-gray-700 hover:bg-gray-50 cursor-pointer">
                  {title}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between">
            <div className="font-semibold text-sm sm:text-base text-gray-800">CustomGPT.ai Assistant</div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="w-8 h-8 bg-customgpt-primary text-white rounded-lg text-sm flex items-center justify-center">
                <VoiceIcon size={16} />
              </button>
              <button className="w-8 h-8 bg-gray-200 rounded-lg text-sm flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-auto">
            <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-gray-800">
              Hello! I&apos;m your CustomGPT.ai assistant. I can help you with development, deployment, and integration questions.
            </div>
            <div className="bg-customgpt-primary text-white rounded-lg p-2 sm:p-3 text-xs sm:text-sm ml-8 sm:ml-16">
              How do I deploy the starter kit to Vercel?
            </div>
            <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-gray-800 max-w-[90%]">
              Great question! Deploying to Vercel is super easy. Just run `vercel deploy` in your terminal...
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                disabled
              />
              <button className="px-6 py-2 bg-customgpt-primary text-white rounded-lg font-semibold">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}