"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Download, Filter, Eye, Search, X } from "lucide-react"

// Types for the data grid
export interface Column<T = any> {
  key: string
  header: string
  accessor: keyof T | ((row: T) => any)
  filterable?: boolean
  filterType?: "text" | "boolean" | "select"
  filterOptions?: { label: string; value: any }[]
  sortable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
}

export interface DataGridProps<T = any> {
  data: T[]
  columns: Column<T>[]
  title?: string
  searchable?: boolean
  exportable?: boolean
  selectable?: boolean
  pageSize?: number
  className?: string
  onSelectionChange?: (selectedRows: T[]) => void
}

// Utility function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

// CSV export utility
const exportToCSV = (data: any[], columns: Column[], filename = "data") => {
  const headers = columns.map((col) => col.header).join(",")
  const rows = data
    .map((row) =>
      columns
        .map((col) => {
          const value =
            typeof col.accessor === "function" ? col.accessor(row) : getNestedValue(row, col.accessor as string)
          return `"${String(value || "").replace(/"/g, '""')}"`
        })
        .join(","),
    )
    .join("\n")

  const csv = `${headers}\n${rows}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  title = "Data Grid",
  searchable = true,
  exportable = true,
  selectable = true,
  pageSize: initialPageSize = 10,
  className = "",
  onSelectionChange,
}: DataGridProps<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string | boolean | null>>({})
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
  )
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize || 10)

  // Get visible columns
  const displayColumns = useMemo(() => columns.filter((col) => visibleColumns[col.key]), [columns, visibleColumns])

  // Filter and search data
  const handleColumnFilter = useCallback((columnKey: string, value: string | boolean | null) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }))
    setCurrentPage(1) // Reset to first page when filtering
  }, [])

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search filter
    if (searchTerm && searchable) {
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value =
            typeof col.accessor === "function" ? col.accessor(row) : getNestedValue(row, col.accessor as string)
          return String(value || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        }),
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue !== null && filterValue !== undefined && filterValue !== "") {
        const column = columns.find((col) => col.key === columnKey)
        if (column) {
          filtered = filtered.filter((row) => {
            const value =
              typeof column.accessor === "function"
                ? column.accessor(row)
                : getNestedValue(row, column.accessor as string)

            // Handle boolean filters
            if (column.filterType === "boolean") {
              return value === filterValue
            }

            // Handle select filters
            if (column.filterType === "select") {
              return value === filterValue
            }

            // Handle text filters (default)
            return String(value || "")
              .toLowerCase()
              .includes(String(filterValue).toLowerCase())
          })
        }
      }
    })

    return filtered
  }, [data, searchTerm, columnFilters, columns, searchable])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIndices = new Set(paginatedData.map((_, index) => (currentPage - 1) * pageSize + index))
        setSelectedRows(allIndices)
      } else {
        setSelectedRows(new Set())
      }
    },
    [paginatedData, currentPage, pageSize],
  )

  const handleSelectRow = useCallback(
    (index: number, checked: boolean) => {
      const actualIndex = (currentPage - 1) * pageSize + index
      const newSelected = new Set(selectedRows)
      if (checked) {
        newSelected.add(actualIndex)
      } else {
        newSelected.delete(actualIndex)
      }
      setSelectedRows(newSelected)
    },
    [selectedRows, currentPage, pageSize],
  )

  // Update parent component when selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(selectedRows)
        .map((index) => filteredData[index])
        .filter(Boolean)
      onSelectionChange(selectedData)
    }
  }, [selectedRows, filteredData, onSelectionChange])

  // Clear filter handler
  const clearColumnFilter = useCallback((columnKey: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnKey]
      return newFilters
    })
  }, [])

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }, [])

  // Export handler
  const handleExport = useCallback(() => {
    const selectedData =
      selectedRows.size > 0
        ? Array.from(selectedRows)
            .map((index) => filteredData[index])
            .filter(Boolean)
        : filteredData
    exportToCSV(selectedData, displayColumns, title.toLowerCase().replace(/\s+/g, "-"))
  }, [selectedRows, filteredData, displayColumns, title])

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((_, index) => selectedRows.has((currentPage - 1) * pageSize + index))
  const isIndeterminate =
    paginatedData.some((_, index) => selectedRows.has((currentPage - 1) * pageSize + index)) && !isAllSelected

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
            )}

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns[column.key]}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {Object.entries(columnFilters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {Object.entries(columnFilters).map(([columnKey, value]) => {
              const column = columns.find((col) => col.key === columnKey)
              return (
                <Badge key={columnKey} variant="secondary" className="gap-1">
                  {column?.header}: {value}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearColumnFilter(columnKey)} />
                </Badge>
              )
            })}
          </div>
        )}

        {/* Selection Info */}
        {selectable && selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} of {filteredData.length} rows selected
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={isIndeterminate ? "data-[state=checked]:bg-primary" : ""}
                    />
                  </TableHead>
                )}
                {displayColumns.map((column) => (
                  <TableHead key={column.key} style={{ width: column.width }} className="relative">
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.filterable && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Filter
                                className={`h-3 w-3 ${columnFilters[column.key] !== undefined && columnFilters[column.key] !== null && columnFilters[column.key] !== "" ? "text-primary" : ""}`}
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[200px]">
                            <div className="p-2">
                              {column.filterType === "boolean" ? (
                                <div className="space-y-2">
                                  <Button
                                    variant={
                                      columnFilters[column.key] === null || columnFilters[column.key] === undefined
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleColumnFilter(column.key, null)}
                                  >
                                    All
                                  </Button>
                                  <Button
                                    variant={columnFilters[column.key] === true ? "default" : "outline"}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleColumnFilter(column.key, true)}
                                  >
                                    True
                                  </Button>
                                  <Button
                                    variant={columnFilters[column.key] === false ? "default" : "outline"}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleColumnFilter(column.key, false)}
                                  >
                                    False
                                  </Button>
                                </div>
                              ) : column.filterType === "select" && column.filterOptions ? (
                                <div className="space-y-2">
                                  <Button
                                    variant={
                                      columnFilters[column.key] === null || columnFilters[column.key] === undefined
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => handleColumnFilter(column.key, null)}
                                  >
                                    All
                                  </Button>
                                  {column.filterOptions.map((option) => (
                                    <Button
                                      key={option.value}
                                      variant={columnFilters[column.key] === option.value ? "default" : "outline"}
                                      size="sm"
                                      className="w-full justify-start"
                                      onClick={() => handleColumnFilter(column.key, option.value)}
                                    >
                                      {option.label}
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <Input
                                  placeholder={`Filter ${column.header}...`}
                                  value={columnFilters[column.key] || ""}
                                  onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                                />
                              )}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + (selectable ? 1 : 0)} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const actualIndex = (currentPage - 1) * pageSize + index
                  const isSelected = selectedRows.has(actualIndex)

                  return (
                    <TableRow key={actualIndex} className={isSelected ? "bg-muted/50" : ""}>
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(index, checked as boolean)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                      )}
                      {displayColumns.map((column) => {
                        const value =
                          typeof column.accessor === "function"
                            ? column.accessor(row)
                            : getNestedValue(row, column.accessor as string)

                        return (
                          <TableCell key={column.key}>
                            {column.render ? column.render(value, row) : String(value || "")}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 py-4">
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
                {filteredData.length} entries
              </div>
              {filteredData.length !== data.length && (
                <div className="text-sm text-muted-foreground">(filtered from {data.length} total entries)</div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Page size selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      {pageSize}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {[5, 10, 20, 50, 100].map((size) => (
                      <DropdownMenuCheckboxItem
                        key={size}
                        checked={pageSize === size}
                        onCheckedChange={() => {
                          setPageSize(size)
                          setCurrentPage(1)
                        }}
                      >
                        {size}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Navigation buttons */}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
