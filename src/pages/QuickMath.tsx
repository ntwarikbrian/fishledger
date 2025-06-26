import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  DollarSign,
  Package,
  Scale,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Fish,
  Truck,
  Plus,
  Target,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const QuickMath = () => {
  // Form state for input fields
  const [fishType, setFishType] = useState("");
  const [buyingFormat, setBuyingFormat] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitWeight, setUnitWeight] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // Calculated results state
  const [results, setResults] = useState({
    totalWeight: 0,
    costPerKg: 0,
    potentialRevenue: 0,
    estimatedProfit: 0,
    profitMargin: 0,
    totalCost: 0
  });

  // Fish types for dropdown
  const fishTypes = [
    "Atlantic Salmon",
    "Sea Bass",
    "Tilapia Fillets",
    "Rainbow Trout",
    "Cod Fillets",
    "Mackerel",
    "Tuna",
    "Snapper",
    "Halibut",
    "Sardines"
  ];

  // Calculate results whenever inputs change
  useEffect(() => {
    calculateResults();
  }, [fishType, buyingFormat, unitPrice, quantity, unitWeight, deliveryFee, additionalCosts, sellingPrice]);

  const calculateResults = () => {
    try {
      const price = parseFloat(unitPrice) || 0;
      const qty = parseFloat(quantity) || 0;
      const weight = parseFloat(unitWeight) || 0;
      const delivery = parseFloat(deliveryFee) || 0;
      const additional = parseFloat(additionalCosts) || 0;
      const selling = parseFloat(sellingPrice) || 0;

      let totalWeight = 0;
      let totalCost = 0;

      if (buyingFormat === "kg") {
        // If buying by kg, quantity is the total weight
        totalWeight = qty;
        totalCost = (price * qty) + delivery + additional;
      } else if (buyingFormat === "box" && weight > 0) {
        // If buying by box, calculate total weight from boxes
        totalWeight = qty * weight;
        totalCost = (price * qty) + delivery + additional;
      }

      const costPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;
      const potentialRevenue = selling * totalWeight;
      const estimatedProfit = potentialRevenue - totalCost;
      const profitMargin = potentialRevenue > 0 ? (estimatedProfit / potentialRevenue) * 100 : 0;

      setResults({
        totalWeight: Math.round(totalWeight * 100) / 100,
        costPerKg: Math.round(costPerKg * 100) / 100,
        potentialRevenue: Math.round(potentialRevenue * 100) / 100,
        estimatedProfit: Math.round(estimatedProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100
      });
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  const resetForm = () => {
    setFishType("");
    setBuyingFormat("");
    setUnitPrice("");
    setQuantity("");
    setUnitWeight("");
    setDeliveryFee("");
    setAdditionalCosts("");
    setSellingPrice("");
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return "text-green-600 bg-green-50 border-green-200";
    if (margin >= 15) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getProfitMarginIcon = (margin: number) => {
    if (margin >= 30) return <CheckCircle className="h-4 w-4" />;
    if (margin >= 15) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const isFormValid = fishType && buyingFormat && unitPrice && quantity && sellingPrice && 
                     (buyingFormat === "kg" || (buyingFormat === "box" && unitWeight));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Clean Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quick Math Calculator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Make smarter purchasing decisions with instant profit calculations and cost analysis
          </p>
        </div>

        {/* Main Calculator Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Section - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2 space-y-6">
            {/* Product Information Card */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Fish className="h-5 w-5 text-blue-600" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fish Type */}
                  <div className="space-y-2">
                    <Label htmlFor="fishType" className="text-sm font-medium">Fish Type *</Label>
                    <Select value={fishType} onValueChange={setFishType}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose fish type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fishTypes.map((fish) => (
                          <SelectItem key={fish} value={fish}>
                            {fish}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Buying Format */}
                  <div className="space-y-2">
                    <Label htmlFor="buyingFormat" className="text-sm font-medium">Buying Format *</Label>
                    <Select value={buyingFormat} onValueChange={setBuyingFormat}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            By Weight (kg)
                          </div>
                        </SelectItem>
                        <SelectItem value="box">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            By Box
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Details Card */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Purchase Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Unit Price */}
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice" className="text-sm font-medium">
                      Unit Price * {buyingFormat && `(${buyingFormat === "kg" ? "per kg" : "per box"})`}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Quantity * {buyingFormat && `(${buyingFormat === "kg" ? "kg" : "boxes"})`}
                    </Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Unit Weight (only for boxes) */}
                {buyingFormat === "box" && (
                  <div className="space-y-2">
                    <Label htmlFor="unitWeight" className="text-sm font-medium">Weight per Box (kg) *</Label>
                    <div className="relative max-w-xs">
                      <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="unitWeight"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={unitWeight}
                        onChange={(e) => setUnitWeight(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Costs Card */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Additional Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery Fee */}
                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee" className="text-sm font-medium">Delivery Fee</Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deliveryFee"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  {/* Additional Costs */}
                  <div className="space-y-2">
                    <Label htmlFor="additionalCosts" className="text-sm font-medium">Other Costs</Label>
                    <div className="relative">
                      <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="additionalCosts"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={additionalCosts}
                        onChange={(e) => setAdditionalCosts(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selling Price Card */}
            <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                  Target Selling Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price per kg *</Label>
                  <div className="relative max-w-xs">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="pl-10 h-11 text-lg font-semibold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Button */}
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex items-center gap-2 px-6 py-2 h-11"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Calculator
              </Button>
            </div>
          </div>

          {/* Results Panel - Sticky on xl screens */}
          <div className="xl:col-span-1 space-y-6">
            <div className="xl:sticky xl:top-6">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    Live Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isFormValid ? (
                    <div className="flex items-center justify-center h-80 text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
                          <Calculator className="h-12 w-12 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">Ready to Calculate</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Fill in the required fields to see instant results
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Scale className="h-5 w-5" />
                            <span className="text-sm font-medium opacity-90">Total Weight</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {results.totalWeight} kg
                          </p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5" />
                            <span className="text-sm font-medium opacity-90">Cost per Kg</span>
                          </div>
                          <p className="text-3xl font-bold">
                            ${results.costPerKg}
                          </p>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="space-y-3">
                        <Separator />
                        <h4 className="font-semibold text-center text-gray-700 dark:text-gray-300">Financial Breakdown</h4>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <span className="text-sm font-medium">Total Cost:</span>
                            <span className="font-bold text-lg">${results.totalCost}</span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="text-sm font-medium">Revenue:</span>
                            <span className="font-bold text-lg text-green-600">${results.potentialRevenue}</span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-sm font-medium">Profit:</span>
                            <span className={`font-bold text-lg ${results.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${results.estimatedProfit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Profit Margin Highlight */}
                      <div className={`p-6 rounded-xl border-2 text-center ${getProfitMarginColor(results.profitMargin)}`}>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          {getProfitMarginIcon(results.profitMargin)}
                          <span className="font-semibold text-lg">Profit Margin</span>
                        </div>
                        <div className="text-4xl font-bold mb-3">
                          {results.profitMargin}%
                        </div>
                        <p className="text-sm font-medium">
                          {results.profitMargin >= 30 && "🎉 Excellent! Great purchase opportunity"}
                          {results.profitMargin >= 15 && results.profitMargin < 30 && "👍 Good margin, consider optimizing"}
                          {results.profitMargin < 15 && "⚠️ Low margin, review pricing"}
                        </p>
                      </div>

                      {/* Quick Insights */}
                      <div className="space-y-3">
                        <Separator />
                        <h4 className="font-semibold text-center text-gray-700 dark:text-gray-300">Quick Insights</h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                            <span>Break-even price:</span>
                            <span className="font-semibold">${results.costPerKg}/kg</span>
                          </div>
                          {results.totalWeight > 0 && (
                            <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                              <span>Investment per kg:</span>
                              <span className="font-semibold">${(results.totalCost / results.totalWeight).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Smart Tips - Simplified */}
        <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Info className="h-6 w-6 text-indigo-600" />
              Smart Purchasing Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">Profit Margins</h4>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <div>🟢 30%+ Excellent</div>
                  <div>🟡 15-30% Good</div>
                  <div>🔴 {"<"}15% Risky</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Cost Factors</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <div>📦 Delivery fees</div>
                  <div>🏪 Storage costs</div>
                  <div>⚠️ Spoilage risk</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit mx-auto">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Strategy</h4>
                <div className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <div>💰 Check competitors</div>
                  <div>📅 Seasonal demand</div>
                  <div>⚡ Quick turnover</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default QuickMath;
