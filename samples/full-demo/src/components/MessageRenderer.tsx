import React from 'react'

interface MessageRendererProps {
  content: string
  isStreaming?: boolean
}

function MessageRenderer({ content, isStreaming = false }: MessageRendererProps) {
  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    // Convert basic markdown patterns to HTML
    let formatted = text
    
    // Bold text **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic text *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Inline code `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>')
    
    return formatted
  }

  const formattedContent = formatContent(content)

  return (
    <div className="prose prose-sm max-w-none">
      <div 
        dangerouslySetInnerHTML={{ __html: formattedContent }}
        className={isStreaming ? 'streaming-content' : ''}
      />
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1">|</span>
      )}
    </div>
  )
}

export default MessageRenderer