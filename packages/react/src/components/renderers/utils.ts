import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact } from '@distri/core';

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
  const { text, hasMarkdown, hasCode, hasLinks, hasImages } = content;

  if (!text || !text.trim()) return null;

  // For now, return plain text - in the future this could be enhanced with markdown rendering
  if (hasMarkdown || hasCode || hasLinks || hasImages) {
    // TODO: Add markdown rendering library like react-markdown
    return React.createElement('pre', { className: 'whitespace-pre-wrap text-sm' }, text);
  }

  // Split text into paragraphs and render each as a separate paragraph
  const paragraphs = text.split('\n').filter(p => p.trim());

  if (paragraphs.length === 1) {
    return React.createElement('p', { className: 'text-sm leading-relaxed' }, text);
  } else {
    return React.createElement('div', { className: 'space-y-2' },
      paragraphs.map((paragraph, index) =>
        React.createElement('p', {
          key: index,
          className: 'text-sm leading-relaxed'
        }, paragraph)
      )
    );
  }
} 