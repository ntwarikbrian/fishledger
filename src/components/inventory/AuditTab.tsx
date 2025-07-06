/**
 * AuditTab Component
 * Handles the inventory audit trail functionality
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const AuditTab: React.FC = () => {
  return (
    <div className="space-y-4">
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
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-21 14:55:18</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-orange-600">
                        Category Created
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">-</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">Admin User</td>
                    <td className="py-3 px-2 text-sm">New category "Premium Fish" created</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-orange-100 text-orange-800">Success</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-21 12:30:45</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-yellow-600">
                        Price Updated
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">Cod Fillets</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">John Smith</td>
                    <td className="py-3 px-2 text-sm">Cost price: $15.00 → $16.50/kg</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">Success</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-21 10:15:22</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-indigo-600">
                        Supplier Updated
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">Atlantic Salmon</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">Sarah Johnson</td>
                    <td className="py-3 px-2 text-sm">Supplier changed to "Ocean Fresh Ltd"</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-indigo-100 text-indigo-800">Success</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-20 16:45:33</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-red-600">
                        Product Expired
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">Mackerel Fillets</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">Mike Wilson</td>
                    <td className="py-3 px-2 text-sm">8 boxes marked as expired</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-red-100 text-red-800">Success</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-20 14:20:15</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-green-600">
                        Bulk Import
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">Multiple Products</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">Admin User</td>
                    <td className="py-3 px-2 text-sm">15 products imported from CSV</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-green-100 text-green-800">Success</Badge>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 text-sm">2024-01-20 11:30:08</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="text-blue-600">
                        Stock Adjustment
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-medium">Sea Bass</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">John Smith</td>
                    <td className="py-3 px-2 text-sm">Manual adjustment: +5 boxes (recount)</td>
                    <td className="py-3 px-2 text-right">
                      <Badge className="bg-blue-100 text-blue-800">Success</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination or Load More */}
            <div className="flex justify-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing 10 of 156 audit entries
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTab;
