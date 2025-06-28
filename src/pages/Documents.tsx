import React, { useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Image as ImageIcon,
  File,
  FolderOpen,
  Calendar,
  User,
  HardDrive,
  Cloud,
  Plus,
  Grid3X3,
  List,
  MoreVertical,
  Edit,
  Share,
  Archive,
  BarChart,
  Award,
  Receipt,
  Folder,
  Settings,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileUpload } from "@/components/ui/file-upload";
import { DocumentViewer, useDocumentViewer } from "@/components/ui/document-viewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Circular Progress Component for Statistics
interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  subtitle: string;
  animated?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#3b82f6",
  label,
  subtitle,
  animated = true
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-base sm:text-lg font-bold text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};

// Types for document management
interface DocumentFile {
  id: string;
  name: string;
  type: 'image' | 'document';
  size: string;
  uploadDate: string;
  uploadedBy: string;
  category: string; // Keep for backward compatibility
  folderId: string; // New folder reference
  folderName: string; // For display purposes
  folderColor: string; // For visual consistency
  url: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
}

interface UploadStats {
  totalFiles: number;
  totalSize: string;
  recentUploads: number;
  storageUsed: number; // percentage
}

interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  createdDate: string;
  createdBy: string;
}

// Add Folder Form Component
interface AddFolderFormProps {
  onSubmit: (data: { name: string; description: string; color: string; icon: string }) => void;
}

