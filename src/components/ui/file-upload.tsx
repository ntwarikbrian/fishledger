import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  category?: string;
  description?: string;
  tags?: string[];
  relatedTo?: string;
  relatedId?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  className
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Check if file type is accepted
  const isFileTypeAccepted = (file: File): boolean => {
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!isFileTypeAccepted(file)) {
      return `File type not accepted. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      const id = generateId();
      
      const uploadedFile: UploadedFile = {
        file,
        id,
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
        category: '',
        description: '',
        tags: [],
        relatedTo: '',
        relatedId: ''
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxSize, acceptedTypes]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  }, [handleFiles]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Update file metadata
  const updateFileMetadata = (id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  // Simulate file upload
  const uploadFile = async (uploadedFile: UploadedFile) => {
    updateFileMetadata(uploadedFile.id, { status: 'uploading', progress: 0 });

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      updateFileMetadata(uploadedFile.id, { progress });
    }

    // Simulate success/error
    const success = Math.random() > 0.1; // 90% success rate
    updateFileMetadata(uploadedFile.id, {
      status: success ? 'success' : 'error',
      error: success ? undefined : 'Upload failed. Please try again.'
    });

    if (success) {
      toast.success(`${uploadedFile.file.name} uploaded successfully`);
    } else {
      toast.error(`Failed to upload ${uploadedFile.file.name}`);
    }
  };

  // Upload all files
  const uploadAllFiles = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    pendingFiles.forEach(uploadFile);
    
    if (onUpload) {
      onUpload(pendingFiles.map(f => f.file));
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-600" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-blue-600" />;
  };

  // Get status icon
  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: Images, PDF, DOC, DOCX, TXT (Max {maxSize}MB each)
        </p>
        
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload">
          <Button type="button" className="cursor-pointer">
            Select Files
          </Button>
        </Label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Selected Files ({files.length})</h4>
            <Button 
              onClick={uploadAllFiles}
              disabled={files.every(f => f.status !== 'pending')}
              className="bg-green-600 hover:bg-green-700"
            >
              Upload All Files
            </Button>
          </div>

          <div className="space-y-3">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {uploadedFile.preview ? (
                        <img 
                          src={uploadedFile.preview} 
                          alt={uploadedFile.file.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(uploadedFile.file)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{uploadedFile.file.name}</h5>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(uploadedFile.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(uploadedFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {uploadedFile.status === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      {uploadedFile.error && (
                        <p className="text-sm text-red-600">{uploadedFile.error}</p>
                      )}

                      {/* Metadata Form */}
                      {uploadedFile.status === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                          <div>
                            <Label htmlFor={`category-${uploadedFile.id}`} className="text-sm">Category</Label>
                            <Select onValueChange={(value) => updateFileMetadata(uploadedFile.id, { category: value })}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="certificates">Certificates</SelectItem>
                                <SelectItem value="photos">Delivery Photos</SelectItem>
                                <SelectItem value="invoices">Invoices</SelectItem>
                                <SelectItem value="receipts">Receipts</SelectItem>
                                <SelectItem value="training">Training</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`description-${uploadedFile.id}`} className="text-sm">Description</Label>
                            <Input
                              id={`description-${uploadedFile.id}`}
                              placeholder="Brief description"
                              className="h-8"
                              onChange={(e) => updateFileMetadata(uploadedFile.id, { description: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
