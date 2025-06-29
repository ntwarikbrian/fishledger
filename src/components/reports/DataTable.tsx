import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Column definition interface
export interface DataTableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

// Sort configuration
interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  title?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

/**
 * DataTable Component
 * 
 * A comprehensive data table component with sorting, searching, and pagination
 * functionality for displaying report data.
 * 
 * Features:
 * - Column-based sorting (ascending/descending)
 * - Global search functionality
 * - Pagination with configurable page sizes
 * - Custom cell rendering
 * - Responsive design
 * - Loading states
 * - Empty state handling
 */
const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  pageSize = 10,
  className,
  emptyMessage = "No data available",
  loading = false
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row => {
      return columns.some(column => {
        if (!column.searchable) return false;
        
        const value = row[column.key];
        if (value == null) return false;
        
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, sortedData.length);

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      } else {
        return { key: columnKey, direction: 'asc' };
      }
    });
  };

  // Get sort icon for column
  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when search or items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <Card className={cn("w-full", className)}>
      {/* Header with title and search */}
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          {title && (
            <CardTitle className="text-base sm:text-lg font-semibold">{title}</CardTitle>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-3">
            {/* Search input - full width on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>

            {/* Items per page selector */}
            <div className="flex justify-end">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table */}
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      column.className,
                      column.sortable && "cursor-pointer hover:bg-muted/50 select-none"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                paginatedData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && sortedData.length > 0 && (
          <div className="flex flex-col gap-4 p-4 border-t">
            {/* Results info */}
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {startItem} to {endItem} of {sortedData.length} entries
              {filteredData.length !== data.length && (
                <span className="block sm:inline"> (filtered from {data.length} total entries)</span>
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-2">
                <span className="text-xs sm:text-sm">Page</span>
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  {currentPage} of {totalPages}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
