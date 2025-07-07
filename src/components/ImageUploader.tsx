import React, { useRef } from 'react';
import { Image } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
}

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 hover:shadow-md hover:scale-105 transition-all duration-200"
        title="Upload image"
      >
        <Image className="w-4 h-4" />
        Image
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}