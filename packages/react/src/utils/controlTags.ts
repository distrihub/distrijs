// Control tags that should be removed from content
const CONTROL_TAGS = [
  'agent_response',
  'internal_thought',
  'system_message',
  'control_flow',
  'reasoning',
  'metadata',
  'instructions',
  'context',
  'planning',
] as const;

/**
 * Remove XML control blocks and their surrounding ```xml``` code blocks
 * @param text - The text content to clean
 * @returns Cleaned text with control blocks removed
 */
export function removeControlTags(text: string): string {
  if (!text.trim()) return text;

  let cleanedText = text;

  // Remove ```xml blocks that contain control tags
  const xmlBlockRegex = /```xml\s*\n?([\s\S]*?)\n?```/gi;
  cleanedText = cleanedText.replace(xmlBlockRegex, (match, xmlContent) => {
    // Check if the XML content contains any control tags
    const hasControlTags = CONTROL_TAGS.some(tag => {
      const tagRegex = new RegExp(`<${tag}[^>]*>`, 'i');
      return tagRegex.test(xmlContent);
    });
    
    // If it contains control tags, remove the entire block
    if (hasControlTags) {
      return '';
    }
    
    // Otherwise, keep the block
    return match;
  });

  // Also remove standalone control tag blocks (not in ```xml```)
  CONTROL_TAGS.forEach(tag => {
    // Remove complete tag blocks with content
    const tagRegex = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, 'gi');
    cleanedText = cleanedText.replace(tagRegex, '');
    
    // Remove self-closing tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\/>`, 'gi');
    cleanedText = cleanedText.replace(selfClosingRegex, '');
  });

  // Clean up extra whitespace and empty lines
  cleanedText = cleanedText
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple empty lines with double newline
    .trim();

  return cleanedText;
}

/**
 * Add a new control tag to the list of tags to be removed
 * @param tag - The tag name to add (without < >)
 */
export function addControlTag(tag: string): void {
  // This would require making CONTROL_TAGS mutable, but for now
  // we keep it as a const array for performance
  console.warn(`Control tag "${tag}" should be added to CONTROL_TAGS array in controlTags.ts`);
}

/**
 * Get the list of currently configured control tags
 * @returns Array of control tag names
 */
export function getControlTags(): readonly string[] {
  return CONTROL_TAGS;
}