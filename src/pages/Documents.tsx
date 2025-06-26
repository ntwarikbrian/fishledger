import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Download,
  Trash2,
  Upload,
  Image,
  File,
  Calendar,
  User,
  FolderOpen,
  Tag,
  Share2,
  Archive
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";

const Documents = () => {
  // Mock data for documents
  const documentsData = [
    {
      id: 1,
      name: "Atlantic Salmon Certificate.pdf",
      type: "document",
      category: "Certificates",
      size: "2.4 MB",
      uploadDate: "2024-01-22",
      uploadedBy: "John Smith",
      tags: ["certificate", "salmon", "quality"],
      description: "Quality certificate for Atlantic Salmon batch #AS-2024-001",
      url: "/documents/salmon-cert.pdf",
      thumbnail: "/thumbnails/pdf-icon.png",
      relatedTo: "Product",
      relatedId: "PROD-001"
    },
    {
      id: 2,
      name: "Fresh Fish Delivery Photo.jpg",
      type: "image",
      category: "Delivery Photos",
      size: "5.2 MB",
      uploadDate: "2024-01-21",
      uploadedBy: "Maria Rodriguez",
      tags: ["delivery", "fresh", "photo"],
      description: "Photo of fresh fish delivery from Ocean Fresh Ltd",
      url: "/images/delivery-photo.jpg",
      thumbnail: "/thumbnails/delivery-thumb.jpg",
      relatedTo: "Order",
      relatedId: "ORD-2024-001"
    },
    {
      id: 3,
      name: "Invoice_OceanRestaurant_Jan2024.pdf",
      type: "document",
      category: "Invoices",
      size: "1.8 MB",
      uploadDate: "2024-01-20",
      uploadedBy: "Sarah Johnson",
      tags: ["invoice", "restaurant", "payment"],
      description: "Invoice for Ocean Restaurant - January 2024 orders",
      url: "/documents/invoice-ocean-jan.pdf",
      thumbnail: "/thumbnails/pdf-icon.png",
      relatedTo: "Customer",
      relatedId: "CUST-003"
    },
    {
      id: 4,
      name: "Equipment_Maintenance_Receipt.jpg",
      type: "image",
      category: "Receipts",
      size: "3.1 MB",
      uploadDate: "2024-01-19",
      uploadedBy: "David Chen",
      tags: ["receipt", "maintenance", "equipment"],
      description: "Receipt for refrigeration unit maintenance",
      url: "/images/maintenance-receipt.jpg",
      thumbnail: "/thumbnails/receipt-thumb.jpg",
      relatedTo: "Expense",
      relatedId: "EXP-004"
    },
    {
      id: 5,
      name: "Staff_Training_Certificate.pdf",
      type: "document",
      category: "Training",
      size: "1.2 MB",
      uploadDate: "2024-01-18",
      uploadedBy: "John Smith",
      tags: ["training", "staff", "certificate"],
      description: "Food safety training certificate for staff members",
      url: "/documents/training-cert.pdf",
      thumbnail: "/thumbnails/pdf-icon.png",
      relatedTo: "Staff",
      relatedId: "STAFF-002"
    }
  ];

  // Calculate document statistics
  const documentStats = {
    totalDocuments: documentsData.length,
    totalImages: documentsData.filter(doc => doc.type === "image").length,
    totalDocuments: documentsData.filter(doc => doc.type === "document").length,
    totalSize: documentsData.reduce((sum, doc) => {
      const size = parseFloat(doc.size.replace(" MB", ""));
      return sum + size;
    }, 0)
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4 text-green-600" />;
      case "document":
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      "Certificates": "bg-blue-100 text-blue-800",
      "Delivery Photos": "bg-green-100 text-green-800",
      "Invoices": "bg-purple-100 text-purple-800",
      "Receipts": "bg-orange-100 text-orange-800",
      "Training": "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <Badge className={`${colors[category] || "bg-gray-100 text-gray-800"} hover:${colors[category] || "bg-gray-100"}`}>
        {category}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Document Storage</h1>
            <p className="text-muted-foreground">Manage images, documents, and files</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="mr-2 h-4 w-4" /> Upload Files
          </Button>
        </div>



        {/* Document Management Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>All Documents</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search files..." className="pl-8 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="certificates">Certificates</SelectItem>
                        <SelectItem value="photos">Delivery Photos</SelectItem>
                        <SelectItem value="invoices">Invoices</SelectItem>
                        <SelectItem value="receipts">Receipts</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentsData.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(document.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{document.name}</h3>
                              <p className="text-sm text-muted-foreground">{document.description}</p>
                            </div>
                            {getCategoryBadge(document.category)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <span>{document.size}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{document.uploadDate}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{document.uploadedBy}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span>{document.tags.join(", ")}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Related to:</div>
                              <div className="font-medium">{document.relatedTo}</div>
                              <div className="text-xs text-muted-foreground">{document.relatedId}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Actions:</div>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Share2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all images</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {documentsData
                    .filter(doc => doc.type === "image")
                    .map((image) => (
                      <div key={image.id} className="border rounded-lg p-2 hover:bg-muted/50 transition-colors">
                        <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-xs">
                          <p className="font-medium truncate">{image.name}</p>
                          <p className="text-muted-foreground">{image.size}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all documents</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documentsData
                    .filter(doc => doc.type === "document")
                    .map((document) => (
                      <div key={document.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-muted-foreground">{document.description}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{document.size}</p>
                          <p className="text-muted-foreground">{document.uploadDate}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <p className="text-sm text-muted-foreground">Upload images and documents to the system</p>
              </CardHeader>
              <CardContent>
                <FileUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documents;
