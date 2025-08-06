import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact } from '@distri/core';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore  
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface ExtractedContent {
  text: string;
  hasMarkdown: boolean;
  hasCode: boolean;
  hasLinks: boolean;
  hasImages: boolean;
  rawContent: any;
}

export function extractContent(message: DistriMessage | DistriEvent | DistriArtifact): ExtractedContent {
  let text = '';
  let hasMarkdown = false;
  let hasCode = false;
  let hasLinks = false;
  let hasImages = false;

  if ('parts' in message && Array.isArray(message.parts)) {
    // Handle DistriMessage
    const distriMessage = message as DistriMessage;

    // Extract all text parts and join them properly
    const textParts = distriMessage.parts
      ?.filter(p => p.type === 'text' && (p as any).text)
      ?.map(p => (p as any).text)
      ?.filter(text => text && text.trim()) || [];

    text = textParts.join(' ').trim();

    // Check for rich content in text
    hasMarkdown = /[*_`#\[\]()>]/.test(text);
    hasCode = /```|`/.test(text);
    hasLinks = /\[.*?\]\(.*?\)|https?:\/\/[^\s]+/.test(text);
    hasImages = /!\[.*?\]\(.*?\)/.test(text);
  } else if ('type' in message) {
    // Handle DistriArtifact
    const artifact = message as DistriArtifact;
    if (artifact.type === 'plan') {
      text = JSON.stringify(artifact, null, 2);
    } else {
      text = JSON.stringify(artifact, null, 2);
    }
  } else {
    // Handle DistriEvent or other types
    text = JSON.stringify(message, null, 2);
  }

  return {
    text,
    hasMarkdown,
    hasCode,
    hasLinks,
    hasImages,
    rawContent: message
  };
}

export function renderTextContent(content: ExtractedContent): React.ReactNode {
  const { text } = content;

  if (!text || !text.trim()) return null;

  return parseAndRenderContent(text);
}

function parseAndRenderContent(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  let elementKey = 0;

  // Find ALL code blocks (including xml ones that might contain thought tags)
  const codeBlockPattern = /```([\w]*)?[ \t]*\n?([\s\S]*?)```/g;
  const codeMatches: Array<{
    start: number;
    end: number;
    content: string;
    language: string;
    shouldRender: boolean;
  }> = [];

  let codeMatch;
  while ((codeMatch = codeBlockPattern.exec(text)) !== null) {
    const language = codeMatch[1] || 'typescript';
    const content = codeMatch[2].trim();
    
    // If this is an XML code block that only contains thought tags, skip it entirely
    const isXmlWithOnlyThoughts = language === 'xml' && 
      /<thought>[\s\S]*?<\/thought>/.test(content) && 
      content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim() === '';
    
    codeMatches.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
      content: content,
      language: language,
      shouldRender: !isXmlWithOnlyThoughts && (language === 'typescript' || language === 'ts' || language === 'javascript' || language === 'js')
    });
  }

  // Process the text
  for (const match of codeMatches) {
    // Add text before the code block, cleaning out thought tags
    if (currentIndex < match.start) {
      let textBefore = text.slice(currentIndex, match.start);
      // Remove thought tags from this text segment
      textBefore = textBefore.replace(/<thought>[\s\S]*?<\/thought>/g, '');
      textBefore = textBefore.trim();
      if (textBefore) {
        elements.push(renderPlainText(textBefore, elementKey++));
      }
    }

    // Add the code block only if it should be rendered
    if (match.shouldRender) {
      elements.push(renderCodeBlock(match.content, match.language, elementKey++));
    }
    
    currentIndex = match.end;
  }

  // Add remaining text after all code blocks, cleaning out thought tags
  if (currentIndex < text.length) {
    let remainingText = text.slice(currentIndex);
    // Remove thought tags from remaining text
    remainingText = remainingText.replace(/<thought>[\s\S]*?<\/thought>/g, '');
    remainingText = remainingText.trim();
    if (remainingText) {
      elements.push(renderPlainText(remainingText, elementKey++));
    }
  }

  // If no elements were created, just clean the entire text and render
  if (elements.length === 0) {
    let cleanText = text.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
    // Also remove xml code blocks that only contained thought tags
    cleanText = cleanText.replace(/```xml[\s\S]*?```/g, '').trim();
    if (cleanText) {
      return renderPlainText(cleanText, 0);
    }
    return null;
  }

  return React.createElement('div', { className: 'space-y-3' }, ...elements);
}


function renderCodeBlock(content: string, language: string, key: number): React.ReactNode {
  return React.createElement('div', {
    key,
    className: 'rounded-md overflow-hidden my-3'
  }, 
    React.createElement(SyntaxHighlighter, {
      language: language === 'ts' ? 'typescript' : language,
      style: oneDark,
      className: 'text-sm',
      showLineNumbers: false,
      wrapLines: true,
      customStyle: {
        margin: 0,
        padding: '1rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem'
      }
    }, content)
  );
}

function renderPlainText(text: string, key: number): React.ReactNode {
  // Split text into paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim());

  if (paragraphs.length === 1) {
    return React.createElement('p', {
      key,
      className: 'text-sm leading-relaxed'
    }, text.trim());
  } else {
    return React.createElement('div', {
      key,
      className: 'space-y-2'
    }, paragraphs.map((paragraph, index) =>
      React.createElement('p', {
        key: `${key}-${index}`,
        className: 'text-sm leading-relaxed'
      }, paragraph.trim())
    ));
  }
} 