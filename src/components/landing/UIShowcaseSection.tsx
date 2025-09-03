'use client'

import { ChatIcon, RocketChatIcon, NavigationIcon, VoiceIcon, ToolIcon } from './icons'

const uiComponents = [
  {
    title: 'Chat Interface',
    description: 'Real-time streaming, markdown support, code highlighting',
    tags: ['TypeScript', 'SSE', 'Responsive'],
    preview: '[Chat Interface Screenshot]',
    features: ['Message streaming', 'Markdown rendering', 'Code syntax highlighting', 'Auto-scroll', 'Message history']
  },
  {
    title: 'Agent Selector',
    description: 'Multi-agent support with metadata and quick switching',
    tags: ['Dropdown', 'Search', 'Metadata'],
    preview: '[Agent Selector Screenshot]',
    features: ['Agent search', 'Metadata display', 'Quick switching', 'Agent status', 'Custom branding']
  },
  {
    title: 'File Upload',
    description: 'Drag & drop, progress tracking, multiple file support',
    tags: ['Drag & Drop', 'Progress', 'Validation'],
    preview: '[File Upload Screenshot]',
    features: ['Drag and drop', 'Progress tracking', 'File validation', 'Multiple formats', 'Size limits']
  },
  {
    title: 'Citation Preview',
    description: 'Source preview with highlighting and navigation',
    tags: ['Modal', 'Preview', 'Navigation'],
    preview: '[Citation Modal Screenshot]',
    features: ['Source preview', 'Text highlighting', 'Page navigation', 'Download links', 'Share options']
  },
  {
    title: 'Voice Interface',
    description: 'Speech-to-text and text-to-speech with visual feedback',
    tags: ['Whisper', 'TTS', 'Visualizer'],
    preview: '[Voice Interface Screenshot]',
    features: ['Voice recording', 'Real-time transcription', 'Audio playback', 'Voice selection', 'Visual feedback']
  },
  {
    title: 'Settings Panel',
    description: 'Theme toggle, language selection, preferences',
    tags: ['Dark Mode', 'i18n Ready', 'Persistent'],
    preview: '[Settings Panel Screenshot]',
    features: ['Theme switching', 'Language options', 'User preferences', 'Data persistence', 'Import/export']
  },
  {
    title: 'Message Bubbles',
    description: 'Customizable chat messages with rich content support',
    tags: ['Rich Text', 'Avatars', 'Timestamps'],
    preview: '[Message Bubbles Screenshot]',
    features: ['Rich formatting', 'User avatars', 'Timestamps', 'Action buttons', 'Copy/share']
  },
  {
    title: 'Loading States',
    description: 'Skeleton loaders and progress indicators',
    tags: ['Skeletons', 'Spinners', 'Progress'],
    preview: '[Loading States Screenshot]',
    features: ['Skeleton screens', 'Progress bars', 'Loading spinners', 'Pulse animations', 'Error states']
  },
  {
    title: 'Navigation Bar',
    description: 'Responsive navigation with mobile-first design',
    tags: ['Responsive', 'Mobile Menu', 'Branding'],
    preview: '[Navigation Screenshot]',
    features: ['Mobile hamburger', 'Responsive layout', 'Logo placement', 'User menu', 'Breadcrumbs']
  }
]

export function UIShowcaseSection() {
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
              <div className="h-48 bg-gradient-to-br from-customgpt-primary/5 to-customgpt-secondary/5 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="text-center text-landing-text-secondary">
                  <div className="text-4xl mb-2">
                    {component.title.includes('Chat') ? <ChatIcon size={40} /> :
                     component.title.includes('Agent') ? <RocketChatIcon size={40} /> :
                     component.title.includes('File') ? (
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                         <polyline points="13 2 13 9 20 9"/>
                       </svg>
                     ) :
                     component.title.includes('Citation') ? (
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                         <polyline points="14 2 14 8 20 8"/>
                         <line x1="16" y1="13" x2="8" y2="13"/>
                         <line x1="16" y1="17" x2="8" y2="17"/>
                         <polyline points="10 9 9 9 8 9"/>
                       </svg>
                     ) :
                     component.title.includes('Voice') ? <VoiceIcon size={40} /> :
                     component.title.includes('Settings') ? <ToolIcon size={40} /> :
                     component.title.includes('Message') ? (
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                       </svg>
                     ) :
                     component.title.includes('Loading') ? (
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <line x1="12" y1="2" x2="12" y2="6"/>
                         <line x1="12" y1="18" x2="12" y2="22"/>
                         <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                         <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                         <line x1="2" y1="12" x2="6" y2="12"/>
                         <line x1="18" y1="12" x2="22" y2="12"/>
                         <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                         <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                       </svg>
                     ) :
                     component.title.includes('Navigation') ? <NavigationIcon size={40} /> : <ToolIcon size={40} />}
                  </div>
                  <p className="text-sm font-medium">{component.preview}</p>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-customgpt-primary/10 to-customgpt-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                
                {/* View Component Button */}
                <div className="mt-4 pt-4 border-t border-landing-surface-light">
                  <button className="text-customgpt-primary font-medium text-sm hover:text-customgpt-secondary transition-colors flex items-center gap-1">
                    View Component <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-customgpt-primary/5 to-customgpt-secondary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-landing-text mb-4">
              All Components Included
            </h3>
            <p className="text-landing-text-secondary mb-6 max-w-2xl mx-auto">
              Get access to our complete component library with TypeScript definitions, 
              Storybook documentation, and testing utilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200">
                Browse Storybook
              </button>
              <button className="bg-white border-2 border-customgpt-primary text-customgpt-primary px-8 py-3 rounded-lg font-semibold hover:bg-customgpt-primary hover:text-white hover:-translate-y-0.5 transition-all duration-200">
                View Code Examples
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}