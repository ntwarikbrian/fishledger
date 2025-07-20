import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, Loader2 } from "lucide-react";
import { PAYMENT_METHODS, PAYMENT_STATUSES, DEPOSIT_TYPES } from "@/types/transaction";
import type { TransactionFilters } from "@/types/transaction";

interface TransactionFiltersProps {
  searchTerm: string;
  filters: TransactionFilters;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof TransactionFilters, value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
}

/**
 * Transaction filters and search component
 * Provides filtering and search functionality for transactions
 */
export const TransactionFiltersCard: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  filters,
  loading,
  onSearchChange,
  onFilterChange,
  onSearch,
  onClearFilters,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Transactions</Label>
            <div className="relative">
              {loading ? (
                <Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="search"
                placeholder="Search by product, client, reference..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select
              value={filters.payment_status || 'all'}
              onValueChange={(value) => onFilterChange('payment_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={filters.payment_method || 'all'}
              onValueChange={(value) => onFilterChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deposit Type</Label>
            <Select
              value={filters.deposit_type || 'all'}
              onValueChange={(value) => onFilterChange('deposit_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DEPOSIT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button onClick={onClearFilters} variant="outline" disabled={loading}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
