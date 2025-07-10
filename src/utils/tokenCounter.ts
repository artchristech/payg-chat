// Simple token estimation utility
// This provides a rough approximation of tokens for GPT-style models
// 1 token ≈ 4 characters for English text on average

export function estimateTokens(text: string): number {
  // Remove extra whitespace and normalize
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  
  // Rough estimation: 1 token ≈ 4 characters
  // This is a conservative estimate that works reasonably well for most text
  return Math.ceil(normalizedText.length / 4);
}

export function shouldChunkResponse(text: string, maxTokens: number = 400): boolean {
  return estimateTokens(text) > maxTokens;
}

export function findChunkBreakpoint(text: string, maxTokens: number = 400): number {
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text.length;
  }
  
  // Try to break at sentence boundaries first
  const sentenceBreaks = ['. ', '! ', '? ', '\n\n'];
  for (const breakChar of sentenceBreaks) {
    const lastBreak = text.lastIndexOf(breakChar, maxChars);
    if (lastBreak > maxChars * 0.7) { // Don't break too early
      return lastBreak + breakChar.length;
    }
  }
  
  // Fall back to word boundaries
  const lastSpace = text.lastIndexOf(' ', maxChars);
  if (lastSpace > maxChars * 0.8) {
    return lastSpace + 1;
  }
  
  // Last resort: hard break
  return maxChars;
}