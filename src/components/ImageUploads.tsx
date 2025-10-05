"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
//import Image from "next/image";
import { Button } from "./ui/button";

interface ImageUploadsProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

function ImageUploads({ endpoint, onChange, value }: ImageUploadsProps) {
  if (value) {
    return (
      <div className="relative size-50">
        <img src={value} alt="Upload" className="rounded-md size-50 object-cover" />
        <Button 
          onClick={() => onChange("")}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
        >
        <XIcon className="h-4 w-4 text-white" />
        </Button>
      </div>
    );
  }
  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].url);
      }}
      onUploadError={(error: Error) => {
        console.log(error);
      }}
    />
  );
}
export default ImageUploads;