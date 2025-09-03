'use client'

import { useState } from 'react'
import { MockWidget } from './MockWidget'
import { MockEmbeddedWidget } from './MockEmbeddedWidget'
import { MockFloatingChatbot } from './MockFloatingChatbot'
import {
  DashboardIcon,
  WidgetIcon,
  ChatbotIcon,
  MobileIcon,
  VoiceIcon
} from './icons'

const demoModes = [
  {
    id: 'dashboard',
    icon: DashboardIcon,
    label: 'Full Dashboard',
    title: 'Complete Dashboard Experience',
    description: 'Full-featured chat interface with all capabilities enabled',
    features: [
      'Multiple agent management',
      'Conversation history sidebar',
      'File upload & attachments',
      'Citation preview modal',
      'Voice transcription & synthesis',
      'Dark/light theme toggle',
      'PWA installable'
    ],
    screenshot: '[Dashboard Screenshot]'
  },
  {
    id: 'widget',
    icon: WidgetIcon, 
    label: 'Embedded Widget',
    title: 'Seamless Website Integration',
    description: 'Embed anywhere with a simple script tag',
    features: [
      'Drop-in widget integration',
      'Customizable appearance',
      'Responsive design',
      'API key security',
      'Cross-domain support',
      'Minimal footprint',
      'Theme customization'
    ],
    screenshot: '[Widget Screenshot]'
  },
  {
    id: 'chatbot',
    icon: ChatbotIcon,
    label: 'Floating Chatbot', 
    title: 'Always-Available Assistant',
    description: 'Floating chat bubble for instant access',
    features: [
      'Unobtrusive floating bubble',
      'Expandable chat window',
      'Position customization',
      'Notification badges',
      'Auto-hide options',
      'Mobile optimized',
      'Accessibility compliant'
    ],
    screenshot: '[Chatbot Screenshot]'
  },
  {
    id: 'mobile',
    icon: MobileIcon,
    label: 'Mobile PWA',
    title: 'Native App Experience', 
    description: 'Progressive Web App for mobile devices',
    features: [
      'App-like experience',
      'Offline capability',
      'Push notifications',
      'Home screen install',
      'Native gestures',
      'Camera integration',
      'Voice input optimized'
    ],
    screenshot: '[Mobile Screenshot]'
  },
  {
    id: 'voice',
    icon: VoiceIcon,
    label: 'Voice Mode',
    title: 'Hands-Free Interaction',
    description: 'Full voice-to-voice conversations',
    features: [
      '6 voice personalities',
      'Real-time transcription',
      'Natural speech synthesis',
      'Voice activity detection',
      'Background noise filtering',
      'Multi-language support',
      'Conversation continuity'
    ],
    screenshot: '[Voice Screenshot]'
  }
]

export function LiveDemoSection() {
  const [activeMode, setActiveMode] = useState('dashboard')
  const currentMode = demoModes.find(mode => mode.id === activeMode) || demoModes[0]
  
  return (
    <section className="py-20 bg-landing-surface border-t border-b border-landing-surface-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Experience Every Deployment Mode
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            See how the same codebase works as a standalone app, embedded widget, or floating chatbot
          </p>
        </div>
        
        {/* Demo Mode Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12">
          {demoModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                activeMode === mode.id
                  ? 'bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white shadow-lg'
                  : 'bg-white border-2 border-landing-surface-light text-landing-text hover:border-customgpt-primary hover:-translate-y-0.5'
              }`}
            >
              <mode.icon size={20} className="text-current" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
        
        {/* Demo Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-landing-surface-light">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Demo Features */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-landing-text mb-2">
                  {currentMode.title}
                </h3>
                <p className="text-base sm:text-lg text-landing-text-secondary">
                  {currentMode.description}
                </p>
              </div>
              
              {/* Feature List */}
              <ul className="space-y-3">
                {currentMode.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-landing-text-secondary">
                    <div className="w-1.5 h-1.5 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Launch Button */}
              <div className="pt-4">
                {activeMode === 'widget' ? (
                  <div className="text-sm text-landing-text-secondary">
                    <p className="hidden lg:block">← Try the live widget demo on the right!</p>
                    <p className="lg:hidden">↓ Try the live widget demo below!</p>
                    <p className="mt-1">This is the actual CustomGPT.ai widget embedded in the page.</p>
                  </div>
                ) : activeMode === 'chatbot' ? (
                  <div className="text-sm text-landing-text-secondary">
                    <p className="hidden lg:block">← Try the floating chatbot demo on the right!</p>
                    <p className="lg:hidden">↓ Try the floating chatbot demo below!</p>
                    <p className="mt-1">Click the chat bubble to open the chatbot window.</p>
                  </div>
                ) : activeMode === 'mobile' ? (
                  <div className="text-sm text-landing-text-secondary">
                    <p>Progressive Web App with native mobile experience.</p>
                    <p className="mt-1">Install the dashboard on your device for app-like functionality.</p>
                  </div>
                ) : activeMode === 'voice' ? (
                  <div className="text-sm text-landing-text-secondary">
                    <p>Experience voice-to-voice conversations with 6 AI personalities.</p>
                    <p className="mt-1">Available in the full dashboard with OpenAI API key.</p>
                  </div>
                ) : (
                  <a href="/" className="inline-block bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200">
                    Launch {currentMode.label} Demo →
                  </a>
                )}
              </div>
            </div>
            
            {/* Demo Screenshot/Preview */}
            <div className="relative">
              <div className={`bg-landing-surface border border-landing-surface-light rounded-xl p-4 min-h-[400px] sm:min-h-[500px] ${
                activeMode === 'chatbot' ? '' : 'overflow-hidden'
              }`}>
                {activeMode === 'widget' ? (
                  <MockEmbeddedWidget />
                ) : activeMode === 'chatbot' ? (
                  <MockFloatingChatbot />
                ) : (
                  <MockWidget mode={activeMode as any} />
                )}
              </div>
              
              {/* Mode indicator dots */}
              <div className="flex justify-center gap-2 mt-6">
                {demoModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      activeMode === mode.id 
                        ? 'bg-customgpt-primary' 
                        : 'bg-landing-surface-light hover:bg-customgpt-primary/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}