'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Camera } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: 'portrait' | 'landscape';
  promptText?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = 'Passport Photograph',
  aspect = 'portrait',
  promptText,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size exceeds 2MB limit.');
      return;
    }

    // Show instant preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to S3 via API
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isLandscape = aspect === 'landscape';

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {error && (
        <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview ? (
        <div
          className={`relative rounded-lg overflow-hidden border border-slate-300 bg-white group ${isLandscape ? 'w-56 h-28' : 'w-32 h-40'
            }`}
        >
          <img
            src={preview}
            alt={label}
            className={`w-full h-full ${isLandscape ? 'object-contain p-2' : 'object-cover'}`}
          />
          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white text-slate-800 rounded-md hover:bg-slate-100 shadow-sm"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-1.5 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-xs text-univ-800 font-medium">
              <div className="w-4 h-4 border-2 border-univ-800 border-t-transparent rounded-full animate-spin mb-1"></div>
              Uploading...
            </div>
          )}
          {!uploading && (
            <span className="absolute bottom-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
            </span>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-4 text-center cursor-pointer transition bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 group ${isLandscape ? 'max-w-xs h-28' : 'w-32 h-40'
            }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-200/80 group-hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">
              {promptText || (isLandscape ? 'Click to upload signature' : 'Click to upload image')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">PNG or JPEG &bull; max 2MB</p>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
}
