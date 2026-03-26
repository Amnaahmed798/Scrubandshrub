'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File, url: string) => void;
  onImageRemove: () => void;
  currentImageUrl?: string;
  label?: string;
  accept?: string;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  currentImageUrl,
  label = "Upload Image",
  accept = "image/*"
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setPreviewUrl(imageUrl);
        setFileName(file.name);
        onImageUpload(file, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-1">{label}</label>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Preview area */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-md border border-gray-300"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 p-1 h-6 w-6 rounded-full"
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Upload button and file input */}
        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-fit"
          >
            {previewUrl ? 'Change Image' : 'Choose Image'}
          </Button>

          {fileName && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{fileName}</p>
          )}

          <p className="text-xs text-gray-500">
            Accepted formats: {accept.replace('image/', '').split(',').map(ext => ext.toUpperCase()).join(', ') || 'JPG, PNG, GIF'}
          </p>
        </div>
      </div>
    </div>
  );
}