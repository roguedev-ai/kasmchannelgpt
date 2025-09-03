'use client'

import { 
  ChatIcon, 
  VoiceIcon, 
  RocketIcon, 
  ShieldIcon, 
  MobileIcon, 
  LightningIcon, 
  TypeScriptIcon 
} from './icons'

const features = [
  {
    title: 'Complete Chat Interface',
    description: 'Full-featured chat UI with message history, streaming responses, file uploads, and citation management.',
    size: 'large', // spans 2x2
    icon: ChatIcon,
    preview: '[Chat Interface Preview]',
    details: [
      'Real-time message streaming',
      'Conversation history',
      'File attachment support', 
      'Citation management',
      'Markdown rendering'
    ]
  },
  {
    title: 'Voice Mode',
    description: '6 voice options powered by OpenAI Whisper & TTS',
    size: 'medium', // spans 2x1  
    icon: VoiceIcon,
    code: `// Enable voice with one line
OPENAI_API_KEY=sk-...`,
    details: [
      'OpenAI Whisper integration',
      '6 voice personalities',
      'Real-time transcription'
    ]
  },
  {
    title: 'Deploy Anywhere',
    description: 'Choose your platform and deploy with a single command',
    size: 'medium', // spans 2x1
    icon: RocketIcon,
    code: `$ vercel deploy
✓ Deployed to production`,
    details: [
      'Vercel deployment',
      'Docker support',
      'Railway integration'
    ]
  },
  {
    title: 'Secure by Default',
    description: 'API keys stay server-side',
    size: 'small', // spans 1x1
    icon: ShieldIcon,
    details: [
      'Server-side API keys',
      'Proxy architecture',
      'CORS handling'
    ]
  },
  {
    title: 'PWA Ready',
    description: 'Installable on all devices',
    size: 'small', // spans 1x1
    icon: MobileIcon,
    details: [
      'Progressive Web App',
      'Offline capability',
      'Home screen install'
    ]
  },
  {
    title: 'Real-time Streaming',
    description: 'SSE with error boundaries',
    size: 'small', // spans 1x1
    icon: LightningIcon,
    details: [
      'Server-sent events',
      'Auto reconnection',
      'Error boundaries'
    ]
  },
  {
    title: 'TypeScript',
    description: 'Full type safety',
    size: 'small', // spans 1x1
    icon: TypeScriptIcon,
    details: [
      'End-to-end typing',
      'IDE autocomplete',
      'Runtime safety'
    ]
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Everything You Need to Ship
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Production-ready components, secure architecture, and deployment flexibility
          </p>
        </div>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative bg-landing-surface border border-landing-surface-light rounded-xl sm:rounded-2xl hover:border-customgpt-primary hover:shadow-xl transition-all duration-300 ${
                feature.size === 'large' 
                  ? 'col-span-2 md:col-span-2 md:row-span-2 p-4 sm:p-6' 
                  : feature.size === 'medium'
                  ? 'col-span-2 md:col-span-2 p-3 sm:p-4 lg:p-6'
                  : 'col-span-1 p-3 sm:p-4'
              }`}
            >
              {/* Feature Header */}
              {feature.size === 'small' ? (
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-center">
                    <feature.icon size={32} className="text-customgpt-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-base text-landing-text group-hover:text-customgpt-primary transition-colors mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-landing-text-secondary leading-snug">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`flex items-start gap-3 ${feature.size === 'medium' ? 'mb-3' : 'mb-4'}`}>
                  <div className="flex-shrink-0 text-3xl">
                    <feature.icon size={32} className="text-customgpt-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-landing-text mb-2 group-hover:text-customgpt-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-landing-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Feature Content */}
              <div className={feature.size === 'small' ? 'space-y-3' : 'space-y-4'}>
                {/* Code Preview for applicable features */}
                {feature.code && (
                  <div className="bg-black rounded-lg p-3 font-mono text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-landing-terminal-green whitespace-pre-line">
                      {feature.code}
                    </div>
                  </div>
                )}
                
                {/* Preview for large feature */}
                {feature.size === 'large' && feature.preview && (
                  <div className="bg-white border border-landing-surface-light rounded-xl overflow-hidden">
                    <img 
                      src="/images/integrations/Chat Interface.png"
                      alt="Chat Interface Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Feature Details - Only show for non-small cards on mobile */}
                <div className={`space-y-2 ${feature.size === 'small' ? 'hidden sm:block' : ''}`}>
                  {feature.details.slice(0, feature.size === 'small' ? 3 : feature.size === 'large' ? 5 : 3).map((detail, detailIndex) => (
                    <div key={detailIndex} className={`flex items-center gap-2 text-landing-text-secondary ${
                      feature.size === 'small' ? 'text-xs' : 'text-sm'
                    }`}>
                      <div className={`bg-customgpt-primary rounded-full flex-shrink-0 ${
                        feature.size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5'
                      }`}></div>
                      <span>{detail}</span>
                    </div>
                  ))}
                  {feature.details.length > (feature.size === 'small' ? 3 : feature.size === 'large' ? 5 : 3) && (
                    <div className={`flex items-center gap-2 text-customgpt-primary ${
                      feature.size === 'small' ? 'text-xs' : 'text-sm'
                    }`}>
                      <div className={`bg-customgpt-primary rounded-full flex-shrink-0 ${
                        feature.size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5'
                      }`}></div>
                      <span>+{feature.details.length - (feature.size === 'small' ? 3 : feature.size === 'large' ? 5 : 3)} more</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-customgpt-primary/5 to-customgpt-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-customgpt-primary/5 to-customgpt-secondary/5 rounded-2xl p-8 border border-customgpt-primary/20">
            <h3 className="text-2xl font-bold text-landing-text mb-4">
              Ready to Start Building?
            </h3>
            <p className="text-landing-text-secondary mb-6 max-w-2xl mx-auto">
              Get the complete starter kit with all features, documentation, and examples. 
              Start building your CustomGPT.ai interface today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://github.com/Poll-The-People/customgpt-starter-kit" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200">
                Download Starter Kit
              </a>
              <a href="https://docs.customgpt.ai/reference/full-fledged-chat-ui-with-project-settings" target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-customgpt-primary text-customgpt-primary px-8 py-3 rounded-lg font-semibold hover:bg-customgpt-primary hover:text-white hover:-translate-y-0.5 transition-all duration-200">
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}