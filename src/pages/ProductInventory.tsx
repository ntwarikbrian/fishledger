import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fish, Search, Filter, Edit, Trash2, Package, Scale, ChevronDown, Eye, AlertTriangle, Calendar, RotateCcw, Archive, Plus, FileText, Save, DollarSign, TrendingUp, Calculator, Camera, Scan, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ViewType = "all" | "low-stock" | "damaged" | "expiry" | "stock-adjustment";

const ProductInventory = () => {
  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddDamagedOpen, setIsAddDamagedOpen] = useState(false);
  const [isAddExpiredOpen, setIsAddExpiredOpen] = useState(false);

  // OCR-related state
  const [isOcrMode, setIsOcrMode] = useState(false);
  const [ocrImage, setOcrImage] = useState<File | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrResults, setOcrResults] = useState<{
    productName?: string;
    quantity?: string;
    weight?: string;
    expiryDate?: string;
  } | null>(null);

  // OCR processing functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOcrImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setOcrImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Check if the browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Use back camera on mobile
        }
      });

      // Create a video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      // Create a modal-like overlay for camera
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;

      video.style.cssText = `
        max-width: 90%;
        max-height: 70%;
        border-radius: 8px;
      `;

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture Photo';
      captureBtn.style.cssText = `
        margin-top: 20px;
        padding: 12px 24px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
      `;

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        margin-top: 10px;
        padding: 8px 16px;
        background: transparent;
        color: white;
        border: 1px solid white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      `;

      overlay.appendChild(video);
      overlay.appendChild(captureBtn);
      overlay.appendChild(cancelBtn);
      document.body.appendChild(overlay);

      // Handle capture
      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setOcrImage(file);
            setOcrImagePreview(canvas.toDataURL());
          }
        }, 'image/jpeg', 0.8);

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
      };

      // Handle cancel
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(overlay);
      };

    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const processOcrImage = async () => {
    if (!ocrImage) return;

    setIsProcessingOcr(true);
    try {
      // Simulate OCR processing - In a real app, you would use a service like Tesseract.js or cloud OCR
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR results - In reality, this would come from actual OCR processing
      const mockResults = {
        productName: "Atlantic Salmon",
        quantity: "25",
        weight: "37.5",
        expiryDate: "2024-03-15"
      };

      setOcrResults(mockResults);
    } catch (error) {
      console.error('OCR processing failed:', error);
      // Handle error appropriately
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const clearOcrData = () => {
    setOcrImage(null);
    setOcrImagePreview(null);
    setOcrResults(null);
    setIsProcessingOcr(false);
  };

  const toggleOcrMode = () => {
    setIsOcrMode(!isOcrMode);
    if (isOcrMode) {
      clearOcrData();
    }
  };

  const handleCloseAddStock = () => {
    setIsAddStockOpen(false);
    setIsOcrMode(false);
    clearOcrData();
  };

  // Mock data for fish product inventory - focused on selling business
  const productData = [
    {
      id: 1,
      name: "Atlantic Salmon",
      category: "Premium Fish",
      stockQuantity: 45, // pieces for boxed
      stockWeight: 120.5, // kg for weight-based
      sellingType: "Both", // Boxed and Weight-based
      pricePerBox: 25.99,
      pricePerKg: 18.50,
      costPerBox: 18.50, // Cost price for boxes
      costPerKg: 13.20, // Cost price per kg
      boxWeight: "1.5 kg",
      status: "In Stock",
      expiryDate: "2024-02-15",
      supplier: "Ocean Fresh Ltd",
      lastRestocked: "2024-01-20"
    },
    {
      id: 2,
      name: "Rainbow Trout",
      category: "Fresh Water Fish",
      stockQuantity: 30,
      stockWeight: 85.0,
      sellingType: "Weight-based",
      pricePerBox: 0, // Not sold in boxes
      pricePerKg: 15.75,
      costPerBox: 0,
      costPerKg: 11.20,
      boxWeight: "N/A",
      status: "Low Stock",
      expiryDate: "2024-02-12",
      supplier: "Lake Harvest Co",
      lastRestocked: "2024-01-18"
    },
    {
      id: 3,
      name: "Tilapia Fillets",
      category: "Processed Fish",
      stockQuantity: 60,
      stockWeight: 0, // Only sold in boxes
      sellingType: "Boxed",
      pricePerBox: 12.99,
      pricePerKg: 0,
      costPerBox: 9.50,
      costPerKg: 0,
      boxWeight: "800g",
      status: "In Stock",
      expiryDate: "2024-02-18",
      supplier: "Fresh Catch Processing",
      lastRestocked: "2024-01-22"
    },
    {
      id: 4,
      name: "Sea Bass",
      category: "Premium Fish",
      stockQuantity: 25,
      stockWeight: 75.0,
      sellingType: "Both",
      pricePerBox: 32.50,
      pricePerKg: 22.00,
      costPerBox: 24.00,
      costPerKg: 16.50,
      boxWeight: "1.2 kg",
      status: "In Stock",
      expiryDate: "2024-02-14",
      supplier: "Coastal Fisheries",
      lastRestocked: "2024-01-21"
    },
    {
      id: 5,
      name: "Cod Fillets",
      category: "White Fish",
      stockQuantity: 0,
      stockWeight: 5.5,
      sellingType: "Weight-based",
      pricePerBox: 0,
      pricePerKg: 24.99,
      costPerBox: 0,
      costPerKg: 18.75,
      boxWeight: "N/A",
      status: "Critical Stock",
      expiryDate: "2024-02-10",
      supplier: "North Sea Catch",
      lastRestocked: "2024-01-15"
    }
  ];

  // Mock data for different views
  const lowStockData = [
    { id: 1, name: 'Rainbow Trout', currentStock: 30, minStock: 50, status: 'Low', color: 'bg-yellow-500', percentage: 60, supplier: 'Lake Harvest Co' },
    { id: 2, name: 'Cod Fillets', currentStock: 5, minStock: 25, status: 'Critical', color: 'bg-red-500', percentage: 20, supplier: 'North Sea Catch' },
    { id: 3, name: 'Mackerel', currentStock: 15, minStock: 40, status: 'Low', color: 'bg-orange-500', percentage: 37, supplier: 'Atlantic Fisheries' }
  ];

  const damagedData = [
    { id: 1, name: 'Atlantic Salmon', quantity: 8, reason: 'Damaged in Transit', date: '2024-01-21', loss: '$160.00', batch: 'AS-2024-003', status: 'Insurance Claim' },
    { id: 2, name: 'Sea Bass', quantity: 6, reason: 'Freezer Malfunction', date: '2024-01-19', loss: '$90.00', batch: 'SB-2024-001', status: 'Disposed' },
    { id: 3, name: 'Tilapia Fillets', quantity: 12, reason: 'Quality Issues', date: '2024-01-18', loss: '$144.00', batch: 'TF-2024-002', status: 'Returned to Supplier' }
  ];

  const expiryData = [
    { id: 1, name: 'Cod Fillets', expiryDate: '2024-02-10', daysLeft: 2, quantity: '5.5 kg', batch: 'CF-2024-001', status: 'Critical', supplier: 'North Sea Catch' },
    { id: 2, name: 'Rainbow Trout', expiryDate: '2024-02-12', daysLeft: 4, quantity: '85 kg', batch: 'RT-2024-002', status: 'Warning', supplier: 'Lake Harvest Co' },
    { id: 3, name: 'Sea Bass', expiryDate: '2024-02-14', daysLeft: 6, quantity: '75 kg', batch: 'SB-2024-003', status: 'Monitor', supplier: 'Coastal Fisheries' }
  ];

  const stockAdjustmentData = [
    { id: 1, product: 'Atlantic Salmon', type: 'Manual Adjustment', oldStock: '120.5 kg', newStock: '115.0 kg', difference: '-5.5 kg', reason: 'Inventory Count Correction', date: '2024-01-22', user: 'John Smith' },
    { id: 2, product: 'Tilapia Fillets', type: 'Damage Write-off', oldStock: '72 boxes', newStock: '60 boxes', difference: '-12 boxes', reason: 'Quality Issues', date: '2024-01-21', user: 'Sarah Johnson' },
    { id: 3, product: 'Sea Bass', type: 'Restock', oldStock: '50.0 kg', newStock: '75.0 kg', difference: '+25.0 kg', reason: 'New Delivery', date: '2024-01-21', user: 'Mike Wilson' }
  ];

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800";
      case "Critical Stock":
        return "bg-red-100 text-red-800";
      case "Out of Stock":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get selling type icon
  const getSellingTypeIcon = (type: string) => {
    switch (type) {
      case "Boxed":
        return <Package className="h-4 w-4" />;
      case "Weight-based":
        return <Scale className="h-4 w-4" />;
      case "Both":
        return (
          <div className="flex gap-1">
            <Package className="h-3 w-3" />
            <Scale className="h-3 w-3" />
          </div>
        );
      default:
        return <Fish className="h-4 w-4" />;
    }
  };

  // View rendering functions
  const renderAllProductsView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Category</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Selling Type</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Pricing</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Expiry</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {productData.map((product) => (
            <tr key={product.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Fish className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-xs text-muted-foreground">{product.supplier}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {product.category}
              </td>
              <td className="py-3 px-2">
                <div className="text-sm">
                  {product.sellingType === "Weight-based" ? (
                    <span>{product.stockWeight} kg</span>
                  ) : product.sellingType === "Boxed" ? (
                    <span>{product.stockQuantity} boxes</span>
                  ) : (
                    <div>
                      <div>{product.stockQuantity} boxes</div>
                      <div className="text-xs text-muted-foreground">{product.stockWeight} kg</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  {getSellingTypeIcon(product.sellingType)}
                  <span className="text-sm">{product.sellingType}</span>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="text-sm">
                  {product.sellingType === "Weight-based" ? (
                    <span>${product.pricePerKg}/kg</span>
                  ) : product.sellingType === "Boxed" ? (
                    <span>${product.pricePerBox}/box</span>
                  ) : (
                    <div>
                      <div>${product.pricePerBox}/box</div>
                      <div className="text-xs text-muted-foreground">${product.pricePerKg}/kg</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-2">
                <Badge className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </td>
              <td className="py-3 px-2 text-sm">
                {product.expiryDate}
              </td>
              <td className="py-3 px-2">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLowStockView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Current Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Minimum Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Stock Level</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Need to Order</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {lowStockData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2">
                <span className="font-medium">{item.currentStock} units</span>
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {item.minStock} units
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {item.percentage}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 font-medium text-red-600">
                {item.minStock - item.currentStock} units
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className={item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDamagedView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Loss Value</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Batch</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {damagedData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="font-medium">{item.name}</div>
                </div>
              </td>
              <td className="py-3 px-2 font-medium">
                {item.quantity} units
              </td>
              <td className="py-3 px-2 text-muted-foreground">
                {item.reason}
              </td>
              <td className="py-3 px-2 text-sm">
                {item.date}
              </td>
              <td className="py-3 px-2 font-medium text-red-600">
                {item.loss}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.batch}
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className="bg-red-100 text-red-800">
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExpiryView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Expiry Date</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Days Left</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Quantity</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Batch</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Supplier</th>
            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {expiryData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div className="font-medium">{item.name}</div>
                </div>
              </td>
              <td className="py-3 px-2 text-sm">
                {item.expiryDate}
              </td>
              <td className="py-3 px-2">
                <span className={`font-medium ${item.daysLeft <= 3 ? 'text-red-600' : item.daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                  {item.daysLeft} days
                </span>
              </td>
              <td className="py-3 px-2 font-medium">
                {item.quantity}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.batch}
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.supplier}
              </td>
              <td className="py-3 px-2 text-right">
                <Badge className={
                  item.status === 'Critical' ? 'bg-red-100 text-red-800' :
                  item.status === 'Warning' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {item.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStockAdjustmentView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Type</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Old Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">New Stock</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Difference</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Reason</th>
            <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
            <th className="text-right py-3 px-2 text-sm font-medium">User</th>
          </tr>
        </thead>
        <tbody>
          {stockAdjustmentData.map((item) => (
            <tr key={item.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                  <div className="font-medium">{item.product}</div>
                </div>
              </td>
              <td className="py-3 px-2">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.oldStock}
              </td>
              <td className="py-3 px-2 text-sm font-medium">
                {item.newStock}
              </td>
              <td className="py-3 px-2">
                <span className={`font-medium ${item.difference.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {item.difference}
                </span>
              </td>
              <td className="py-3 px-2 text-sm text-muted-foreground">
                {item.reason}
              </td>
              <td className="py-3 px-2 text-sm">
                {item.date}
              </td>
              <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                {item.user}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Function to get current view title
  const getCurrentViewTitle = () => {
    switch (currentView) {
      case "low-stock": return "Low Stock Items";
      case "damaged": return "Damaged Products";
      case "expiry": return "Products Nearing Expiry";
      case "stock-adjustment": return "Stock Adjustment History";
      default: return "Product Inventory Management";
    }
  };

  // Function to render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case "low-stock": return renderLowStockView();
      case "damaged": return renderDamagedView();
      case "expiry": return renderExpiryView();
      case "stock-adjustment": return renderStockAdjustmentView();
      default: return renderAllProductsView();
    }
  };

  // Calculate inventory totals
  const calculateInventoryTotals = () => {
    let totalValue = 0;
    let totalCostPrice = 0;
    let totalProfit = 0;

    productData.forEach(product => {
      // Calculate value and cost based on selling type
      if (product.sellingType === "Both") {
        // For products sold both ways, calculate based on available stock
        const boxValue = product.stockQuantity * product.pricePerBox;
        const weightValue = product.stockWeight * product.pricePerKg;
        const boxCost = product.stockQuantity * product.costPerBox;
        const weightCost = product.stockWeight * product.costPerKg;

        totalValue += boxValue + weightValue;
        totalCostPrice += boxCost + weightCost;
      } else if (product.sellingType === "Boxed") {
        // Only boxed sales
        const value = product.stockQuantity * product.pricePerBox;
        const cost = product.stockQuantity * product.costPerBox;

        totalValue += value;
        totalCostPrice += cost;
      } else if (product.sellingType === "Weight-based") {
        // Only weight-based sales
        const value = product.stockWeight * product.pricePerKg;
        const cost = product.stockWeight * product.costPerKg;

        totalValue += value;
        totalCostPrice += cost;
      }
    });

    totalProfit = totalValue - totalCostPrice;

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      totalCostPrice: Math.round(totalCostPrice * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: totalValue > 0 ? Math.round((totalProfit / totalValue) * 100 * 100) / 100 : 0
    };
  };

  const totals = calculateInventoryTotals();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Product Inventory</h1>
          <p className="text-muted-foreground">Manage fish products, stock levels, and pricing</p>
        </div>





        {/* Product Management Tabs */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="add">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="mr-2 h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{getCurrentViewTitle()}</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="flex flex-row gap-2 mb-6">
              {/* Search Input - takes remaining space */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Dropdown - fixed width */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0 px-3">
                    <Filter className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filter</span>
                    <ChevronDown className="h-4 w-4 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Package className="mr-2 h-4 w-4" />
                    Both (Boxed & Weight)
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Scale className="mr-2 h-4 w-4" />
                    Weight-based Only
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Package className="mr-2 h-4 w-4" />
                    Boxed Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Dropdown - fixed width */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0 px-3">
                    <Eye className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">View</span>
                    <ChevronDown className="h-4 w-4 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setCurrentView("all")}>
                    <Fish className="mr-2 h-4 w-4 text-blue-600" />
                    All Products
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("low-stock")}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                    Low Stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("damaged")}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                    Damaged
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("expiry")}>
                    <Calendar className="mr-2 h-4 w-4 text-orange-600" />
                    Expiry
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("stock-adjustment")}>
                    <RotateCcw className="mr-2 h-4 w-4 text-blue-600" />
                    Stock Adjustment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

                {/* Dynamic View Content */}
                {renderCurrentView()}
              </CardContent>
            </Card>

            {/* Inventory Summary Cards - Below Product List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Inventory Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Inventory Value */}
                <Card className="hover-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Inventory Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${totals.totalValue.toLocaleString()}
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Current selling price value
                    </p>
                  </CardContent>
                </Card>

                {/* Total Cost Price */}
                <Card className="hover-card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Cost Price</CardTitle>
                    <Calculator className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      ${totals.totalCostPrice.toLocaleString()}
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Total investment in stock
                    </p>
                  </CardContent>
                </Card>

                {/* Total Potential Profit */}
                <Card className="hover-card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Potential Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${totals.totalProfit.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      If all stock is sold
                    </p>
                  </CardContent>
                </Card>

                {/* Profit Margin */}
                <Card className={`hover-card border-2 ${
                  totals.profitMargin >= 30
                    ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800'
                    : totals.profitMargin >= 15
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={`text-sm font-medium ${
                      totals.profitMargin >= 30
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : totals.profitMargin >= 15
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      Profit Margin
                    </CardTitle>
                    <TrendingUp className={`h-4 w-4 ${
                      totals.profitMargin >= 30
                        ? 'text-emerald-600'
                        : totals.profitMargin >= 15
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      totals.profitMargin >= 30
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : totals.profitMargin >= 15
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {totals.profitMargin}%
                    </div>
                    <p className={`text-xs ${
                      totals.profitMargin >= 30
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : totals.profitMargin >= 15
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {totals.profitMargin >= 30 && "Excellent margin"}
                      {totals.profitMargin >= 15 && totals.profitMargin < 30 && "Good margin"}
                      {totals.profitMargin < 15 && "Low margin"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Add Product Tab Content */}
          <TabsContent value="add" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add New Product Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Fish className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Add New Fish Product</h3>
                    <p className="text-xs text-muted-foreground">
                      Create and add a brand new fish product to your comprehensive inventory system with complete product details, pricing, and specifications
                    </p>
                  </div>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Fish Product</DialogTitle>
                        <DialogDescription>
                          Create a new fish product with complete details, pricing, and specifications.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>

                            <div className="space-y-2">
                              <Label htmlFor="productName">Product Name *</Label>
                              <Input id="productName" placeholder="e.g., Atlantic Salmon" required />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="category">Category *</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="premium">Premium Fish</SelectItem>
                                  <SelectItem value="freshwater">Fresh Water Fish</SelectItem>
                                  <SelectItem value="processed">Processed Fish</SelectItem>
                                  <SelectItem value="white">White Fish</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="supplier">Supplier *</Label>
                              <Input id="supplier" placeholder="e.g., Ocean Fresh Ltd" required />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea id="description" placeholder="Product description..." rows={3} />
                            </div>
                          </div>

                          {/* Selling & Pricing */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Selling & Pricing</h3>

                            <div className="space-y-2">
                              <Label htmlFor="sellingType">Selling Method *</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select selling method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="both">Both (Boxed & Weight)</SelectItem>
                                  <SelectItem value="weight">Weight-based Only</SelectItem>
                                  <SelectItem value="boxed">Boxed Only</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="pricePerKg">Price per Kg ($)</Label>
                                <Input id="pricePerKg" type="number" step="0.01" placeholder="0.00" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="pricePerBox">Price per Box ($)</Label>
                                <Input id="pricePerBox" type="number" step="0.01" placeholder="0.00" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="boxWeight">Box Weight (if applicable)</Label>
                              <Input id="boxWeight" placeholder="e.g., 1.5 kg" />
                            </div>
                          </div>
                        </div>

                        {/* Stock Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Stock Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="stockQuantity">Stock Quantity (boxes)</Label>
                              <Input id="stockQuantity" type="number" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="stockWeight">Stock Weight (kg)</Label>
                              <Input id="stockWeight" type="number" step="0.1" placeholder="0.0" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiryDate">Expiry Date</Label>
                              <Input id="expiryDate" type="date" />
                            </div>
                          </div>
                        </div>
                      </form>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          <Save className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Add New Stock Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Add Fresh Stock Inventory</h3>
                    <p className="text-xs text-muted-foreground">
                      Increase and replenish inventory stock levels for existing fish products with new arrivals, deliveries, and fresh stock supplies
                    </p>
                  </div>
                  <Dialog open={isAddStockOpen} onOpenChange={(open) => {
                    if (open) {
                      setIsAddStockOpen(true);
                    } else {
                      handleCloseAddStock();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Stock
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                      <DialogHeader className="pb-3">
                        <DialogTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Add Fresh Stock
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                          Add stock using manual entry or scan documents.
                        </DialogDescription>
                      </DialogHeader>

                      {/* Input Method Toggle */}
                      <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md">
                        <Button
                          type="button"
                          variant={!isOcrMode ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setIsOcrMode(false)}
                          className="gap-1 h-8 px-3 text-xs"
                        >
                          <FileText className="h-3 w-3" />
                          Manual
                        </Button>
                        <Button
                          type="button"
                          variant={isOcrMode ? "default" : "ghost"}
                          size="sm"
                          onClick={toggleOcrMode}
                          className="gap-1 h-8 px-3 text-xs"
                        >
                          <Scan className="h-3 w-3" />
                          OCR Scan
                        </Button>
                      </div>

                      <form className="space-y-3">
                        {isOcrMode ? (
                          /* OCR Mode */
                          <div className="space-y-3">
                            {!ocrImagePreview ? (
                              /* Image Upload Section */
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4">
                                <div className="text-center space-y-3">
                                  <div className="mx-auto w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                                    <Camera className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-xs font-medium">Upload Document</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Photo or image of stock document
                                    </p>
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => document.getElementById('ocr-file-input')?.click()}
                                      className="gap-1 h-8 px-3 text-xs"
                                    >
                                      <Upload className="h-3 w-3" />
                                      File
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCameraCapture}
                                      className="gap-1 h-8 px-3 text-xs"
                                    >
                                      <Camera className="h-3 w-3" />
                                      Camera
                                    </Button>
                                  </div>
                                  <input
                                    id="ocr-file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Image Preview and Processing */
                              <div className="space-y-3">
                                <div className="relative">
                                  <img
                                    src={ocrImagePreview}
                                    alt="Stock document"
                                    className="w-full h-32 object-cover rounded-md border"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={clearOcrData}
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>

                                {!ocrResults && !isProcessingOcr && (
                                  <Button
                                    type="button"
                                    onClick={processOcrImage}
                                    className="w-full gap-1 h-8 text-xs"
                                  >
                                    <Scan className="h-3 w-3" />
                                    Process Document
                                  </Button>
                                )}

                                {isProcessingOcr && (
                                  <div className="text-center py-2">
                                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                      Processing...
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Form Fields - shown in manual mode or after OCR processing */}
                        {(!isOcrMode || ocrResults) && (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label htmlFor="stockProduct" className="text-xs font-medium">Product *</Label>
                              <Select defaultValue={ocrResults?.productName?.toLowerCase().replace(' ', '-')}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Choose product" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="salmon">Atlantic Salmon</SelectItem>
                                  <SelectItem value="trout">Rainbow Trout</SelectItem>
                                  <SelectItem value="tilapia">Tilapia Fillets</SelectItem>
                                  <SelectItem value="seabass">Sea Bass</SelectItem>
                                  <SelectItem value="cod">Cod Fillets</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor="addQuantity" className="text-xs font-medium">Quantity</Label>
                                <Input
                                  id="addQuantity"
                                  type="number"
                                  placeholder="0"
                                  className="h-8 text-xs"
                                  defaultValue={ocrResults?.quantity || ""}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="addWeight" className="text-xs font-medium">Weight (kg)</Label>
                                <Input
                                  id="addWeight"
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  className="h-8 text-xs"
                                  defaultValue={ocrResults?.weight || ""}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor="deliveryDate" className="text-xs font-medium">Delivery</Label>
                                <Input id="deliveryDate" type="date" className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="newExpiryDate" className="text-xs font-medium">Expiry</Label>
                                <Input
                                  id="newExpiryDate"
                                  type="date"
                                  className="h-8 text-xs"
                                  defaultValue={ocrResults?.expiryDate || ""}
                                />
                              </div>
                            </div>

                            {ocrResults && (
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                                  <Scan className="h-3 w-3" />
                                  <span className="font-medium">OCR Data Extracted</span>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                                  Review and modify as needed.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </form>
                      <DialogFooter className="gap-2 pt-3">
                        <Button type="button" variant="outline" onClick={handleCloseAddStock} className="h-8 px-3 text-xs">
                          Cancel
                        </Button>
                        {(!isOcrMode || ocrResults) && (
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs">
                            <Package className="mr-1 h-3 w-3" />
                            Add Stock
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Add Damaged Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Record Damaged Products</h3>
                    <p className="text-xs text-muted-foreground">
                      Document and record damaged, spoiled, or compromised fish products and automatically remove them from available sellable inventory
                    </p>
                  </div>
                  <Dialog open={isAddDamagedOpen} onOpenChange={setIsAddDamagedOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Damaged
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Record Damaged Products</DialogTitle>
                        <DialogDescription>
                          Document damaged products and remove them from available inventory.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="damagedProduct">Select Product *</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose product" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="salmon">Atlantic Salmon</SelectItem>
                                <SelectItem value="trout">Rainbow Trout</SelectItem>
                                <SelectItem value="tilapia">Tilapia Fillets</SelectItem>
                                <SelectItem value="seabass">Sea Bass</SelectItem>
                                <SelectItem value="cod">Cod Fillets</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="damagedQuantity">Damaged Quantity</Label>
                              <Input id="damagedQuantity" type="number" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="damagedWeight">Damaged Weight (kg)</Label>
                              <Input id="damagedWeight" type="number" step="0.1" placeholder="0.0" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="damageReason">Damage Reason *</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="transit">Damaged in Transit</SelectItem>
                                <SelectItem value="freezer">Freezer Malfunction</SelectItem>
                                <SelectItem value="quality">Quality Issues</SelectItem>
                                <SelectItem value="handling">Poor Handling</SelectItem>
                                <SelectItem value="contamination">Contamination</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="estimatedLoss">Estimated Loss Value ($)</Label>
                            <Input id="estimatedLoss" type="number" step="0.01" placeholder="0.00" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="damageBatch">Batch Number</Label>
                            <Input id="damageBatch" placeholder="e.g., AS-2024-003" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="damageAction">Action Taken</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="disposed">Disposed</SelectItem>
                                <SelectItem value="returned">Returned to Supplier</SelectItem>
                                <SelectItem value="insurance">Insurance Claim</SelectItem>
                                <SelectItem value="partial">Partial Recovery</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="damageNotes">Additional Notes</Label>
                            <Textarea id="damageNotes" placeholder="Describe the damage and circumstances..." rows={3} />
                          </div>
                        </div>
                      </form>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDamagedOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Record Damage
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Add Expired Square */}
              <Card className="hover-card aspect-square">
                <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Mark Expired Products</h3>
                    <p className="text-xs text-muted-foreground">
                      Identify and mark fish products that have reached their expiration date and handle proper disposal, return, or waste management procedures
                    </p>
                  </div>
                  <Dialog open={isAddExpiredOpen} onOpenChange={setIsAddExpiredOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Expired
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Mark Expired Products</DialogTitle>
                        <DialogDescription>
                          Mark products as expired and handle disposal or return procedures.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiredProduct">Select Product *</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose product" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="salmon">Atlantic Salmon</SelectItem>
                                <SelectItem value="trout">Rainbow Trout</SelectItem>
                                <SelectItem value="tilapia">Tilapia Fillets</SelectItem>
                                <SelectItem value="seabass">Sea Bass</SelectItem>
                                <SelectItem value="cod">Cod Fillets</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="expiredQuantity">Expired Quantity</Label>
                              <Input id="expiredQuantity" type="number" placeholder="0" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiredWeight">Expired Weight (kg)</Label>
                              <Input id="expiredWeight" type="number" step="0.1" placeholder="0.0" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="originalExpiryDate">Original Expiry Date</Label>
                            <Input id="originalExpiryDate" type="date" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="discoveryDate">Discovery Date</Label>
                            <Input id="discoveryDate" type="date" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiredBatch">Batch Number</Label>
                            <Input id="expiredBatch" placeholder="e.g., CF-2024-001" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="disposalMethod">Disposal Method</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select disposal method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="waste">Waste Disposal</SelectItem>
                                <SelectItem value="compost">Composting</SelectItem>
                                <SelectItem value="return">Return to Supplier</SelectItem>
                                <SelectItem value="donation">Donation (if safe)</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lossValue">Loss Value ($)</Label>
                            <Input id="lossValue" type="number" step="0.01" placeholder="0.00" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiredNotes">Notes</Label>
                            <Textarea id="expiredNotes" placeholder="Additional details about the expired products..." rows={3} />
                          </div>
                        </div>
                      </form>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddExpiredOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                          <Calendar className="mr-2 h-4 w-4" />
                          Mark as Expired
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Tab Content */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Audit Trail</CardTitle>
                <p className="text-sm text-muted-foreground">Track all inventory changes and system activities</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Audit Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input placeholder="Search audit logs..." className="pl-10" />
                      </div>
                    </div>
                    <Select>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="add">Product Added</SelectItem>
                        <SelectItem value="update">Product Updated</SelectItem>
                        <SelectItem value="delete">Product Deleted</SelectItem>
                        <SelectItem value="stock">Stock Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Audit Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Timestamp</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Action</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Product</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">User</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Changes</th>
                          <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 14:30:15</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-green-600">
                              Stock Added
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Atlantic Salmon</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">John Smith</td>
                          <td className="py-3 px-2 text-sm">+25.0 kg added to inventory</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 13:15:42</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-blue-600">
                              Product Updated
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Sea Bass</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Sarah Johnson</td>
                          <td className="py-3 px-2 text-sm">Price updated: $20.00 → $22.00/kg</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-blue-100 text-blue-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-22 11:45:20</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-purple-600">
                              Product Added
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Rainbow Trout</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Mike Wilson</td>
                          <td className="py-3 px-2 text-sm">New product added to inventory</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-purple-100 text-purple-800">Success</Badge>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">2024-01-21 16:20:33</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="text-red-600">
                              Stock Removed
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium">Tilapia Fillets</td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Sarah Johnson</td>
                          <td className="py-3 px-2 text-sm">-12 boxes (damaged goods)</td>
                          <td className="py-3 px-2 text-right">
                            <Badge className="bg-red-100 text-red-800">Success</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProductInventory;
