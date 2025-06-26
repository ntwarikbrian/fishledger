import React from "react";
import { Button } from "@/components/ui/button";
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
  X
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
        <div className="flex justify-center">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-[60vh] object-contain rounded-lg"
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.src = '/placeholder-image.svg';
            }}
          />
        </div>
      );
    }

    if (document.type === 'document') {
      // For PDFs and other documents, show an embedded viewer or placeholder
      if (document.name.toLowerCase().endsWith('.pdf')) {
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-8 text-center bg-muted/50">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF Document</h3>
              <p className="text-muted-foreground mb-4">
                {document.name}
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            {/* Optional: Embed PDF viewer */}
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={`${document.url}#toolbar=0`}
                className="w-full h-96"
                title={document.name}
                onError={() => {
                  console.log('PDF embed failed, showing fallback');
                }}
              />
            </div>
          </div>
        );
      }

      // For other document types
      return (
        <div className="border rounded-lg p-8 text-center bg-muted/50">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document</h3>
          <p className="text-muted-foreground mb-4">
            {document.name}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={handleOpenExternal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to preview this file type</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {document.type === 'image' ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <DialogTitle className="truncate">{document.name}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {(document.size || document.uploadDate || document.uploadedBy) && (
            <DialogDescription className="flex items-center gap-4 text-sm">
              {document.size && <span>{document.size}</span>}
              {document.uploadDate && (
                <>
                  <span>•</span>
                  <span>Uploaded {document.uploadDate}</span>
                </>
              )}
              {document.uploadedBy && (
                <>
                  <span>•</span>
                  <span>by {document.uploadedBy}</span>
                </>
              )}
            </DialogDescription>
          )}
          {document.description && (
            <DialogDescription>{document.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
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
