/**
 * Extract thought content from agent_response blocks
 */
export function extractThoughtContent(text: string): string | null {
  if (!text) return null;
  
  // Find agent_response blocks
  const agentResponseRegex = /<agent_response[^>]*>([\s\S]*?)<\/agent_response>/gi;
  const agentResponseMatch = agentResponseRegex.exec(text);
  
  if (!agentResponseMatch) return null;
  
  const agentResponseContent = agentResponseMatch[1];
  
  // Extract thought content from within the agent_response
  const thoughtRegex = /<thought[^>]*>([\s\S]*?)<\/thought>/gi;
  const thoughtMatch = thoughtRegex.exec(agentResponseContent);
  
  if (!thoughtMatch) return null;
  
  // Clean up the thought content
  return thoughtMatch[1].trim();
}

export default extractThoughtContent;