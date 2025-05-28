"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
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
import { ChevronDown, ChevronRight, Download, Filter, Eye, Search, X } from "lucide-react"

// Types for the tree data grid
export interface TreeNode<T = any> {
  id: string | number
  parentId?: string | number | null
  children?: TreeNode<T>[]
  level?: number
  isExpanded?: boolean
  isVisible?: boolean
  isLeaf?: boolean
  data: T
}

export interface Column<T = any> {
  key: string
  header: string
  accessor: keyof T | ((row: T) => any)
  filterable?: boolean
  filterType?: "text" | "boolean" | "select"
  filterOptions?: { label: string; value: any }[]
  sortable?: boolean
  width?: string
  treeColumn?: boolean
  render?: (value: any, row: T, node?: TreeNode<T>) => React.ReactNode
}

export interface TreeDataGridProps<T = any> {
  data: T[]
  columns: Column<T>[]
  title?: string
  searchable?: boolean
  exportable?: boolean
  selectable?: boolean
  pageSize?: number
  className?: string
  idField?: keyof T
  parentIdField?: keyof T
  onSelectionChange?: (selectedRows: T[]) => void
  defaultExpandedLevels?: number
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

// Convert flat data to hierarchical tree structure
const buildTreeData = <T extends Record<string, any>>(
  data: T[],
  idField: keyof T,
  parentIdField: keyof T,
  defaultExpandedLevels = 1,
): TreeNode<T>[] => {
  const idMap: Record<string | number, TreeNode<T>> = {}
  const roots: TreeNode<T>[] = []

  // First pass: create nodes
  data.forEach((item) => {
    const id = item[idField]
    idMap[id] = {
      id,
      data: item,
      children: [],
      level: 0,
      isExpanded: false,
      isVisible: true,
      isLeaf: true,
    }
  })

  // Second pass: establish parent-child relationships
  data.forEach((item) => {
    const id = item[idField]
    const parentId = item[parentIdField]
    const node = idMap[id]

    if (parentId && idMap[parentId]) {
      // This is a child node
      const parent = idMap[parentId]
      parent.children = parent.children || []
      parent.children.push(node)
      parent.isLeaf = false
      node.parentId = parentId
    } else {
      // This is a root node
      roots.push(node)
    }
  })

  // Third pass: calculate levels and set initial expanded state
  const calculateLevels = (nodes: TreeNode<T>[], level: number) => {
    nodes.forEach((node) => {
      node.level = level
      node.isExpanded = level < defaultExpandedLevels
      if (node.children && node.children.length > 0) {
        calculateLevels(node.children, level + 1)
      }
    })
  }

  calculateLevels(roots, 0)

  return roots
}

// Flatten tree for rendering
const flattenTree = <T extends Record<string, any>>(
  nodes: TreeNode<T>[],
  result: TreeNode<T>[] = [],
  parentVisible = true,
): TreeNode<T>[] => {
  nodes.forEach((node) => {
    // A node is visible if its parent is visible and expanded
    node.isVisible = parentVisible
    if (node.isVisible) {
      result.push(node)
    }

    if (node.children && node.children.length > 0 && node.isExpanded) {
      flattenTree(node.children, result, node.isVisible)
    }
  })
  return result
}

export function TreeDataGrid<T extends Record<string, any>>({
  data,
  columns,
  title = "Tree Data Grid",
  searchable = true,
  exportable = true,
  selectable = true,
  pageSize: initialPageSize = 10,
  className = "",
  idField = "id" as keyof T,
  parentIdField = "parentId" as keyof T,
  onSelectionChange,
  defaultExpandedLevels = 1,
}: TreeDataGridProps<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string | boolean | null>>({})
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
  )
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize || 10)
  const [treeData, setTreeData] = useState<TreeNode<T>[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(new Set())

  // Initialize tree data
  useEffect(() => {
    const tree = buildTreeData(data, idField, parentIdField, defaultExpandedLevels)
    setTreeData(tree)

    // Initialize expanded nodes based on defaultExpandedLevels
    const expanded = new Set<string | number>()
    const collectExpandedNodes = (nodes: TreeNode<T>[]) => {
      nodes.forEach((node) => {
        if (node.isExpanded) {
          expanded.add(node.id)
        }
        if (node.children && node.children.length > 0) {
          collectExpandedNodes(node.children)
        }
      })
    }

    collectExpandedNodes(tree)
    setExpandedNodes(expanded)
  }, [data, idField, parentIdField, defaultExpandedLevels])

  // Get visible columns
  const displayColumns = useMemo(() => columns.filter((col) => visibleColumns[col.key]), [columns, visibleColumns])

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string | number) => {
    setTreeData((prevTreeData) => {
      const newTreeData = [...prevTreeData]

      // Helper function to find and toggle node
      const toggleNode = (nodes: TreeNode<T>[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (node.id === nodeId) {
            node.isExpanded = !node.isExpanded

            // Update expandedNodes set
            if (node.isExpanded) {
              setExpandedNodes((prev) => new Set(prev).add(nodeId))
            } else {
              setExpandedNodes((prev) => {
                const newSet = new Set(prev)
                newSet.delete(nodeId)
                return newSet
              })
            }

            return true
          }

          if (node.children && node.children.length > 0) {
            if (toggleNode(node.children)) {
              return true
            }
          }
        }
        return false
      }

      toggleNode(newTreeData)
      return newTreeData
    })
  }, [])

  // Filter and search data
  const handleColumnFilter = useCallback((columnKey: string, value: string | boolean | null) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }))
    setCurrentPage(1) // Reset to first page when filtering
  }, [])

  // Apply filters to tree data
  const filteredTreeData = useMemo(() => {
    // Helper function to check if a node or any of its descendants match the filters
    const nodeMatchesFilters = (node: TreeNode<T>): boolean => {
      const rowData = node.data

      // Check if the node matches search term
      const matchesSearch =
        !searchTerm ||
        columns.some((col) => {
          const value =
            typeof col.accessor === "function" ? col.accessor(rowData) : getNestedValue(rowData, col.accessor as string)
          return String(value || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        })

      // Check if the node matches column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([columnKey, filterValue]) => {
        if (filterValue === null || filterValue === undefined || filterValue === "") {
          return true
        }

        const column = columns.find((col) => col.key === columnKey)
        if (!column) return true

        const value =
          typeof column.accessor === "function"
            ? column.accessor(rowData)
            : getNestedValue(rowData, column.accessor as string)

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

      // Check if any children match
      const hasMatchingChild =
        node.children && node.children.length > 0 && node.children.some((child) => nodeMatchesFilters(child))

      return (matchesSearch && matchesColumnFilters) || hasMatchingChild
    }

    // Clone the tree and filter it
    const filterTree = (nodes: TreeNode<T>[]): TreeNode<T>[] => {
      return nodes
        .filter((node) => nodeMatchesFilters(node))
        .map((node) => ({
          ...node,
          children: node.children && node.children.length > 0 ? filterTree(node.children) : [],
        }))
    }

    return filterTree(treeData)
  }, [treeData, searchTerm, columnFilters, columns])

  // Flatten the filtered tree for rendering
  const flattenedFilteredData = useMemo(() => {
    const result: TreeNode<T>[] = []

    // Helper function to flatten the tree with visibility based on expanded state
    const flatten = (nodes: TreeNode<T>[], isVisible = true) => {
      nodes.forEach((node) => {
        const nodeVisible = isVisible
        const nodeCopy = { ...node, isVisible: nodeVisible }

        if (nodeVisible) {
          result.push(nodeCopy)
        }

        if (node.children && node.children.length > 0 && expandedNodes.has(node.id)) {
          flatten(node.children, nodeVisible)
        }
      })
    }

    flatten(filteredTreeData)
    return result
  }, [filteredTreeData, expandedNodes])

  // Pagination
  const totalPages = Math.ceil(flattenedFilteredData.length / pageSize)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return flattenedFilteredData.slice(startIndex, startIndex + pageSize)
  }, [flattenedFilteredData, currentPage, pageSize])

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set<string | number>()
        paginatedData.forEach((node) => {
          allIds.add(node.id)
        })
        setSelectedRows(allIds)
      } else {
        setSelectedRows(new Set())
      }
    },
    [paginatedData],
  )

  const handleSelectRow = useCallback(
    (nodeId: string | number, checked: boolean) => {
      const newSelected = new Set(selectedRows)
      if (checked) {
        newSelected.add(nodeId)
      } else {
        newSelected.delete(nodeId)
      }
      setSelectedRows(newSelected)
    },
    [selectedRows],
  )

  // Update parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedData = Array.from(selectedRows)
        .map((id) => {
          const findNode = (nodes: TreeNode<T>[]): T | undefined => {
            for (const node of nodes) {
              if (node.id === id) return node.data
              if (node.children && node.children.length > 0) {
                const found = findNode(node.children)
                if (found) return found
              }
            }
            return undefined
          }

          return findNode(treeData)
        })
        .filter(Boolean) as T[]

      onSelectionChange(selectedData)
    }
  }, [selectedRows, treeData, onSelectionChange])

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
        ? (Array.from(selectedRows)
            .map((id) => {
              const findNode = (nodes: TreeNode<T>[]): T | undefined => {
                for (const node of nodes) {
                  if (node.id === id) return node.data
                  if (node.children && node.children.length > 0) {
                    const found = findNode(node.children)
                    if (found) return found
                  }
                }
                return undefined
              }

              return findNode(treeData)
            })
            .filter(Boolean) as T[])
        : flattenedFilteredData.map((node) => node.data)

    exportToCSV(selectedData, displayColumns, title.toLowerCase().replace(/\s+/g, "-"))
  }, [selectedRows, treeData, flattenedFilteredData, displayColumns, title])

  const isAllSelected = paginatedData.length > 0 && paginatedData.every((node) => selectedRows.has(node.id))
  const isIndeterminate = paginatedData.some((node) => selectedRows.has(node.id)) && !isAllSelected

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
                  {column?.header}: {String(value)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearColumnFilter(columnKey)} />
                </Badge>
              )
            })}
          </div>
        )}

        {/* Selection Info */}
        {selectable && selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} of {flattenedFilteredData.length} rows selected
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
                paginatedData.map((node) => {
                  const isSelected = selectedRows.has(node.id)
                  const hasChildren = node.children && node.children.length > 0

                  return (
                    <TableRow key={node.id} className={isSelected ? "bg-muted/50" : ""}>
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(node.id, checked as boolean)}
                            aria-label={`Select row ${node.id}`}
                          />
                        </TableCell>
                      )}
                      {displayColumns.map((column) => {
                        const value =
                          typeof column.accessor === "function"
                            ? column.accessor(node.data)
                            : getNestedValue(node.data, column.accessor as string)

                        return (
                          <TableCell key={column.key}>
                            <div className="flex items-center">
                              {/* Add tree expand/collapse button and indentation for tree column */}
                              {column.treeColumn && (
                                <>
                                  <div style={{ width: `${node.level! * 20}px` }} />
                                  {hasChildren ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 mr-1"
                                      onClick={() => toggleNodeExpansion(node.id)}
                                    >
                                      {expandedNodes.has(node.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <div className="w-7" /> // Spacer for leaf nodes
                                  )}
                                </>
                              )}
                              {column.render ? column.render(value, node.data, node) : String(value || "")}
                            </div>
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
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, flattenedFilteredData.length)} of {flattenedFilteredData.length}{" "}
                entries
              </div>
              {flattenedFilteredData.length !== treeData.length && (
                <div className="text-sm text-muted-foreground">(filtered from {treeData.length} total entries)</div>
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