const AddFolderForm: React.FC<AddFolderFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("blue");
  const [icon, setIcon] = useState<string>("FileText");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim(), color, icon });
    // Reset form
    setName("");
    setDescription("");
    setColor("blue");
    setIcon("FileText");
  };

  const colorOptions = [
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  ];

  const iconOptions = [
    { value: "FileText", label: "Document", icon: FileText },
    { value: "Receipt", label: "Receipt", icon: Receipt },
    { value: "Image", label: "Image", icon: ImageIcon },
    { value: "BarChart", label: "Chart", icon: BarChart },
    { value: "Award", label: "Award", icon: Award },
    { value: "Folder", label: "Folder", icon: Folder },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Folder Name */}
      <div className="space-y-2">
        <Label htmlFor="folderName">Folder Name</Label>
        <Input
          id="folderName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter folder name"
          className="w-full"
          required
        />
      </div>

      {/* Folder Description */}
      <div className="space-y-2">
        <Label htmlFor="folderDescription">Description</Label>
        <Textarea
          id="folderDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter folder description"
          className="w-full"
          rows={3}
        />
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <Label>Folder Color</Label>
        <div className="flex gap-2">
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => setColor(colorOption.value)}
              className={`w-8 h-8 rounded-full ${colorOption.class} ${
                color === colorOption.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
              } transition-all`}
              title={colorOption.label}
            />
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="space-y-2">
        <Label>Folder Icon</Label>
        <div className="grid grid-cols-3 gap-2">
          {iconOptions.map((iconOption) => {
            const IconComponent = iconOption.icon;
            return (
              <button
                key={iconOption.value}
                type="button"
                onClick={() => setIcon(iconOption.value)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                  icon === iconOption.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-xs">{iconOption.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Create Folder
        </Button>
      </div>
    </form>
  );
};

const Documents: React.FC = () => {
  // State management for documents and UI
  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      id: "1",
      name: "Fish_Inventory_Report_2024.pdf",
      type: "document",
      size: "2.4 MB",
      uploadDate: "2024-01-15",
      uploadedBy: "Admin",
      category: "Reports", // Keep for backward compatibility
      folderId: "4",
      folderName: "Reports",
      folderColor: "orange",
      url: "/sample-document.pdf",
      description: "Monthly fish inventory analysis report",
      tags: ["inventory", "report", "2024"]
    },
    {
      id: "2",
      name: "Fresh_Salmon_Photo.jpg",
      type: "image",
      size: "1.8 MB",
      uploadDate: "2024-01-14",
      uploadedBy: "Worker",
      category: "Product Images", // Keep for backward compatibility
      folderId: "3",
      folderName: "Product Images",
      folderColor: "purple",
      url: "/sample-image.jpg",
      thumbnail: "/sample-thumbnail.jpg",
      description: "High-quality salmon product photo",
      tags: ["salmon", "product", "photo"]
    },
    {
      id: "3",
      name: "Supplier_Contract_2024.docx",
      type: "document",
      size: "856 KB",
      uploadDate: "2024-01-13",
      uploadedBy: "Admin",
      category: "Contracts", // Keep for backward compatibility
      folderId: "1",
      folderName: "Contracts",
      folderColor: "blue",
      url: "/sample-contract.docx",
      description: "Annual supplier agreement document",
      tags: ["contract", "supplier", "legal"]
    },
    {
      id: "4",
      name: "Customer_Invoice_INV-2024-001.pdf",
      type: "document",
      size: "1.2 MB",
      uploadDate: "2024-01-12",
      uploadedBy: "Admin",
      category: "Invoices", // Keep for backward compatibility
      folderId: "2",
      folderName: "Invoices",
      folderColor: "green",
      url: "/sample-invoice.pdf",
      description: "Customer invoice for fish delivery",
      tags: ["invoice", "customer", "billing"]
    },
    {
      id: "5",
      name: "Quality_Certificate_2024.pdf",
      type: "document",
      size: "945 KB",
      uploadDate: "2024-01-10",
      uploadedBy: "Admin",
      category: "Certificates", // Keep for backward compatibility
      folderId: "5",
      folderName: "Certificates",
      folderColor: "red",
      url: "/sample-certificate.pdf",
      description: "Quality assurance certificate",
      tags: ["certificate", "quality", "compliance"]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Folder management state
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "1",
      name: "Contracts",
      description: "Legal contracts and agreements",
      color: "blue",
      icon: "FileText",
      documentCount: 12,
      createdDate: "2024-01-10",
      createdBy: "Admin"
    },
    {
      id: "2",
      name: "Invoices",
      description: "Customer invoices and billing documents",
      color: "green",
      icon: "Receipt",
      documentCount: 28,
      createdDate: "2024-01-08",
      createdBy: "Admin"
    },
    {
      id: "3",
      name: "Product Images",
      description: "Fish product photos and marketing materials",
      color: "purple",
      icon: "Image",
      documentCount: 45,
      createdDate: "2024-01-05",
      createdBy: "Worker"
    },
    {
      id: "4",
      name: "Reports",
      description: "Business reports and analytics",
      color: "orange",
      icon: "BarChart",
      documentCount: 8,
      createdDate: "2024-01-03",
      createdBy: "Admin"
    },
    {
      id: "5",
      name: "Certificates",
      description: "Quality certificates and compliance documents",
      color: "red",
      icon: "Award",
      documentCount: 6,
      createdDate: "2024-01-01",
      createdBy: "Admin"
    }
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("folders");

  // Upload form state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Document viewer hook
  const { isOpen, currentDocument, openDocument, closeDocument } = useDocumentViewer();

  // Upload statistics
  const uploadStats: UploadStats = {
    totalFiles: documents.length,
    totalSize: "12.8 GB",
    recentUploads: 5,
    storageUsed: 68
  };

  // Get unique folders for filtering
  const availableFolders = ["all", ...Array.from(new Set(documents.map(doc => doc.folderName)))];

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFolder = selectedCategory === "all" || doc.folderName === selectedCategory;
      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      // Always sort by date (newest first)
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });

  // Handle image selection (only images)
  const handleImageSelection = useCallback((files: File[]) => {
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast.error("Please select only image files");
      return;
    }

    if (imageFiles.length !== files.length) {
      toast.warning("Only image files were selected. Other file types were ignored.");
    }

    setSelectedImages(imageFiles);
    setShowUploadForm(true);
  }, []);

  // Handle final image upload with metadata
  const handleImageUpload = useCallback(async () => {
    if (selectedImages.length === 0) {
      toast.error("No images selected");
      return;
    }

    if (!uploadFolderId) {
      toast.error("Please select a folder");
      return;
    }

    try {
      setIsUploading(true);

      const selectedFolder = folders.find(f => f.id === uploadFolderId);

      // Process each selected image
      for (const file of selectedImages) {
        // Create new document entry
        const newDocument: DocumentFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: 'image',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: "Current User", // This would come from auth context
          category: selectedFolder?.name || "Product Images", // Keep for backward compatibility
          folderId: selectedFolder?.id || "3", // Default to Product Images folder
          folderName: selectedFolder?.name || "Product Images",
          folderColor: selectedFolder?.color || "purple",
          url: URL.createObjectURL(file), // In real app, this would be the server URL
          thumbnail: URL.createObjectURL(file), // For images, use the same URL as thumbnail
          description: uploadDescription || `Uploaded ${file.name}`,
          tags: []
        };

        // Add to documents list
        setDocuments(prev => [newDocument, ...prev]);
      }

      // Reset form
      setSelectedImages([]);
      setUploadDescription("");
      setUploadFolderId("");
      setShowUploadForm(false);

      toast.success(`Successfully uploaded ${selectedImages.length} image(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedImages, uploadDescription, uploadFolderId, folders]);

  // Cancel upload form
  const handleCancelUpload = useCallback(() => {
    setSelectedImages([]);
    setUploadDescription("");
    setUploadFolderId("");
    setShowUploadForm(false);
  }, []);

  // Drag and drop handlers
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
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleImageSelection(droppedFiles);
  }, [handleImageSelection]);

  // Handle folder navigation to files tab
  const handleFolderNavigation = useCallback((folderName: string) => {
    // Set the filter to the selected folder
    setSelectedCategory(folderName);
    // Switch to the files tab
    setActiveTab("files");
  }, []);

  // Handle document deletion
  const handleDeleteDocument = useCallback((documentId: string) => {
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  }, []);

  // Handle folder creation
  const handleCreateFolder = useCallback((folderData: { name: string; description: string; color: string; icon: string }) => {
    try {
      const newFolder: Folder = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: folderData.name,
        description: folderData.description,
        color: folderData.color,
        icon: folderData.icon,
        documentCount: 0,
        createdDate: new Date().toISOString().split('T')[0],
        createdBy: "Current User" // This would come from auth context
      };

      setFolders(prev => [newFolder, ...prev]);
      setIsAddFolderOpen(false);
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Folder creation error:", error);
      toast.error("Failed to create folder");
    }
  }, []);

  // Handle folder deletion
  const handleDeleteFolder = useCallback((folderId: string) => {
    try {
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      toast.success("Folder deleted successfully");
    } catch (error) {
      console.error("Folder deletion error:", error);
      toast.error("Failed to delete folder");
    }
  }, []);

  // Update folder document counts
  const updateFolderCounts = useCallback(() => {
    setFolders(prevFolders =>
      prevFolders.map(folder => ({
        ...folder,
        documentCount: documents.filter(doc => doc.folderId === folder.id).length
      }))
    );
  }, [documents]);

  // Update folder counts when documents change
  React.useEffect(() => {
    updateFolderCounts();
  }, [updateFolderCounts]);

  // Date grouping functionality
  const getDateGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      return "A month ago";
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const groupDocumentsByDate = (docs: DocumentFile[]) => {
    // First sort by date (newest first)
    const sortedDocs = [...docs].sort((a, b) =>
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    // Group by date periods
    const groups: { [key: string]: DocumentFile[] } = {};
    sortedDocs.forEach(doc => {
      const group = getDateGroup(doc.uploadDate);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(doc);
    });

    // Sort groups by priority (recent months first, then "A month ago")
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      if (a === "A month ago") return 1;
      if (b === "A month ago") return -1;
      return 0;
    });

    return sortedGroups;
  };

  // Format file size for display
  const formatFileSize = (size: string): string => {
    return size;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Document Management
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Upload, organize, and manage your business documents and files
            </p>
          </div>

          {/* Animated Circular Statistics */}
          <div className="flex items-center justify-center lg:justify-end gap-4 sm:gap-6">
            <CircularProgress
              value={uploadStats.totalFiles}
              max={100}
              size={80}
              strokeWidth={5}
              color="#3b82f6"
              label={uploadStats.totalFiles.toString()}
              subtitle="Total Files"
              animated={true}
            />
            <CircularProgress
              value={uploadStats.storageUsed}
              max={100}
              size={80}
              strokeWidth={5}
              color="#10b981"
              label={uploadStats.totalSize}
              subtitle="Storage Used"
              animated={true}
            />
          </div>
        </div>

        {/* Document Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 dark:bg-muted/30">
            <TabsTrigger
              value="folders"
              className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors"
            >
              <Folder className="h-4 w-4" />
              <span>Folders</span>
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2 h-10 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>

          {/* Folders Tab Content */}
          <TabsContent value="folders" className="space-y-4 sm:space-y-6">
            {/* Folders Header */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Folder Management</CardTitle>
                      <CardDescription className="text-sm">
                        Organize your documents into folders for better management
                      </CardDescription>
                    </div>
                  </div>
                  <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                          Create a new folder to organize your documents
                        </DialogDescription>
                      </DialogHeader>
                      <AddFolderForm onSubmit={handleCreateFolder} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="border hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleFolderNavigation(folder.name)}
                  title={`Click to view ${folder.name} files`}
                >
                  <CardContent className="p-4 sm:p-6">
                    {/* Folder Icon and Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        folder.color === "blue" ? "bg-blue-100 dark:bg-blue-900/30" :
                        folder.color === "green" ? "bg-green-100 dark:bg-green-900/30" :
                        folder.color === "purple" ? "bg-purple-100 dark:bg-purple-900/30" :
                        folder.color === "orange" ? "bg-orange-100 dark:bg-orange-900/30" :
                        folder.color === "red" ? "bg-red-100 dark:bg-red-900/30" :
                        "bg-blue-100 dark:bg-blue-900/30"
                      }`}>
                        {folder.icon === "FileText" && <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          folder.color === "blue" ? "text-blue-600" :
                          folder.color === "green" ? "text-green-600" :
                          folder.color === "purple" ? "text-purple-600" :
                          folder.color === "orange" ? "text-orange-600" :
                          folder.color === "red" ? "text-red-600" :
                          "text-blue-600"
                        }`} />}
                        {folder.icon === "Receipt" && <Receipt className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          folder.color === "blue" ? "text-blue-600" :
                          folder.color === "green" ? "text-green-600" :
                          folder.color === "purple" ? "text-purple-600" :
                          folder.color === "orange" ? "text-orange-600" :
                          folder.color === "red" ? "text-red-600" :
                          "text-blue-600"
                        }`} />}
                        {folder.icon === "Image" && <ImageIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          folder.color === "blue" ? "text-blue-600" :
                          folder.color === "green" ? "text-green-600" :
                          folder.color === "purple" ? "text-purple-600" :
                          folder.color === "orange" ? "text-orange-600" :
                          folder.color === "red" ? "text-red-600" :
                          "text-blue-600"
                        }`} />}
                        {folder.icon === "BarChart" && <BarChart className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          folder.color === "blue" ? "text-blue-600" :
                          folder.color === "green" ? "text-green-600" :
                          folder.color === "purple" ? "text-purple-600" :
                          folder.color === "orange" ? "text-orange-600" :
                          folder.color === "red" ? "text-red-600" :
                          "text-blue-600"
                        }`} />}
                        {folder.icon === "Award" && <Award className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          folder.color === "blue" ? "text-blue-600" :
                          folder.color === "green" ? "text-green-600" :
                          folder.color === "purple" ? "text-purple-600" :
                          folder.color === "orange" ? "text-orange-600" :
                          folder.color === "red" ? "text-red-600" :
                          "text-blue-600"
                        }`} />}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Folder
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Folder Details */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base sm:text-lg group-hover:text-blue-600 transition-colors">{folder.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {folder.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{folder.documentCount} files</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{folder.createdBy}</span>
                        </div>
                      </div>
                      {/* Click indicator */}
                      <div className="flex items-center gap-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <FolderOpen className="h-3 w-3" />
                        <span>Click to view files</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {folders.length === 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No folders created</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Create your first folder to organize your documents
                  </p>
                  <Button
                    onClick={() => setIsAddFolderOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upload Tab Content */}
          <TabsContent value="upload" className="space-y-6">

            {/* Upload Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Upload Images</CardTitle>
                    <CardDescription className="text-sm">
                      Upload images to organize your business files (JPG, PNG, GIF, WebP formats supported)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showUploadForm ? (
                  // Image Selection
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-100/50 dark:bg-blue-950/30"
                        : "border-blue-200 hover:border-blue-300 bg-blue-50/30 dark:bg-blue-950/10"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Upload Images</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Drag and drop images here, or click to select images
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      Supported formats: JPG, PNG, GIF, WebP (Max 50MB each)
                    </p>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageSelection(Array.from(e.target.files));
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                      ref={(input) => {
                        if (input) {
                          (window as any).imageUploadInput = input;
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                      onClick={() => {
                        const input = document.getElementById('image-upload') as HTMLInputElement;
                        if (input) {
                          input.click();
                        }
                      }}
                    >
                      Select Images
                    </Button>
                  </div>
                ) : (
                  // Upload Form
                  <div className="space-y-4">
                    {/* Selected Images Preview */}
                    <div>
                      <Label className="text-sm font-medium">Selected Images ({selectedImages.length})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter a description for these images..."
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Folder Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="folder">Save to Folder</Label>
                      <Select value={uploadFolderId} onValueChange={setUploadFolderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  folder.color === "blue" ? "bg-blue-500" :
                                  folder.color === "green" ? "bg-green-500" :
                                  folder.color === "purple" ? "bg-purple-500" :
                                  folder.color === "orange" ? "bg-orange-500" :
                                  folder.color === "red" ? "bg-red-500" :
                                  "bg-blue-500"
                                }`} />
                                {folder.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                      <Button
                        onClick={handleImageUpload}
                        disabled={isUploading || !uploadFolderId}
                        className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Images
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelUpload}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            {documents.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Recent Uploads</CardTitle>
                        <CardDescription className="text-sm">
                          Your most recently uploaded documents
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Navigate to files tab */}}
                      className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-sm w-full sm:w-auto"
                    >
                      View All Files
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {documents.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            {doc.type === 'image' ? (
                              <ImageIcon className="h-4 w-4 text-blue-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size)} • {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs flex-shrink-0 ${
                              doc.folderColor === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                              doc.folderColor === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                              doc.folderColor === "purple" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                              doc.folderColor === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                              doc.folderColor === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                              "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                            }`}
                          >
                            {doc.folderName}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDocument(doc)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Files Tab Content */}
          <TabsContent value="files" className="space-y-4 sm:space-y-6">
            {/* Search and Filter Controls */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Search Bar */}
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted/30 dark:bg-muted/20 border-muted-foreground/20 dark:border-muted-foreground/30 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {/* Folder Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-40 bg-muted/30 dark:bg-muted/20 border-muted-foreground/20 dark:border-muted-foreground/30">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFolders.map((folder) => (
                          <SelectItem key={folder} value={folder}>
                            {folder === "all" ? "All Folders" : folder}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>



                    {/* View Mode Toggle */}
                    <div className="flex items-center border border-muted-foreground/20 rounded-lg bg-muted/30 dark:bg-muted/20 dark:border-muted-foreground/30 w-full sm:w-auto">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-8 px-3 flex-1 sm:flex-none"
                      >
                        <Grid3X3 className="h-4 w-4" />
                        <span className="ml-2 sm:hidden">Grid</span>
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 px-3 flex-1 sm:flex-none"
                      >
                        <List className="h-4 w-4" />
                        <span className="ml-2 sm:hidden">List</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Display */}
            {filteredDocuments.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {searchTerm || selectedCategory !== "all"
                      ? "Try adjusting your search or folder filter criteria"
                      : "Upload your first document to get started"
                    }
                  </p>
                  <Button
                    onClick={() => {/* Switch to upload tab */}}
                    className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          Document Library ({filteredDocuments.length})
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Manage and organize your business documents
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date-grouped documents */}
                  {groupDocumentsByDate(filteredDocuments).map(([dateGroup, groupDocs]) => (
                    <div key={dateGroup} className="space-y-4">
                      {/* Date Separator */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-border"></div>
                        <div className="px-3 py-1 bg-muted/50 rounded-full">
                          <span className="text-sm font-medium text-muted-foreground">
                            {dateGroup}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-border"></div>
                      </div>

                      {/* Documents in this date group */}
                      {viewMode === "grid" ? (
                        // Grid View
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                          {groupDocs.map((doc) => (
                            <Card
                              key={doc.id}
                              className="border hover:shadow-md transition-all duration-200 cursor-pointer group"
                              onClick={() => openDocument(doc)}
                            >
                              <CardContent className="p-3 sm:p-4">
                                {/* Document Preview */}
                                <div className="aspect-square bg-muted/30 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                  {doc.type === 'image' && doc.thumbnail ? (
                                    <img
                                      src={doc.thumbnail}
                                      alt={doc.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                      {doc.type === 'image' ? (
                                        <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                      ) : (
                                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                      )}
                                    </div>
                                  )}

                                  {/* Hover Actions */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDocument(doc);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle download
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Document Info */}
                                <div className="space-y-2">
                                  <h4 className="font-medium text-xs sm:text-sm truncate" title={doc.name}>
                                    {doc.name}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{formatFileSize(doc.size)}</span>
                                    <span>{formatDate(doc.uploadDate)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${
                                        doc.folderColor === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                        doc.folderColor === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                        doc.folderColor === "purple" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                        doc.folderColor === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                                        doc.folderColor === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                      }`}
                                    >
                                      {doc.folderName}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openDocument(doc)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Share className="h-4 w-4 mr-2" />
                                          Share
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDocument(doc.id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        // List View
                        <div className="space-y-2">
                          {groupDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors cursor-pointer group"
                              onClick={() => openDocument(doc)}
                            >
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                {/* Document Icon */}
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {doc.type === 'image' ? (
                                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  ) : (
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  )}
                                </div>

                                {/* Document Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                    <h4 className="font-medium text-sm truncate" title={doc.name}>
                                      {doc.name}
                                    </h4>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs flex-shrink-0 w-fit ${
                                        doc.folderColor === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                        doc.folderColor === "green" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                        doc.folderColor === "purple" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                        doc.folderColor === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                                        doc.folderColor === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                                      }`}
                                    >
                                      <Folder className="h-3 w-3 mr-1" />
                                      {doc.folderName}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <HardDrive className="h-3 w-3" />
                                      {formatFileSize(doc.size)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(doc.uploadDate)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {doc.uploadedBy}
                                    </span>
                                  </div>
                                  {doc.description && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      {doc.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDocument(doc);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle download
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDocument(doc)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Info
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Share className="h-4 w-4 mr-2" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDocument(doc.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Document Viewer Modal */}
        {currentDocument && (
          <DocumentViewer
            isOpen={isOpen}
            onClose={closeDocument}
            document={currentDocument}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Documents;

