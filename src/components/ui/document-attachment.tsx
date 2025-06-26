import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Paperclip, 
  FileText, 
  Image, 
  Download, 
  Eye, 
  Trash2,
  Plus,
  File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "./file-upload";

interface AttachedDocument {
  id: string;
  name: string;
  type: 'image' | 'document';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  category: string;
  url: string;
  thumbnail?: string;
}

interface DocumentAttachmentProps {
  entityType: string; // e.g., "Order", "Customer", "Staff", "Expense"
  entityId: string;
  documents?: AttachedDocument[];
  onAttach?: (files: File[]) => void;
  onRemove?: (documentId: string) => void;
  className?: string;
  showUpload?: boolean;
}

export const DocumentAttachment: React.FC<DocumentAttachmentProps> = ({
  entityType,
  entityId,
  documents = [],
  onAttach,
  onRemove,
  className,
  showUpload = true
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mock documents if none provided
  const mockDocuments: AttachedDocument[] = documents.length > 0 ? documents : [
    {
      id: "1",
      name: `${entityType}_${entityId}_certificate.pdf`,
      type: "document",
      size: "2.1 MB",
      uploadDate: "2024-01-22",
      uploadedBy: "John Smith",
      category: "Certificates",
      url: "/documents/cert.pdf"
    },
    {
      id: "2",
      name: `${entityType}_${entityId}_photo.jpg`,
      type: "image",
      size: "3.5 MB",
      uploadDate: "2024-01-21",
      uploadedBy: "Maria Rodriguez",
      category: "Photos",
      url: "/images/photo.jpg",
      thumbnail: "/thumbnails/photo-thumb.jpg"
    }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-green-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleUpload = (files: File[]) => {
    if (onAttach) {
      onAttach(files);
    }
    setIsUploadOpen(false);
  };

  const handleRemove = (documentId: string) => {
    if (onRemove) {
      onRemove(documentId);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attached Documents
            {mockDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {mockDocuments.length}
              </Badge>
            )}
          </CardTitle>
          {showUpload && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Attach
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Attach Documents</DialogTitle>
                  <DialogDescription>
                    Upload documents and images related to this {entityType.toLowerCase()}
                  </DialogDescription>
                </DialogHeader>
                <FileUpload onUpload={handleUpload} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {mockDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents attached</p>
            {showUpload && (
              <p className="text-sm">Click "Attach" to add documents</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mockDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* File Icon/Thumbnail */}
                <div className="flex-shrink-0">
                  {document.thumbnail ? (
                    <img
                      src={document.thumbnail}
                      alt={document.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(document.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{document.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {document.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{document.size}</span>
                    <span>•</span>
                    <span>{document.uploadDate}</span>
                    <span>•</span>
                    <span>by {document.uploadedBy}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  {onRemove && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Remove"
                      onClick={() => handleRemove(document.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact version for use in tables or smaller spaces
export const DocumentAttachmentCompact: React.FC<DocumentAttachmentProps> = ({
  entityType,
  entityId,
  documents = [],
  onAttach,
  className
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const documentCount = documents.length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("", className)}
        >
          <Paperclip className="h-4 w-4 mr-1" />
          {documentCount > 0 ? `${documentCount} files` : 'Attach'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documents - {entityType} {entityId}</DialogTitle>
          <DialogDescription>
            View and manage documents attached to this {entityType.toLowerCase()}
          </DialogDescription>
        </DialogHeader>
        <DocumentAttachment
          entityType={entityType}
          entityId={entityId}
          documents={documents}
          onAttach={onAttach}
          showUpload={true}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
};
