'use client'

import { useEffect, useRef, useState } from 'react'

// Get agent ID from environment or use a default demo ID
// Note: The env variable has a typo (AGENt_ID with lowercase 't')
const AGENT_ID = process.env.NEXT_PUBLIC_CUSTOMGPT_AGENT_ID || process.env.NEXT_PUBLIC_CUSTOMGPT_AGENt_ID || '63492'

export function EmbeddedWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWidget = () => {
      try {
        // Create a container div for the widget
        const widgetContainer = document.createElement('div')
        widgetContainer.id = 'customgpt-widget-demo'
        containerRef.current?.appendChild(widgetContainer)

        // Create and load the widget script
        const script = document.createElement('script')
        script.src = '/dist/widget/customgpt-widget.js'
        script.async = true
        
        script.onload = () => {
          // Initialize the widget after script loads
          if ((window as any).CustomGPT.aiWidget) {
            (window as any).CustomGPT.aiWidget.init({
              agentId: AGENT_ID, // Use environment variable
              containerId: 'customgpt-widget-demo',
              position: 'embedded', // Embedded mode instead of bottom-right
              theme: 'light',
              primaryColor: '#EE55FF',
              initialMessage: 'Hi! I\'m a demo of the CustomGPT.ai widget. Try asking me something!',
              // IMPORTANT: No API key here! The widget will use the proxy endpoint
              // which adds the API key server-side, keeping it secure
              apiEndpoint: '/api/proxy', // All API calls go through our secure proxy
              // Widget will make calls like: /api/proxy/conversations, /api/proxy/messages, etc.
            })
            setIsLoaded(true)
          }
        }

        script.onerror = () => {
          setError('Failed to load widget script')
        }

        document.body.appendChild(script)

        return () => {
          // Cleanup
          const existingScript = document.querySelector('script[src="/dist/widget/customgpt-widget.js"]')
          if (existingScript) {
            document.body.removeChild(existingScript)
          }
          // Clean up widget if it has a destroy method
          if ((window as any).CustomGPT.aiWidget?.destroy) {
            (window as any).CustomGPT.aiWidget.destroy()
          }
        }
      } catch (err) {
        setError('Error initializing widget')
        console.error('Widget initialization error:', err)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadWidget, 100)
    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] text-landing-text-secondary">
        <div className="text-center">
          <p className="mb-2">{error}</p>
          <p className="text-sm">Widget demo is currently unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-landing-surface/50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-customgpt-primary"></div>
            <p className="mt-2 text-landing-text-secondary">Loading widget...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}