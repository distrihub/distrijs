import { DistriMessage, DistriEvent, ImagePart } from '@distri/core';

export interface ExtractedContent {
  text: string;
  hasMarkdown: boolean;
  hasCode: boolean;
  hasLinks: boolean;
  hasImages: boolean;
  imageParts: ImagePart[];
  rawContent: DistriMessage | DistriEvent;
}

export function extractContent(message: DistriMessage | DistriEvent): ExtractedContent {
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
      ?.filter(p => p.part_type === 'text' && (p as { part_type: 'text'; data: string }).data)
      ?.map(p => (p as { part_type: 'text'; data: string }).data)
      ?.filter(text => text && text.trim()) || [];

    text = textParts.join(' ').trim();

    // Extract image parts
    imageParts = distriMessage.parts
      ?.filter(p => p.part_type === 'image') as ImagePart[] || [];

    // Check for rich content in text
    hasMarkdown = /[*_`#[\]()>]/.test(text);
    hasCode = /```|`/.test(text);
    hasLinks = /\[.*?\]\(.*?\)|https?:\/\/[^\s]+/.test(text);
    hasImages = /!\[.*?\]\(.*?\)/.test(text) || imageParts.length > 0;
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

