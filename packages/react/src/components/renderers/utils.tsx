import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact } from '@distri/core';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore  
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TextRenderer from './TextRenderer';

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
      ?.filter(p => p.type === 'text' && (p as any).data)
      ?.map(p => (p as any).data)
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

  return <TextRenderer content={content} />;
}
