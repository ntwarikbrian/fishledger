import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  X,
  Maximize2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    type: 'image' | 'document';
    url: string;
    size?: string;
    uploadDate?: string;
    uploadedBy?: string;
    description?: string;
  };
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  document,
  className
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(document.url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md w-[90vw] max-h-[80vh] overflow-hidden p-0 gap-0",
        className
      )}>
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
              document.type === 'image'
                ? 'bg-purple-100 dark:bg-purple-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {document.type === 'image' ? (
                <ImageIcon className="h-3 w-3 text-purple-600" />
              ) : (
                <FileText className="h-3 w-3 text-blue-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium truncate">
                {document.name}
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-full hover:bg-muted/80 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="p-3">
          {document.type === 'image' ? (
            <div className="relative bg-muted/20 rounded-lg overflow-hidden">
              <img
                src={document.url}
                alt={document.name}
                className="w-full h-64 object-contain bg-white/50"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.svg';
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 w-7 p-0 bg-black/20 hover:bg-black/40 text-white border-0 backdrop-blur-sm"
                onClick={handleOpenExternal}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          ) : document.name.toLowerCase().endsWith('.pdf') ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-medium text-sm mb-3">PDF Document</h3>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={handleOpenExternal} className="bg-red-600 hover:bg-red-700 h-8 text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} className="h-8 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-sm mb-3">Document</h3>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={handleOpenExternal} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} className="h-8 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with metadata */}
        {(document.size || document.uploadDate) && (
          <div className="px-3 pb-3 pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
              {document.size && (
                <span>Size: {document.size}</span>
              )}
              {document.uploadDate && (
                <span>Uploaded: {document.uploadDate}</span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing document viewer state
export const useDocumentViewer = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentDocument, setCurrentDocument] = React.useState<DocumentViewerProps['document'] | null>(null);

  const openDocument = (document: DocumentViewerProps['document']) => {
    setCurrentDocument(document);
    setIsOpen(true);
  };

  const closeDocument = () => {
    setIsOpen(false);
    setCurrentDocument(null);
  };

  return {
    isOpen,
    currentDocument,
    openDocument,
    closeDocument
  };
};
