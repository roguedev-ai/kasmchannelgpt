'use client'

import { useState } from 'react'
import { Terminal } from './Terminal'
import { YouTubeEmbed } from './YouTubeEmbed'
import {
  SlackIcon,
  DiscordIcon,
  WhatsAppIcon,
  TelegramIcon,
  FacebookIcon,
  InstagramIcon,
  MSTeamsIcon,
  GoogleChatIcon,
  RocketChatIcon,
  GitHubIcon
} from './icons'

const botIntegrations = [
  {
    id: 'slack',
    icon: SlackIcon,
    name: 'Slack Bot',
    description: 'Native Slack integration with slash commands and interactive messages',
    deployTime: '5 mins',
    features: [
      'Slash commands support',
      'Thread conversations', 
      'Rich message formatting',
      'File sharing capability',
      'Workspace deployment',
      'Channel permissions'
    ],
    demoVideo: 'slack-demo.mp4',
    screenshot: '/images/integrations/customgpt_slack.jpeg',
    command: 'cd integrations/slack && npm run deploy',
    gradient: 'from-purple-500 to-indigo-600',
    githubUrl: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Slack-Bot'
  },
  {
    id: 'discord',
    icon: DiscordIcon, 
    name: 'Discord Bot',
    description: 'Full Discord bot with slash commands and role-based permissions',
    deployTime: '5 mins',
    features: [
      'Slash commands',
      'Embed messages',
      'Role permissions',
      'Multi-server support',
      'Voice channel integration',
      'Auto-moderation features'
    ],
    demoVideo: 'discord-demo.mp4',
    screenshot: '/images/integrations/customgpt_discord.jpeg',
    command: 'cd integrations/discord && npm run deploy',
    gradient: 'from-indigo-500 to-purple-600',
    githubUrl: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Discord-Bot'
  },
  {
    id: 'whatsapp',
    icon: WhatsAppIcon,
    name: 'WhatsApp Bot', 
    description: 'WhatsApp Business API integration via Twilio',
    deployTime: '10 mins',
    features: [
      'Two-way messaging',
      'Media support',
      'Quick replies',
      'Session management', 
      'Rate limiting',
      'Broadcast messages'
    ],
    demoVideo: 'whatsapp-demo.mp4',
    screenshot: '/images/integrations/customgpt_whatsapp.jpeg',
    command: 'cd integrations/whatsapp && npm run deploy',
    gradient: 'from-green-500 to-emerald-600',
    githubUrl: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Whatsapp-Bot'
  },
  {
    id: 'telegram',
    icon: TelegramIcon,
    name: 'Telegram Bot',
    description: 'Native Telegram bot with inline queries and keyboard support',
    deployTime: '5 mins', 
    features: [
      'Inline queries',
      'Custom keyboards',
      'Group chat support',
      'Media handling',
      'Webhook or polling',
      'Bot API integration'
    ],
    demoVideo: 'telegram-demo.mp4',
    screenshot: '/images/integrations/customgpt_telegram.jpeg',
    command: 'cd integrations/telegram && npm run deploy',
    gradient: 'from-blue-500 to-cyan-600',
    githubUrl: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Telegram-Bot'
  }
]

