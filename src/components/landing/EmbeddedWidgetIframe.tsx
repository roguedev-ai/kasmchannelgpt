'use client'

import { useState } from 'react'

export function EmbeddedWidgetIframe() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-landing-surface/50 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-customgpt-primary"></div>
            <p className="mt-2 text-landing-text-secondary">Loading widget demo...</p>
          </div>
        </div>
      )}
      <iframe
        src="/widget-demo.html"
        className="w-full h-full min-h-[500px] border-0 rounded-lg"
        onLoad={() => setIsLoading(false)}
        title="CustomGPT.ai Widget Demo"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  )
}