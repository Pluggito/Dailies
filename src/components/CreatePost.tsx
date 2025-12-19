"use client";

import { useUser } from "./AuthProvider";
import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "@/actions/post.action";
import { toast } from "sonner";
import ImageUploads from "./ImageUploads";
import { useUploadThing } from "@/lib/uploadthing";

const CreatePost = () => {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const { startUpload, isUploading } = useUploadThing("postImage", {
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setIsPosting(false);
    },
  });

  // Create preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (!file) {
      setShowImageUpload(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;

    setIsPosting(true);
    try {
      let imageUrl = "";

      // Upload image if selected
      if (selectedFile) {
        const uploadResult = await startUpload([selectedFile]);
        if (uploadResult && uploadResult.length > 0) {
          imageUrl = uploadResult[0].url;
        } else {
          throw new Error("Upload failed");
        }
      }

      // Create the post with the uploaded image URL
      const res = await createPost(content, imageUrl);
      if (res?.success) {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowImageUpload(false);
        toast.success("Post created successfully");
      }
    } catch (error) {
      //console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const isSubmitting = isPosting || isUploading;

  return (
    <Card className="mb-6 bg-transparent">
      <CardContent>
        <div className="space">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={user?.image || "/avatar.png"}
                alt={`${user?.name || user?.username}'s avatar`}
              />
            </Avatar>
            <Textarea
              placeholder="what's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base mt-2"
              id="content"
              name="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {(showImageUpload || selectedFile) && (
            <div className="p-4">
              <ImageUploads
                onFileSelect={handleFileSelect}
                previewUrl={previewUrl}
              />
            </div>
          )}

          <div className="flex iems-center justify-between border-t pt-4">
            <div className="flx space-x-2">
              <Button
                type="button"
                variant={"ghost"}
                size={"sm"}
                className="text-muted-foreground hover:text-primary"
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isSubmitting}
              >
                <ImageIcon className="size-4 mr-2" />
                Photo
              </Button>
            </div>
            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={(!content.trim() && !selectedFile) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Posting..."}
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
