'use client'

import { useState, useEffect } from 'react'
import { ChatIcon, RocketChatIcon, NavigationIcon, VoiceIcon, ToolIcon } from './icons'

const uiComponents = [
  {
    title: 'Chat Interface',
    description: 'Real-time streaming, markdown support, code highlighting',
    tags: ['TypeScript', 'SSE', 'Responsive'],
    preview: '/images/integrations/Chat Interface.png',
    features: ['Message streaming', 'Markdown rendering', 'Code syntax highlighting', 'Auto-scroll', 'Message history']
  },
  {
    title: 'Agent Selector',
    description: 'Multi-agent support with metadata and quick switching',
    tags: ['Dropdown', 'Search', 'Metadata'],
    preview: '/images/integrations/Agent Selector.png',
    features: ['Agent search', 'Metadata display', 'Quick switching', 'Agent status', 'Custom branding']
  },
  {
    title: 'File Upload',
    description: 'Drag & drop, progress tracking, multiple file support',
    tags: ['Drag & Drop', 'Progress', 'Validation'],
    preview: '/images/integrations/file upload.png',
    features: ['Drag and drop', 'Progress tracking', 'File validation', 'Multiple formats', 'Size limits']
  },
  {
    title: 'Citation Preview',
    description: 'Source preview with highlighting and navigation',
    tags: ['Modal', 'Preview', 'Navigation'],
    preview: '/images/integrations/Citation Preview.png',
    features: ['Source preview', 'Text highlighting', 'Page navigation', 'Download links', 'Share options']
  },
  {
    title: 'Voice Interface',
    description: 'Speech-to-text and text-to-speech with visual feedback',
    tags: ['Whisper', 'TTS', 'Visualizer'],
    preview: '/images/integrations/Voice Interface.png',
    features: ['Voice recording', 'Real-time transcription', 'Audio playback', 'Voice selection', 'Visual feedback']
  },
  {
    title: 'Settings Panel',
    description: 'Theme toggle, language selection, preferences',
    tags: ['Dark Mode', 'i18n Ready', 'Persistent'],
    preview: '/images/integrations/Settings Panel.png',
    features: ['Theme switching', 'Language options', 'User preferences', 'Data persistence', 'Import/export']
  }
]

export function UIShowcaseSection() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }
    
    if (selectedImage) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedImage])
  
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            UI Components Gallery
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Every component you need, production-ready and fully customizable
          </p>
        </div>
        
        {/* Components Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {uiComponents.map((component, index) => (
            <div 
              key={index} 
              className="group bg-landing-surface rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-landing-surface-light"
            >
              {/* Component Preview */}
              <div 
                className="h-48 bg-gradient-to-br from-customgpt-primary/5 to-customgpt-secondary/5 relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage({ src: component.preview, title: component.title })}
              >
                <img 
                  src={component.preview} 
                  alt={`${component.title} Preview`}
                  className="w-full h-full object-cover object-top"
                />
                
                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-gradient-to-r from-customgpt-primary/10 to-customgpt-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-customgpt-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Component Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-landing-text mb-2 group-hover:text-customgpt-primary transition-colors">
                  {component.title}
                </h3>
                <p className="text-landing-text-secondary mb-4 text-sm leading-relaxed">
                  {component.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {component.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="px-3 py-1 bg-white border border-customgpt-primary text-customgpt-primary text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Features List */}
                <div className="space-y-2">
                  {component.features.slice(0, 3).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-sm text-landing-text-secondary">
                      <div className="w-1 h-1 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {component.features.length > 3 && (
                    <div className="flex items-center gap-2 text-sm text-customgpt-primary">
                      <div className="w-1 h-1 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                      <span>+{component.features.length - 3} more features</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-50"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image container */}
          <div className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200">
            <img 
              src={selectedImage.src} 
              alt={selectedImage.title}
              className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image title */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-xl font-semibold">{selectedImage.title}</h3>
            </div>
          </div>
          
          {/* Instructions */}
          <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
            Click anywhere or press Escape to close
          </p>
        </div>
      )}
    </section>
  )
}