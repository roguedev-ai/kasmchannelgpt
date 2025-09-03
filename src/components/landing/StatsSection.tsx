'use client'

import { 
  StarIcon,
  RocketIcon,
  UsersIcon,
  LinkIcon,
  HeartIcon,
  GitHubIcon,
  DiscordIcon,
  BugIcon,
  VideoIcon,
  BookIcon,
  CalendarIcon,
  PlugIcon,
  WrenchIcon,
  MailIcon
} from './icons'

const stats = [
  {
    number: '2',
    label: 'GitHub Stars',
    icon: StarIcon,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    number: '10+',
    label: 'Active Deployments',
    icon: RocketIcon,
    color: 'from-customgpt-primary to-customgpt-secondary'
  },
  {
    number: '2',
    label: 'Contributors',
    icon: UsersIcon,
    color: 'from-customgpt-secondary to-customgpt-dark-blue'
  },
  {
    number: '9',
    label: 'Platform Integrations', 
    icon: LinkIcon,
    color: 'from-customgpt-dark-blue to-customgpt-midtone'
  },
  {
    number: '100%',
    label: 'Open Source',
    icon: HeartIcon,
    color: 'from-customgpt-midtone to-customgpt-accent'
  }
]

export function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Join the Community
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
            Thousands of developers are already building amazing experiences with CustomGPT.ai Starter Kit
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <div className="text-4xl mb-4">
                <stat.icon size={40} className="mx-auto" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-white/80 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Community Links */}
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Get Involved
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join our growing community of developers. Contribute code, share feedback, 
              or get help with your implementation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://github.com/Poll-The-People/customgpt-starter-kit" target="_blank" rel="noopener noreferrer" className="bg-white text-customgpt-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 justify-center">
                <GitHubIcon size={20} /> Star on GitHub
              </a>
              <a href="https://customgpt.ai/slack" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-customgpt-primary hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 justify-center">
                <DiscordIcon size={20} className="fill-current" /> Join Slack
              </a>
              <a href="https://github.com/Poll-The-People/customgpt-starter-kit/issues" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-customgpt-primary hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 justify-center">
                <BugIcon size={20} /> Report Issues
              </a>
            </div>
          </div>
        </div>
        
        {/* Developer Resources Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Developer Resources
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Cookbook */}
            <a href="https://github.com/Poll-The-People/customgpt-cookbook" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <GitHubIcon size={28} className="text-white mb-2 sm:mb-3" />
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Cookbook</h4>
              <p className="text-white/80 text-xs sm:text-sm">Examples and recipes for common use cases</p>
            </a>
            
            {/* Office Hours */}
            <a href="https://lu.ma/customgpt" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <CalendarIcon size={28} className="text-white mb-2 sm:mb-3" />
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Office Hours</h4>
              <p className="text-white/80 text-xs sm:text-sm">Join our weekly developer sessions</p>
            </a>
            
            {/* OpenAI Compatibility */}
            <a href="https://docs.customgpt.ai/reference/customgptai-openai-sdk-compatibility#/" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <PlugIcon size={28} className="text-white mb-2 sm:mb-3" />
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">OpenAI SDK</h4>
              <p className="text-white/80 text-xs sm:text-sm">Drop-in OpenAI compatibility docs</p>
            </a>
            
            {/* MCP Docs */}
            <a href="https://docs.customgpt.ai/reference/customgptai-mcp-support#/" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <WrenchIcon size={28} className="text-white mb-2 sm:mb-3" />
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">MCP Support</h4>
              <p className="text-white/80 text-xs sm:text-sm">Model Context Protocol integration</p>
            </a>
            
            {/* YouTube Channel */}
            <a href="https://www.youtube.com/playlist?list=PLqm0evVmDZ_0_w2GubDwNU2gLPKMAthZj" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <VideoIcon size={28} className="text-white mb-2 sm:mb-3" />
              <h4 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Video Tutorials</h4>
              <p className="text-white/80 text-xs sm:text-sm">Step-by-step implementation guides</p>
            </a>
            
            {/* Postman Collection */}
            <a href="https://customgpt.ai/postman-api-collection" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <MailIcon size={32} className="text-white mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Postman Collection</h4>
              <p className="text-white/80 text-sm">Pre-built API request collection</p>
            </a>
            
            {/* Integrations */}
            <a href="https://customgpt.ai/integrations/" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <LinkIcon size={32} className="text-white mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">All Integrations</h4>
              <p className="text-white/80 text-sm">Browse all available integrations</p>
            </a>
            
            {/* API Reference */}
            <a href="https://customgpt.ai/api/" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300">
              <BookIcon size={32} className="text-white mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">API Reference</h4>
              <p className="text-white/80 text-sm">Complete API documentation</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}