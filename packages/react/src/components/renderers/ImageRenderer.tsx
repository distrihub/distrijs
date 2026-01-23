import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImagePart, FileBytes, FileUrl } from '@distri/core';
import { X } from 'lucide-react';

export interface ImageRendererProps {
  imageParts: ImagePart[];
  className?: string;
}

interface ImageDialogProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageDialog: React.FC<ImageDialogProps> = ({ src, alt, onClose }) => {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Image container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        {alt && alt !== 'Attached image' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-3 rounded-b-lg text-center">
            {alt}
          </div>
        )}
      </div>
    </div>
  );
};

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  imageParts,
  className = ''
}) => {
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);

  const handleClose = useCallback(() => {
    setViewingImage(null);
  }, []);

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
    <>
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
                onClick={() => setViewingImage({ src, alt })}
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

      {/* Image viewing dialog - rendered via portal to escape parent overflow constraints */}
      {viewingImage && createPortal(
        <ImageDialog
          src={viewingImage.src}
          alt={viewingImage.alt}
          onClose={handleClose}
        />,
        document.body
      )}
    </>
  );
};