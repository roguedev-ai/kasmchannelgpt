'use client'

interface TerminalProps {
  commands?: string[]
  className?: string
}

export function Terminal({ 
  commands = [
    "$ git clone https://github.com/Poll-The-People/customgpt-starter-kit",
    "$ cd customgpt-starter-kit", 
    "$ npm install && npm run dev",
    "",
    "✓ Running at http://localhost:3000"
  ],
  className = ""
}: TerminalProps) {
  return (
    <div className={`bg-black border border-landing-surface-light rounded-xl p-6 max-w-2xl mx-auto shadow-2xl ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      
      {/* Terminal Content */}
      <div className="font-mono text-landing-terminal-green text-sm leading-relaxed text-left">
        {commands.map((line, index) => (
          <div key={index} className="mb-1 text-left">
            {line.startsWith('✓') ? (
              <span className="text-green-400">{line}</span>
            ) : line.startsWith('#') ? (
              <span className="text-gray-500">{line}</span>
            ) : (
              <span>{line}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}