export function BotIntegrationsSection() {
  const [activeBot, setActiveBot] = useState('slack')
  const [viewMode, setViewMode] = useState<'screenshot' | 'video'>('screenshot')
  
  const currentBot = botIntegrations.find(bot => bot.id === activeBot) || botIntegrations[0]
  
  return (
    <section className="py-20 bg-landing-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Connect Your RAG Everywhere
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Deploy CustomGPT.ai-powered bots across 9+ platforms with full conversation context
          </p>
        </div>
        
        {/* Platform Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {botIntegrations.map((bot) => (
            <button
              key={bot.id}
              onClick={() => setActiveBot(bot.id)}
              className={`group p-6 rounded-xl text-center transition-all duration-300 ${
                activeBot === bot.id
                  ? 'bg-white border-2 border-customgpt-primary shadow-lg'
                  : 'bg-white border border-landing-surface-light hover:border-customgpt-primary hover:shadow-md hover:-translate-y-1'
              }`}
            >
              <div className="text-3xl mb-3">
                <bot.icon size={30} className={`mx-auto ${
                  activeBot === bot.id ? 'text-customgpt-primary' : 'text-gray-700'
                }`} />
              </div>
              <div className={`font-semibold mb-1 ${activeBot === bot.id ? 'text-customgpt-primary' : 'text-landing-text'}`}>
                {bot.name}
              </div>
              <div className="text-sm text-landing-text-secondary">
                Deploy in {bot.deployTime}
              </div>
            </button>
          ))}
        </div>
        
        {/* Main Integration Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Integration Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">
                  <currentBot.icon size={40} className="text-customgpt-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-landing-text">{currentBot.name}</h3>
                  <p className="text-customgpt-primary font-medium">Ready in {currentBot.deployTime}</p>
                </div>
              </div>
              <p className="text-lg text-landing-text-secondary">
                {currentBot.description}
              </p>
            </div>
            
            {/* Features */}
            <div>
              <h4 className="font-semibold text-landing-text mb-4">Key Features:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentBot.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-landing-text-secondary">
                    <div className="w-2 h-2 bg-customgpt-primary rounded-full flex-shrink-0"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Button */}
            <div>
              <a 
                href={currentBot.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
              >
                <GitHubIcon size={16} /> View Deploy Guide
              </a>
            </div>
          </div>
          
          {/* Media Preview */}
          <div className="bg-white rounded-2xl p-6 border border-landing-surface-light shadow-xl">
            {/* Media Tabs */}
            <div className="flex gap-2 mb-6">
              {(['screenshot', 'video'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-customgpt-primary text-white'
                      : 'bg-landing-surface text-landing-text hover:bg-customgpt-primary/10'
                  }`}
                >
                  {mode === 'screenshot' ? 'Screenshot' : 'Video'}
                </button>
              ))}
            </div>
            
            {/* Media Content */}
            <div className="bg-landing-surface rounded-xl min-h-[400px] flex items-center justify-center relative overflow-hidden">
              {viewMode === 'video' ? (
                <div className="w-full">
                  <YouTubeEmbed 
                    videoId="dQw4w9WgXcQ" // Replace with actual demo video IDs
                    title={`${currentBot.name} Demo`}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="w-full h-full">
                  <img 
                    src={currentBot.screenshot}
                    alt={`${currentBot.name} interface preview`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Deploy Terminal */}
        <div className="bg-white rounded-2xl p-8 border border-landing-surface-light">
          <h3 className="text-xl font-bold text-landing-text mb-6 text-center">
            Deploy {currentBot.name} in Minutes
          </h3>
          <Terminal
            commands={[
              `# Quick deploy ${currentBot.name.toLowerCase()} integration`,
              currentBot.command,
              '$ npm install',
              '$ npm run deploy',
              '',
              `✓ Bot deployed to ${currentBot.name.toLowerCase()}.com`,
              '✓ Webhook configured',
              '✓ Ready to chat!'
            ]}
          />
        </div>
        
        {/* All Platforms Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-landing-text text-center mb-8">
            All Supported Platforms
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
            {[
              { name: 'Slack', icon: SlackIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Slack-Bot' },
              { name: 'Discord', icon: DiscordIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Discord-Bot' },
              { name: 'WhatsApp', icon: WhatsAppIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Whatsapp-Bot' },
              { name: 'Telegram', icon: TelegramIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Telegram-Bot' },
              { name: 'Facebook', icon: FacebookIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Facebook%20Messenger-Bot' },
              { name: 'Instagram', icon: InstagramIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Instagram%20Chat%20Bot' },
              { name: 'MS Teams', icon: MSTeamsIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/MS%20Teams' },
              { name: 'Google Chat', icon: GoogleChatIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Google%20Chat-Bot' },
              { name: 'Rocket.Chat', icon: RocketChatIcon, url: 'https://github.com/Poll-The-People/customgpt-integrations/tree/main/Rocket%20Chat%20Bot' }
            ].map((platform, index) => (
              <a
                key={index}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-landing-surface-light rounded-lg p-4 text-center hover:border-customgpt-primary hover:shadow-md transition-all duration-200 block"
              >
                <div className="text-2xl mb-2">
                  <platform.icon size={24} className="text-gray-700 mx-auto" />
                </div>
                <div className="text-sm font-medium text-landing-text">{platform.name}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}