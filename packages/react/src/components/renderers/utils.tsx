import React from 'react';
import { DistriMessage, DistriEvent, DistriArtifact, ImagePart } from '@distri/core';
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
  imageParts: ImagePart[];
  rawContent: DistriMessage | DistriEvent | DistriArtifact;
}

export function extractContent(message: DistriMessage | DistriEvent | DistriArtifact): ExtractedContent {
  let text = '';
  let hasMarkdown = false;
  let hasCode = false;
  let hasLinks = false;
  let hasImages = false;
  let imageParts: ImagePart[] = [];

  if ('parts' in message && Array.isArray(message.parts)) {
    // Handle DistriMessage
    const distriMessage = message as DistriMessage;

    // Extract all text parts and join them properly
    const textParts = distriMessage.parts
      ?.filter(p => p.type === 'text' && (p as { type: 'text'; data: string }).data)
      ?.map(p => (p as { type: 'text'; data: string }).data)
      ?.filter(text => text && text.trim()) || [];

    text = textParts.join(' ').trim();

    // Extract image parts
    imageParts = distriMessage.parts
      ?.filter(p => p.type === 'image') as ImagePart[] || [];

    // Check for rich content in text
    hasMarkdown = /[*_`#\[\]()>]/.test(text);
    hasCode = /```|`/.test(text);
    hasLinks = /\[.*?\]\(.*?\)|https?:\/\/[^\s]+/.test(text);
    hasImages = /!\[.*?\]\(.*?\)/.test(text) || imageParts.length > 0;
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
    imageParts,
    rawContent: message
  };
}

export function renderTextContent(content: ExtractedContent): React.ReactNode {
  const { text } = content;

  if (!text || !text.trim()) return null;

  return <TextRenderer content={content} />;
}
