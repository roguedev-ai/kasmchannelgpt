/**
 * Utility functions for voice mode
 */

/**
 * Simple markdown parser for voice responses
 * Removes markdown formatting for cleaner display in voice UI
 */
export function parseMarkdownForVoice(text: string): string {
  return text
    // Remove bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markers
    .replace(/\*(.*?)\*/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/#{1,6}\s+/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Remove bullet points
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove numbered lists
    .replace(/^\s*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split response into chunks for streaming display
 */
export function* streamTextChunks(text: string, chunkSize: number = 50): Generator<string> {
  const words = text.split(' ');
  let currentChunk = '';
  
  for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize && currentChunk.length > 0) {
      yield currentChunk.trim();
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  
  if (currentChunk) {
    yield currentChunk.trim();
  }
}