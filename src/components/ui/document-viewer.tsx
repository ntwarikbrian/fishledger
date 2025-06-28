import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  X,
  Calendar,
  User,
  HardDrive,
  Maximize2,
  Share,
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
    // In a real application, this would trigger a download
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(document.url, '_blank');
  };

  const renderContent = () => {
    if (document.type === 'image') {
      return (
        <div className="relative group">
          <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-2 sm:p-4">
            <img
              src={document.url}
              alt={document.name}
              className="w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg shadow-sm"
              onError={(e) => {
                // Fallback for broken images
                e.currentTarget.src = '/placeholder-image.svg';
              }}
            />
          </div>
          {/* Image overlay actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/20 hover:bg-black/40 text-white border-0 backdrop-blur-sm"
              onClick={handleOpenExternal}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    if (document.type === 'document') {
      // For PDFs and other documents
      if (document.name.toLowerCase().endsWith('.pdf')) {
        return (
          <div className="space-y-4">
            {/* PDF Preview Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-sm mb-2">PDF Document</h3>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
                {document.name}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button size="sm" onClick={handleOpenExternal} className="bg-red-600 hover:bg-red-700">
                  <Eye className="h-3 w-3 mr-2" />
                  View PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // For other document types
      return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-sm mb-2">Document</h3>
          <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
            {document.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button size="sm" onClick={handleOpenExternal} className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-3 w-3 mr-2" />
              Open File
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-3 w-3 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Unable to preview this file type</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-2xl w-[95vw] sm:w-full max-h-[85vh] overflow-hidden p-0 gap-0 bg-gradient-to-br from-background to-muted/30",
        className
      )}>
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                document.type === 'image'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {document.type === 'image' ? (
                  <ImageIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    document.type === 'image' ? 'text-purple-600' : 'text-blue-600'
                  }`} />
                ) : (
                  <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    document.type === 'image' ? 'text-purple-600' : 'text-blue-600'
                  }`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-lg font-semibold truncate pr-2">
                  {document.name}
                </DialogTitle>
                {document.description && (
                  <DialogDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                    {document.description}
                  </DialogDescription>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File Info Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {document.type && (
              <Badge variant="secondary" className="text-xs">
                {document.type === 'image' ? (
                  <>
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Image
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3 mr-1" />
                    Document
                  </>
                )}
              </Badge>
            )}
            {document.size && (
              <Badge variant="outline" className="text-xs">
                <HardDrive className="h-3 w-3 mr-1" />
                {document.size}
              </Badge>
            )}
            {document.uploadDate && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {document.uploadDate}
              </Badge>
            )}
            {document.uploadedBy && (
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {document.uploadedBy}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-4 sm:p-6 pt-4 overflow-y-auto flex-1">
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 pt-0 border-t bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Download className="h-3 w-3 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenExternal}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Open External
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Share functionality placeholder
                if (navigator.share) {
                  navigator.share({
                    title: document.name,
                    url: document.url
                  });
                }
              }}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <Share className="h-3 w-3 mr-2" />
              Share
            </Button>
          </div>
        </div>
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
