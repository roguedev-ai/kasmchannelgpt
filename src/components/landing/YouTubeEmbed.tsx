'use client'

interface YouTubeEmbedProps {
  videoId: string
  title?: string
  autoplay?: boolean
  className?: string
}

export function YouTubeEmbed({ 
  videoId, 
  title = "CustomGPT.ai Demo",
  autoplay = false,
  className = ""
}: YouTubeEmbedProps) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`
  
  return (
    <div className={`relative w-full pb-[56.25%] h-0 overflow-hidden rounded-xl ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full border-0"
      />
    </div>
  )
}