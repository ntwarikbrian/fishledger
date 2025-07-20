import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image, ExternalLink } from "lucide-react";

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
}

/**
 * Image preview modal component
 * Displays images in a full-size modal with external link option
 */
export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  onOpenChange,
  imageUrl,
}) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Deposit Image
          </DialogTitle>
          <DialogDescription>
            Click outside or press ESC to close
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="relative">
            <img
              src={imageUrl}
              alt="Deposit proof"
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
              style={{ maxHeight: '70vh' }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => window.open(imageUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
