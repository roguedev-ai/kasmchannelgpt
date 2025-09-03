'use client'

import {
  VercelIcon,
  RailwayIcon,
  DockerIcon,
  NetlifyIcon,
  WordPressIcon,
  GoogleScriptIcon
} from './icons'

const deploymentOptions = [
  {
    icon: VercelIcon,
    name: 'Vercel',
    time: '3 mins',
    command: 'vercel deploy',
    description: 'Deploy to Vercel with zero configuration',
    color: 'from-black to-gray-800'
  },
  {
    icon: RailwayIcon,
    name: 'Railway',
    time: '5 mins', 
    command: 'railway up',
    description: 'Deploy to Railway with automatic scaling',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: DockerIcon,
    name: 'Docker',
    time: '2 mins',
    command: 'docker-compose up',
    description: 'Containerized deployment anywhere',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: NetlifyIcon,
    name: 'Netlify',
    time: '3 mins',
    command: 'netlify deploy',
    description: 'Static deployment with edge functions',
    color: 'from-teal-400 to-blue-500'
  },
  {
    icon: WordPressIcon,
    name: 'WordPress',
    time: '5 mins',
    command: '<script> embed',
    description: 'Embed widget in WordPress sites',
    color: 'from-blue-600 to-indigo-600'
  },
  {
    icon: GoogleScriptIcon,
    name: 'Google Apps Script',
    time: '10 mins',
    command: 'clasp push',
    description: 'Deploy as Google Apps Script',
    color: 'from-white to-white'
  }
]

export function DeploymentSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text mb-4">
            Deploy Anywhere in Minutes
          </h2>
          <p className="text-lg sm:text-xl text-landing-text-secondary max-w-3xl mx-auto">
            Choose your preferred platform and deploy with a single command
          </p>
        </div>
        
        {/* Deployment Options Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deploymentOptions.map((option, index) => (
            <div
              key={index}
              className="group bg-landing-surface border border-landing-surface-light rounded-2xl p-6 text-center hover:border-customgpt-primary hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              {/* Icon with gradient background */}
              <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <option.icon size={32} className="text-white" />
              </div>
              
              {/* Platform Info */}
              <h3 className="text-xl font-bold text-landing-text mb-2 group-hover:text-customgpt-primary transition-colors">
                {option.name}
              </h3>
              <p className="text-customgpt-primary font-semibold mb-3">
                Deploy in {option.time}
              </p>
              <p className="text-landing-text-secondary text-sm mb-6 leading-relaxed">
                {option.description}
              </p>
              
              {/* Command */}
              <div className="bg-black rounded-lg p-3 mb-6 font-mono text-customgpt-accent text-sm">
                {option.command}
              </div>
              
              {/* Deploy Button */}
              <button className="w-full bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200">
                Deploy Now
              </button>
            </div>
          ))}
        </div>
        
        {/* Bottom Info */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-customgpt-primary/5 to-customgpt-secondary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-landing-text mb-4">
              One Codebase, Every Platform
            </h3>
            <p className="text-landing-text-secondary max-w-2xl mx-auto mb-6">
              The same starter kit works everywhere. Choose your deployment method 
              and get your CustomGPT.ai interface live in minutes.
            </p>
            <button className="bg-white border-2 border-customgpt-primary text-customgpt-primary px-8 py-3 rounded-lg font-semibold hover:bg-customgpt-primary hover:text-white hover:-translate-y-0.5 transition-all duration-200">
              View Deployment Guide
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}