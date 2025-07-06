import React, { useState, useCallback, useEffect } from "react";
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
import { foldersApi, filesApi, type FolderData, type CreateFolderData, type FileData } from "@/lib/api";

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

// Use FolderData from API
type Folder = FolderData;

// Add Folder Form Component
interface AddFolderFormProps {
  onSubmit: (data: { name: string; description: string; color: string; icon: string }) => void;
  isLoading?: boolean;
}

const AddFolderForm: React.FC<AddFolderFormProps> = ({ onSubmit, isLoading = false }) => {
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Folder Name */}
      <div className="space-y-1">
        <Label htmlFor="folderName" className="text-sm">Folder Name</Label>
        <Input
          id="folderName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter folder name"
          className="w-full h-8"
          required
        />
      </div>

      {/* Folder Description */}
      <div className="space-y-1">
        <Label htmlFor="folderDescription" className="text-sm">Description (Optional)</Label>
        <Textarea
          id="folderDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          className="w-full text-sm"
          rows={2}
        />
      </div>

      {/* Color and Icon Selection - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Color Selection */}
        <div className="space-y-1">
          <Label className="text-sm">Color</Label>
          <div className="flex gap-1">
            {colorOptions.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => setColor(colorOption.value)}
                className={`w-6 h-6 rounded-full ${colorOption.class} ${
                  color === colorOption.value ? "ring-2 ring-offset-1 ring-gray-400" : ""
                } transition-all`}
                title={colorOption.label}
              />
            ))}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-1">
          <Label className="text-sm">Icon</Label>
          <div className="grid grid-cols-3 gap-1">
            {iconOptions.map((iconOption) => {
              const IconComponent = iconOption.icon;
              return (
                <button
                  key={iconOption.value}
                  type="button"
                  onClick={() => setIcon(iconOption.value)}
                  className={`p-1.5 rounded border flex flex-col items-center transition-all ${
                    icon === iconOption.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                  title={iconOption.label}
                >
                  <IconComponent className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 h-8 px-4 text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Folder'
          )}
        </Button>
      </div>
    </form>
  );
};

const Documents: React.FC = () => {
  // State management for documents and UI
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Folder management state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("folders");
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [selectedFolderForManage, setSelectedFolderForManage] = useState<Folder | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState<boolean>(false);

  // Upload form state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Document viewer hook
  const { isOpen, currentDocument, openDocument, closeDocument } = useDocumentViewer();

  // Fetch folders on component mount
  React.useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoadingFolders(true);

        // Check authentication status
        const authToken = localStorage.getItem('auth_token');
        console.log("Auth token present:", !!authToken);

        if (!authToken) {
          console.error("No authentication token found");
          toast.error("Please log in to access folders");
          return;
        }

        const response = await foldersApi.getAll();
        console.log("Folders API response:", response);

        if (response.success && response.data) {
          setFolders(response.data);
        } else {
          console.error('Failed to fetch folders:', response.message);
          if (response.error?.includes('401') || response.error?.includes('Authentication')) {
            toast.error("Authentication expired. Please log in again.");
          } else {
            toast.error('Failed to load folders');
          }
        }
      } catch (error) {
        console.error('Error fetching folders:', error);
        toast.error('Failed to load folders');
      } finally {
        setIsLoadingFolders(false);
      }
    };

    fetchFolders();
  }, []);

  // Upload statistics
  const uploadStats: UploadStats = React.useMemo(() => {
    // Calculate total size from documents
    const totalSizeBytes = documents.reduce((total, doc) => {
      // Parse size string (e.g., "2.4 MB" -> 2.4 * 1024 * 1024)
      const sizeMatch = doc.size.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        switch (unit) {
          case 'KB': return total + (value * 1024);
          case 'MB': return total + (value * 1024 * 1024);
          case 'GB': return total + (value * 1024 * 1024 * 1024);
          default: return total;
        }
      }
      return total;
    }, 0);

    // Format total size
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return "0 MB";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    // Calculate recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = documents.filter(doc =>
      new Date(doc.uploadDate) >= sevenDaysAgo
    ).length;

    // Calculate storage usage percentage (assuming 1GB limit for demo)
    const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
    const storageUsed = Math.min((totalSizeBytes / storageLimit) * 100, 100);

    return {
      totalFiles: documents.length,
      totalSize: formatSize(totalSizeBytes),
      recentUploads,
      storageUsed: Math.round(storageUsed)
    };
  }, [documents]);

  // Get unique folders for filtering
  const availableFolders = ["all", ...Array.from(new Set(folders.map(folder => folder.folder_name)))];

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

    // Check authentication before upload
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      toast.error("Please log in to upload files");
      return;
    }

    try {
      setIsUploading(true);

      const selectedFolder = folders.find(f => f.folder_id === uploadFolderId);
      let successCount = 0;
      let failCount = 0;

      // Upload files to backend API
      if (selectedImages.length === 1) {
        // Single file upload
        try {
          const response = await filesApi.uploadSingle(
            selectedImages[0],
            uploadFolderId,
            uploadDescription || `Uploaded ${selectedImages[0].name}`
          );

          if (response.success && response.data) {
            // Convert API response to DocumentFile format
            const newDocument: DocumentFile = {
              id: response.data.file.file_id,
              name: response.data.file.file_name,
              type: response.data.file.file_type?.startsWith('image/') ? 'image' : 'document',
              size: response.data.metadata.size,
              uploadDate: new Date(response.data.file.upload_date).toISOString().split('T')[0],
              uploadedBy: "You", // TODO: Get from auth context
              category: selectedFolder?.folder_name || "Uncategorized",
              folderId: response.data.file.folder_id,
              folderName: selectedFolder?.folder_name || "Uncategorized",
              folderColor: selectedFolder?.color || "purple",
              url: response.data.file.file_url,
              thumbnail: response.data.file.file_url, // Use same URL for thumbnail
              description: response.data.file.description || "",
              tags: []
            };

            // Add to documents list
            setDocuments(prev => [newDocument, ...prev]);
            successCount = 1;
          } else {
            console.error("Upload failed:", response.error);
            toast.error(response.error || "Failed to upload file");
            failCount = 1;
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload file. Please try again.");
          failCount = 1;
        }
      } else {
        // Multiple files upload
        try {
          const response = await filesApi.uploadMultiple(
            selectedImages,
            uploadFolderId,
            uploadDescription || "Batch upload"
          );

          if (response.success && response.data) {
            // Process successful uploads
            for (const uploadResult of response.data.successful) {
              const newDocument: DocumentFile = {
                id: uploadResult.file.file_id,
                name: uploadResult.file.file_name,
                type: uploadResult.file.file_type?.startsWith('image/') ? 'image' : 'document',
                size: `${(uploadResult.file.file_size || 0 / (1024 * 1024)).toFixed(1)} MB`,
                uploadDate: new Date(uploadResult.file.upload_date).toISOString().split('T')[0],
                uploadedBy: "You", // TODO: Get from auth context
                category: selectedFolder?.folder_name || "Uncategorized",
                folderId: uploadResult.file.folder_id,
                folderName: selectedFolder?.folder_name || "Uncategorized",
                folderColor: selectedFolder?.color || "purple",
                url: uploadResult.file.file_url,
                thumbnail: uploadResult.file.file_url,
                description: uploadResult.file.description || "",
                tags: []
              };

              // Add to documents list
              setDocuments(prev => [newDocument, ...prev]);
            }

            successCount = response.data.summary.successful;
            failCount = response.data.summary.failed;

            // Show errors for failed uploads
            if (response.data.failed.length > 0) {
              response.data.failed.forEach(failure => {
                console.error("Upload failed:", failure.error);
              });
            }
          } else {
            console.error("Multiple upload failed:", response.error);
            toast.error(response.error || "Failed to upload files");
            failCount = selectedImages.length;
          }
        } catch (error) {
          console.error("Multiple upload error:", error);
          toast.error("Failed to upload files. Please try again.");
          failCount = selectedImages.length;
        }
      }

      // Reset form
      setSelectedImages([]);
      setUploadDescription("");
      setUploadFolderId("");
      setShowUploadForm(false);

      // Show success/error messages
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Uploaded ${successCount} file(s), ${failCount} failed`);
      } else if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file(s)`);
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedImages, uploadDescription, uploadFolderId, folders]);

  // Add loading state for files
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // File operation states
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [editingFile, setEditingFile] = useState<DocumentFile | null>(null);
  const [isEditFileOpen, setIsEditFileOpen] = useState(false);
  const [editFileForm, setEditFileForm] = useState({
    name: '',
    description: ''
  });

  // Cache for API calls to reduce requests
  const [filesCache, setFilesCache] = useState<Map<string, { data: DocumentFile[]; timestamp: number }>>(new Map());
  const [lastFolderLoad, setLastFolderLoad] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load files from database by folder with caching
  const loadFilesByFolder = useCallback(async (folderId: string, forceRefresh = false) => {
    if (isLoadingFiles) return; // Prevent multiple simultaneous requests

    // Check cache first
    const cacheKey = `folder_${folderId}`;
    const cached = filesCache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setDocuments(cached.data);
      return;
    }

    try {
      setIsLoadingFiles(true);
      const response = await filesApi.getByFolder(folderId);

      if (response.success && response.data) {
        // Convert API response to DocumentFile format
        const folderData = folders.find(f => f.folder_id === folderId);
        const loadedDocuments: DocumentFile[] = response.data.map((file: FileData) => ({
          id: file.file_id,
          name: file.file_name,
          type: file.file_type?.startsWith('image/') ? 'image' : 'document',
          size: file.file_size ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown',
          uploadDate: new Date(file.upload_date).toISOString().split('T')[0],
          uploadedBy: "You", // TODO: Get from auth context or file.added_by
          category: folderData?.folder_name || "Uncategorized",
          folderId: file.folder_id,
          folderName: folderData?.folder_name || "Uncategorized",
          folderColor: folderData?.color || "purple",
          url: file.file_url,
          thumbnail: file.file_url,
          description: file.description || "",
          tags: []
        }));

        // Update cache
        setFilesCache(prev => new Map(prev).set(cacheKey, { data: loadedDocuments, timestamp: now }));

        // Update documents state with loaded files
        setDocuments(loadedDocuments);
      } else {
        console.error("Failed to load files:", response.error);
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setDocuments([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [folders, isLoadingFiles, filesCache, CACHE_DURATION]);

  // Load all files from all folders with caching
  const loadAllFiles = useCallback(async (forceRefresh = false) => {
    if (isLoadingFiles) return; // Prevent multiple simultaneous requests

    // Check if we need to refresh based on time
    const now = Date.now();
    if (!forceRefresh && (now - lastFolderLoad) < CACHE_DURATION) {
      // Use cached data if available
      const allCachedFiles: DocumentFile[] = [];
      for (const folder of folders) {
        const cacheKey = `folder_${folder.folder_id}`;
        const cached = filesCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          allCachedFiles.push(...cached.data);
        }
      }
      if (allCachedFiles.length > 0) {
        allCachedFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setDocuments(allCachedFiles);
        return;
      }
    }

    try {
      setIsLoadingFiles(true);
      const allFiles: DocumentFile[] = [];

      // Load files from each folder
      for (const folder of folders) {
        const cacheKey = `folder_${folder.folder_id}`;
        const cached = filesCache.get(cacheKey);

        // Use cache if valid, otherwise fetch
        if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
          allFiles.push(...cached.data);
        } else {
          const response = await filesApi.getByFolder(folder.folder_id);

          if (response.success && response.data) {
            const folderFiles: DocumentFile[] = response.data.map((file: FileData) => ({
              id: file.file_id,
              name: file.file_name,
              type: file.file_type?.startsWith('image/') ? 'image' : 'document',
              size: file.file_size ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown',
              uploadDate: new Date(file.upload_date).toISOString().split('T')[0],
              uploadedBy: "You", // TODO: Get from auth context
              category: folder.folder_name,
              folderId: file.folder_id,
              folderName: folder.folder_name,
              folderColor: folder.color,
              url: file.file_url,
              thumbnail: file.file_url,
              description: file.description || "",
              tags: []
            }));

            // Update cache
            setFilesCache(prev => new Map(prev).set(cacheKey, { data: folderFiles, timestamp: now }));
            allFiles.push(...folderFiles);
          }
        }
      }

      // Sort by upload date (newest first)
      allFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setDocuments(allFiles);
      setLastFolderLoad(now);
    } catch (error) {
      console.error("Error loading all files:", error);
      setDocuments([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [folders, isLoadingFiles, filesCache, lastFolderLoad, CACHE_DURATION]);

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

  // Handle folder filter change with debouncing
  const handleFolderFilterChange = useCallback(async (folderName: string) => {
    setSelectedCategory(folderName);

    // Debounce the API call to prevent rapid successive requests
    setTimeout(async () => {
      if (folderName === "all") {
        // Load all files from all folders
        await loadAllFiles();
      } else {
        // Load files from specific folder
        const selectedFolder = folders.find(f => f.folder_name === folderName);
        if (selectedFolder) {
          await loadFilesByFolder(selectedFolder.folder_id);
        }
      }
    }, 300); // 300ms debounce
  }, [folders, loadAllFiles, loadFilesByFolder]);

  // Handle folder navigation to files tab
  const handleFolderNavigation = useCallback((folderName: string) => {
    // Set the filter to the selected folder and load its files
    handleFolderFilterChange(folderName);
    // Switch to the files tab
    setActiveTab("files");
  }, [handleFolderFilterChange]);

  // Test server connection
  const testServerConnection = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5004/health');
      const result = await response.json();
      console.log("Server health check:", result);

      if (response.ok) {
        toast.success("Server is running and accessible");
      } else {
        toast.error("Server is not responding properly");
      }
    } catch (error) {
      console.error("Server connection test failed:", error);
      toast.error("Cannot connect to server. Please check if the backend is running.");
    }
  }, []);

  // Handle file download
  const handleDownloadFile = useCallback(async (document: DocumentFile) => {
    try {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();

      toast.success(`Downloading ${document.name}`, {
        position: "bottom-right",
        duration: 2000
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file", {
        position: "bottom-right",
        duration: 3000
      });
    }
  }, []);

  // Handle file edit info
  const handleEditFileInfo = useCallback((document: DocumentFile) => {
    setEditingFile(document);
    setEditFileForm({
      name: document.name,
      description: document.description || ''
    });
    setIsEditFileOpen(true);
  }, []);

  // Handle file info update
  const handleUpdateFileInfo = useCallback(async () => {
    if (!editingFile) return;

    try {
      const loadingToast = toast.loading("Updating file info...", {
        position: "bottom-right",
        duration: Infinity
      });

      const response = await filesApi.updateMetadata(editingFile.id, {
        file_name: editFileForm.name.trim(),
        description: editFileForm.description.trim() || undefined
      });

      if (response.success && response.data) {
        // Update local state
        setDocuments(prev => prev.map(doc =>
          doc.id === editingFile.id
            ? { ...doc, name: editFileForm.name.trim(), description: editFileForm.description.trim() }
            : doc
        ));

        // Clear cache for the folder
        const cacheKey = `folder_${editingFile.folderId}`;
        setFilesCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(cacheKey);
          return newCache;
        });

        toast.dismiss(loadingToast);
        toast.success("File info updated successfully", {
          position: "bottom-right",
          duration: 3000
        });

        setIsEditFileOpen(false);
        setEditingFile(null);
        setEditFileForm({ name: '', description: '' });
      } else {
        throw new Error(response.message || 'Failed to update file info');
      }
    } catch (error) {
      console.error("File update error:", error);
      toast.error("Failed to update file info", {
        position: "bottom-right",
        duration: 4000
      });
    }
  }, [editingFile, editFileForm]);

  // Handle file share
  const handleShareFile = useCallback(async (document: DocumentFile) => {
    try {
      // Copy file URL to clipboard
      await navigator.clipboard.writeText(document.url);

      toast.success("File link copied to clipboard", {
        position: "bottom-right",
        duration: 3000
      });
    } catch (error) {
      console.error("Share error:", error);
      // Fallback: show the URL in a prompt
      prompt("Copy this link to share the file:", document.url);
    }
  }, []);

  // Handle document deletion with loading animation
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      // Add to deleting set and show loading toast
      setDeletingFiles(prev => new Set(prev).add(documentId));

      const loadingToast = toast.loading("Deleting...", {
        position: "bottom-right",
        duration: Infinity,
        style: {
          fontSize: '12px',
          padding: '8px 12px',
          minWidth: '120px'
        }
      });

      // Call backend API to delete file
      const response = await filesApi.delete(documentId);

      if (response.success) {
        // Remove from local state only after successful API call
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));

        // Clear cache for the folder
        const deletedDoc = documents.find(doc => doc.id === documentId);
        if (deletedDoc) {
          const cacheKey = `folder_${deletedDoc.folderId}`;
          setFilesCache(prev => {
            const newCache = new Map(prev);
            newCache.delete(cacheKey);
            return newCache;
          });
        }

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Document deleted successfully", {
          position: "bottom-right",
          duration: 3000
        });
      } else {
        throw new Error(response.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document. Please try again.", {
        position: "bottom-right",
        duration: 4000
      });
    } finally {
      // Remove from deleting set
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  }, [documents]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async (folderData: { name: string; description: string; color: string; icon: string }) => {
    try {
      setIsCreatingFolder(true);

      console.log("Creating folder with data:", folderData);

      const createData: CreateFolderData = {
        folder_name: folderData.name,
        description: folderData.description || undefined,
        color: folderData.color,
        icon: folderData.icon,
      };

      console.log("Sending API request with:", createData);

      const response = await foldersApi.create(createData);

      console.log("API response:", response);

      if (response.success && response.data) {
        setFolders(prev => [response.data!, ...prev]);
        setIsAddFolderOpen(false);
        toast.success("Folder created successfully");
      } else {
        console.error("API returned error:", response);
        const errorMessage = response.error || response.message || 'Failed to create folder';
        toast.error(`Failed to create folder: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Folder creation error:", error);

      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          toast.error("Network error: Unable to connect to server");
        } else if (error.message.includes('401')) {
          toast.error("Authentication error: Please log in again");
        } else if (error.message.includes('403')) {
          toast.error("Permission error: You don't have permission to create folders");
        } else if (error.message.includes('409')) {
          toast.error("A folder with this name already exists");
        } else {
          toast.error(`Failed to create folder: ${error.message}`);
        }
      } else {
        toast.error("Failed to create folder: Unknown error");
      }
    } finally {
      setIsCreatingFolder(false);
    }
  }, []);

  // Handle folder deletion
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      const response = await foldersApi.delete(folderId);

      if (response.success) {
        setFolders(prev => prev.filter(folder => folder.folder_id !== folderId));
        toast.success("Folder deleted successfully");
      } else {
        throw new Error(response.message || 'Failed to delete folder');
      }
    } catch (error) {
      console.error("Folder deletion error:", error);
      toast.error("Failed to delete folder");
    }
  }, []);

  // Handle folder manage dialog
  const handleManageFolder = useCallback((folder: Folder) => {
    setSelectedFolderForManage(folder);
    setIsManageDialogOpen(true);
  }, []);

  // Update folder document counts
  const updateFolderCounts = useCallback(() => {
    setFolders(prevFolders =>
      prevFolders.map(folder => ({
        ...folder,
        file_count: documents.filter(doc => doc.folderId === folder.folder_id).length
      }))
    );
  }, [documents]);

  // Load all files when folders are loaded (only once)
  React.useEffect(() => {
    if (folders.length > 0) {
      loadAllFiles();
    }
  }, [folders.length]); // Only depend on folders.length to avoid infinite loop

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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={testServerConnection}
                      className="text-sm"
                    >
                      Test Server
                    </Button>
                    <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Folder
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[380px]">
                      <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg">Create New Folder</DialogTitle>
                        <DialogDescription className="text-sm">
                          Organize your documents with a new folder
                        </DialogDescription>
                      </DialogHeader>
                      <AddFolderForm onSubmit={handleCreateFolder} isLoading={isCreatingFolder} />
                    </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Folders Grid */}
            {isLoadingFolders ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading folders...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {folders.map((folder) => (
                <Card
                  key={folder.folder_id}
                  className="border hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleFolderNavigation(folder.folder_name)}
                  title={`Click to view ${folder.folder_name} files`}
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageFolder(folder);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.folder_id);
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
                      <h3 className="font-semibold text-base sm:text-lg group-hover:text-blue-600 transition-colors">{folder.folder_name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {folder.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{folder.file_count} files</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>You</span>
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
            )}

            {/* Empty State */}
            {!isLoadingFolders && folders.length === 0 && (
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
                            <SelectItem key={folder.folder_id} value={folder.folder_id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  folder.color === "blue" ? "bg-blue-500" :
                                  folder.color === "green" ? "bg-green-500" :
                                  folder.color === "purple" ? "bg-purple-500" :
                                  folder.color === "orange" ? "bg-orange-500" :
                                  folder.color === "red" ? "bg-red-500" :
                                  "bg-blue-500"
                                }`} />
                                {folder.folder_name}
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
                      onClick={() => setActiveTab("files")}
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
                    <Select value={selectedCategory} onValueChange={handleFolderFilterChange}>
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
                    onClick={() => setActiveTab("upload")}
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

        {/* Folder Manage Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Manage Folder Access
              </DialogTitle>
              <DialogDescription className="text-sm">
                View and manage access permissions for "{selectedFolderForManage?.folder_name}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current Access */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Access</h4>

                {/* Admin Access */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Admin</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Full access</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    Active
                  </Badge>
                </div>

                {/* Worker Access */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Workers</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">View only</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                    Limited
                  </Badge>
                </div>
              </div>

              {/* Folder Stats */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Folder Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{selectedFolderForManage?.file_count || 0} files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {selectedFolderForManage?.total_size ? `${(selectedFolderForManage.total_size / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsManageDialogOpen(false)}
                className="text-sm"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Documents;

