import React from 'react';
import { ImagePart, FileBytes, FileUrl } from '@distri/core';

export interface ImageRendererProps {
  imageParts: ImagePart[];
  className?: string;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  imageParts,
  className = ''
}) => {
  if (!imageParts || imageParts.length === 0) {
    return null;
  }

  const getImageSrc = (imageData: FileBytes | FileUrl): string => {
    if ('data' in imageData) {
      // FileBytes - base64 data
      return `data:${imageData.mime_type};base64,${imageData.data}`;
    } else {
      // FileUrl - direct URL
      return imageData.url;
    }
  };

  const getImageAlt = (imageData: FileBytes | FileUrl): string => {
    return imageData.name || 'Attached image';
  };

  return (
    <div className={`flex flex-wrap gap-3 mt-3 ${className}`}>
      {imageParts.map((imagePart, index) => {
        const src = getImageSrc(imagePart.data);
        const alt = getImageAlt(imagePart.data);
        
        return (
          <div key={index} className="relative group">
            <img
              src={src}
              alt={alt}
              className="max-w-sm max-h-64 rounded-lg border border-border object-cover shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // Open image in new tab for full view
                window.open(src, '_blank');
              }}
            />
            {imagePart.data.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {imagePart.data.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};