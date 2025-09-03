'use client'

import { useState } from 'react'
import { ChatIcon } from './icons'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const DEMO_RESPONSES = [
  "Hi! I'm your CustomGPT.ai assistant. I'm here to help with any questions you have!",
  "The floating chatbot stays accessible on every page of your website. Users can minimize it when not needed.",
  "Yes, you can customize my position, colors, and initial greeting message to match your brand.",
  "The chatbot maintains conversation history even when minimized, so users never lose their context.",
  "I can help with product questions, support issues, documentation, and much more!"
]

export function MockFloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate response delay
    setTimeout(() => {
      const response = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)]
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  const toggleChat = () => {
    console.log('Chat toggle clicked, current state:', isOpen)
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasUnread(false)
    }
  }

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg">
      {/* Simulated webpage background */}
      <div className="absolute inset-0 p-8 overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="w-full h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-1/2 h-4 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm">
          <p>Your website content here</p>
        </div>
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="absolute top-4 right-4 w-80 h-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-slideDown z-50">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary rounded-t-2xl">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ChatIcon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">CustomGPT.ai Assistant</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Always here to help
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-customgpt-primary text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-customgpt-primary focus:ring-1 focus:ring-customgpt-primary/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-customgpt-primary text-white rounded-lg hover:bg-customgpt-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Bubble */}
      <button
        onClick={toggleChat}
        className={`absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-r from-customgpt-primary to-customgpt-secondary rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 z-50 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <ChatIcon size={28} />
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            1
          </span>
        )}
      </button>

      {/* Pulse animation for attention */}
      {!isOpen && (
        <>
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-customgpt-primary/30 rounded-full animate-ping pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-customgpt-primary/20 rounded-full animate-ping pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}