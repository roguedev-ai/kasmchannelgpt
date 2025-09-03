'use client'

import { Terminal } from './Terminal'
import { RocketIcon, GitHubIcon, VideoIcon } from './icons'

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-customgpt-primary/5 to-white flex items-center justify-center overflow-hidden">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(238, 85, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(238, 85, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      <div className="relative z-10 w-full text-center pt-20">
        {/* Content wrapper with padding for non-iframe content */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white font-semibold text-sm tracking-wide mb-8">
            OPEN SOURCE • MIT LICENSE
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 bg-gradient-to-r from-customgpt-primary via-customgpt-secondary to-customgpt-primary bg-clip-text text-transparent">
            Developer Starter Kit
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-landing-text-secondary mb-4 font-medium">
            We pre-built everything developers have been asking for
          </p>
          
          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-landing-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            Complete UI replacement for CustomGPT.ai with voice mode, multi-deployment options, 
            and 9 social platform integrations. Ship faster with production-ready code.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-customgpt-primary/25 hover:-translate-y-0.5 transition-all duration-200 text-lg">
              <RocketIcon size={20} /> Try Live Demo
            </a>
            <a href="https://github.com/Poll-The-People/customgpt-starter-kit" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-customgpt-primary text-customgpt-primary font-semibold rounded-lg hover:bg-customgpt-primary hover:text-white hover:-translate-y-0.5 transition-all duration-200 text-lg">
              <GitHubIcon size={20} /> View on GitHub
            </a>
            <a href="https://www.youtube.com/playlist?list=PLqm0evVmDZ_2ErSA69P4o68h5ZdYDF0jF" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-customgpt-secondary text-customgpt-secondary font-semibold rounded-lg hover:bg-customgpt-secondary hover:text-white hover:-translate-y-0.5 transition-all duration-200 text-lg">
              <VideoIcon size={20} /> Watch Tutorial
            </a>
          </div>
        </div>
        
        {/* Live Preview - Nearly full viewport width */}
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="bg-white rounded-2xl shadow-2xl border border-landing-surface-light overflow-hidden max-w-[1220px] mx-auto">
            <div className="bg-gradient-to-r from-customgpt-primary to-customgpt-secondary p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-white font-medium text-sm ml-2">CustomGPT.ai Starter Kit</span>
              </div>
              <div className="bg-white/20 rounded px-3 py-1 text-white text-xs">
                Live Preview
              </div>
            </div>
            <iframe 
              src="/"
              className="w-full h-[600px] bg-gray-50"
              title="CustomGPT.ai Starter Kit Live Preview"
              loading="lazy"
            />
          </div>
        </div>
        
        {/* Terminal below iframe */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto mt-8">
            <Terminal />
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-customgpt-accent/20 to-customgpt-midtone/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-customgpt-primary/10 to-customgpt-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-r from-customgpt-dark-blue/20 to-customgpt-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}