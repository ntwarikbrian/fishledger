/**
 * PDF Viewer Component
 * 
 * A popup container for viewing PDF reports that works with Chrome's restrictions.
 * Uses blob URLs and user-initiated events to avoid popup blockers.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title?: string;
  className?: string;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title = 'PDF Report',
  className,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Create blob URL when PDF URL changes
  useEffect(() => {
    if (!pdfUrl || !isOpen) {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Fetch PDF and create blob URL
    const fetchPDF = async () => {
      try {
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        
        // Verify it's a PDF
        if (blob.type !== 'application/pdf') {
          throw new Error('Invalid file type. Expected PDF.');
        }

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL when component unmounts or URL changes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfUrl, isOpen]);

  // Cleanup blob URL when dialog closes
  useEffect(() => {
    if (!isOpen && blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  }, [isOpen, blobUrl]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (blobUrl) {
      // Fallback download using blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenExternal = () => {
    if (blobUrl) {
      // Use user-initiated event to open in new tab
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        // Fallback if popup is blocked
        setError('Popup blocked. Please allow popups for this site or use the download button.');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0",
        className
      )}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold truncate flex-1">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2 ml-4">
            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !!error}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            
            {/* Open External Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              disabled={isLoading || !!error || !blobUrl}
              className="h-8"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center max-w-md">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <h3 className="font-medium mb-2">Failed to Load PDF</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && blobUrl && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={title}
              style={{ minHeight: '500px' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
