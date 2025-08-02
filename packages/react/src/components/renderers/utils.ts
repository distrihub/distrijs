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
    text = distriMessage.parts
      ?.filter(p => p.type === 'text')
      ?.map(p => p.text)
      ?.join('') || '';

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

  if (!text) return null;

  // For now, return plain text - in the future this could be enhanced with markdown rendering
  if (hasMarkdown || hasCode || hasLinks || hasImages) {
    // TODO: Add markdown rendering library like react-markdown
    return React.createElement('pre', { className: 'whitespace-pre-wrap text-sm' }, text);
  }

  return React.createElement('p', { className: 'text-sm leading-relaxed' }, text);
} 