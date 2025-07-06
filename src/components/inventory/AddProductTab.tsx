/**
 * AddProductTab Component
 * Handles all product addition functionality including new products, stock, damaged, and expired items
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Fish, AlertTriangle, Calendar, Plus, Package, Save, Camera, Scan, Upload, X } from "lucide-react";

interface AddProductTabProps {
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  isAddStockOpen: boolean;
  setIsAddStockOpen: (open: boolean) => void;
  isAddDamagedOpen: boolean;
  setIsAddDamagedOpen: (open: boolean) => void;
  isAddExpiredOpen: boolean;
  setIsAddExpiredOpen: (open: boolean) => void;
  isOcrMode: boolean;
  setIsOcrMode: (mode: boolean) => void;
  ocrImage: File | null;
  setOcrImage: (image: File | null) => void;
  ocrResults: any;
  setOcrResults: (results: any) => void;
  isProcessingOcr: boolean;
  setIsProcessingOcr: (processing: boolean) => void;
  processOcrImage: () => void;
  handleCloseAddStock: () => void;
}

const AddProductTab: React.FC<AddProductTabProps> = ({
  isAddProductOpen,
  setIsAddProductOpen,
  isAddStockOpen,
  setIsAddStockOpen,
  isAddDamagedOpen,
  setIsAddDamagedOpen,
  isAddExpiredOpen,
  setIsAddExpiredOpen,
  isOcrMode,
  setIsOcrMode,
  ocrImage,
  setOcrImage,
  ocrResults,
  setOcrResults,
  isProcessingOcr,
  setIsProcessingOcr,
  processOcrImage,
  handleCloseAddStock,
}) => {
  return (
    <div className="space-y-6">
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

                    {/* Pricing & Stock */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Pricing & Stock</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="costPrice">Cost Price ($) *</Label>
                          <Input id="costPrice" type="number" step="0.01" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
                          <Input id="sellingPrice" type="number" step="0.01" placeholder="0.00" required />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="initialStock">Initial Stock</Label>
                          <Input id="initialStock" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initialWeight">Initial Weight (kg)</Label>
                          <Input id="initialWeight" type="number" step="0.1" placeholder="0.0" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minStock">Min Stock Level</Label>
                          <Input id="minStock" type="number" placeholder="5" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxStock">Max Stock Level</Label>
                          <Input id="maxStock" type="number" placeholder="100" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input id="expiryDate" type="date" />
                      </div>
                    </div>
                  </div>

                  {/* Product Specifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Product Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="origin">Origin</Label>
                        <Input id="origin" placeholder="e.g., Atlantic Ocean" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="processingType">Processing Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fresh">Fresh</SelectItem>
                            <SelectItem value="frozen">Frozen</SelectItem>
                            <SelectItem value="smoked">Smoked</SelectItem>
                            <SelectItem value="dried">Dried</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="packaging">Packaging Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select packaging" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="bag">Bag</SelectItem>
                            <SelectItem value="tray">Tray</SelectItem>
                            <SelectItem value="bulk">Bulk</SelectItem>
                          </SelectContent>
                        </Select>
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

        {/* Add Stock Square */}
        <Card className="hover-card aspect-square">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Add Stock to Existing Product</h3>
              <p className="text-xs text-muted-foreground">
                Increase inventory levels for existing fish products when new shipments arrive or stock is replenished from suppliers
              </p>
            </div>
            <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Add Stock to Product
                  </DialogTitle>
                  <DialogDescription>
                    Add new stock to an existing product. Use OCR to scan delivery documents for faster data entry.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">OCR Mode</span>
                    </div>
                    <Button
                      type="button"
                      variant={isOcrMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsOcrMode(!isOcrMode)}
                      className="h-7 px-3 text-xs"
                    >
                      {isOcrMode ? "Enabled" : "Enable"}
                    </Button>
                  </div>

                  {/* OCR Section */}
                  {isOcrMode ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Scan Delivery Document</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.capture = 'environment';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) setOcrImage(file);
                              };
                              input.click();
                            }}
                          >
                            <Camera className="mr-1 h-3 w-3" />
                            Take Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) setOcrImage(file);
                              };
                              input.click();
                            }}
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            Upload
                          </Button>
                        </div>
                      </div>

                      {ocrImage && (
                        <div className="space-y-2">
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(ocrImage)}
                              alt="OCR Document"
                              className="w-full h-32 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setOcrImage(null);
                                setOcrResults(null);
                              }}
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
                      <Label htmlFor="damageNotes">Notes</Label>
                      <Textarea id="damageNotes" placeholder="Additional details about the damage..." rows={3} />
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
              <h3 className="text-base font-semibold">Mark Products as Expired</h3>
              <p className="text-xs text-muted-foreground">
                Record expired fish products that have passed their sell-by date and need to be removed from active inventory for food safety compliance
              </p>
            </div>
            <Dialog open={isAddExpiredOpen} onOpenChange={setIsAddExpiredOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-4">
                  <Plus className="mr-1 h-3 w-3" />
                  Mark Expired
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Mark Products as Expired</DialogTitle>
                  <DialogDescription>
                    Record expired products and remove them from available inventory.
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
                      <Label htmlFor="actualExpiryDate">Actual Expiry Date *</Label>
                      <Input id="actualExpiryDate" type="date" required />
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
    </div>
  );
};

export default AddProductTab;
