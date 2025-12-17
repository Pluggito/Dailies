"use client";

import { XIcon, ImageIcon, UploadCloudIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useCallback, useRef, useState } from "react";

interface ImageUploadsProps {
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
}

function ImageUploads({ onFileSelect, previewUrl }: ImageUploadsProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (previewUrl) {
    return (
      <div className="relative w-full max-w-xs">
        <img
          src={previewUrl}
          alt="Preview"
          className="rounded-lg w-full h-48 object-cover border border-border"
        />
        <Button
          type="button"
          onClick={handleRemove}
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-lg border-2 border-dashed p-8
        flex flex-col items-center justify-center gap-3
        transition-all duration-200 ease-in-out
        ${
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <UploadCloudIcon
        className={`h-10 w-10 ${
          isDragOver ? "text-primary" : "text-muted-foreground"
        }`}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop an image here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 4MB</p>
      </div>
    </div>
  );
}

export default ImageUploads;
