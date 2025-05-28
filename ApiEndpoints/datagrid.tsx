"use client"

import React, { useState, useMemo, useCallback } from "react"
import { ChevronDown, Download, Filter, Eye, Search, X } from "lucide-react"
import "./data-grid.css"

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
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

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

  // Toggle dropdown
  const toggleDropdown = useCallback((dropdownId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    setOpenDropdowns((prev) => {
      const newSet = new Set()
      if (!prev.has(dropdownId)) {
        newSet.add(dropdownId)
      }
      return newSet
    })
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

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Don't close if clicking on dropdown trigger or content
      if (!target.closest(".data-grid__dropdown")) {
        setOpenDropdowns(new Set())
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`data-grid ${className}`}>
      <div className="data-grid__card">
        <div className="data-grid__header">
          <div className="data-grid__header-content">
            <h2 className="data-grid__title">{title}</h2>

            <div className="data-grid__controls">
              {/* Search */}
              {searchable && (
                <div className="data-grid__search">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="data-grid__search-input"
                  />
                  <Search className="data-grid__search-icon" size={16} />
                </div>
              )}

              {/* Column Visibility */}
              <div className="data-grid__dropdown">
                <button
                  className="data-grid__button data-grid__button--outline"
                  onClick={(e) => toggleDropdown("columns", e)}
                >
                  <Eye size={16} />
                  Columns
                  <ChevronDown size={16} />
                </button>
                {openDropdowns.has("columns") && (
                  <div className="data-grid__dropdown-content">
                    {columns.map((column) => (
                      <label key={column.key} className="data-grid__dropdown-item">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key]}
                          onChange={() => {
                            toggleColumnVisibility(column.key)
                            setOpenDropdowns(new Set())
                          }}
                        />
                        {column.header}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Export */}
              {exportable && (
                <button className="data-grid__button data-grid__button--outline" onClick={handleExport}>
                  <Download size={16} />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {Object.entries(columnFilters).length > 0 && (
            <div className="data-grid__filters">
              <span className="data-grid__filters-label">Active filters:</span>
              {Object.entries(columnFilters).map(([columnKey, value]) => {
                const column = columns.find((col) => col.key === columnKey)
                return (
                  <span key={columnKey} className="data-grid__filter-badge">
                    {column?.header}: {String(value)}
                    <button className="data-grid__filter-remove" onClick={() => clearColumnFilter(columnKey)}>
                      <X size={12} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {/* Selection Info */}
          {selectable && selectedRows.size > 0 && (
            <div className="data-grid__selection-info">
              {selectedRows.size} of {filteredData.length} rows selected
            </div>
          )}
        </div>

        <div className="data-grid__content">
          <div className="data-grid__table-container">
            <table className="data-grid__table">
              <thead>
                <tr>
                  {selectable && (
                    <th className="data-grid__th data-grid__th--checkbox">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  {displayColumns.map((column) => (
                    <th key={column.key} className="data-grid__th" style={{ width: column.width }}>
                      <div className="data-grid__th-content">
                        <span>{column.header}</span>
                        {column.filterable && (
                          <div className="data-grid__dropdown">
                            <button
                              className={`data-grid__filter-button ${
                                columnFilters[column.key] !== undefined &&
                                columnFilters[column.key] !== null &&
                                columnFilters[column.key] !== ""
                                  ? "data-grid__filter-button--active"
                                  : ""
                              }`}
                              onClick={(e) => toggleDropdown(`filter-${column.key}`, e)}
                            >
                              <Filter size={12} />
                            </button>
                            {openDropdowns.has(`filter-${column.key}`) && (
                              <div className="data-grid__dropdown-content data-grid__filter-dropdown">
                                {column.filterType === "boolean" ? (
                                  <div className="data-grid__filter-options">
                                    <button
                                      className={`data-grid__filter-option ${
                                        columnFilters[column.key] === null || columnFilters[column.key] === undefined
                                          ? "data-grid__filter-option--active"
                                          : ""
                                      }`}
                                      onClick={() => handleColumnFilter(column.key, null)}
                                    >
                                      All
                                    </button>
                                    <button
                                      className={`data-grid__filter-option ${
                                        columnFilters[column.key] === true ? "data-grid__filter-option--active" : ""
                                      }`}
                                      onClick={() => {
                                        handleColumnFilter(column.key, true)
                                        setOpenDropdowns(new Set())
                                      }}
                                    >
                                      True
                                    </button>
                                    <button
                                      className={`data-grid__filter-option ${
                                        columnFilters[column.key] === false ? "data-grid__filter-option--active" : ""
                                      }`}
                                      onClick={() => {
                                        handleColumnFilter(column.key, false)
                                        setOpenDropdowns(new Set())
                                      }}
                                    >
                                      False
                                    </button>
                                  </div>
                                ) : column.filterType === "select" && column.filterOptions ? (
                                  <div className="data-grid__filter-options">
                                    <button
                                      className={`data-grid__filter-option ${
                                        columnFilters[column.key] === null || columnFilters[column.key] === undefined
                                          ? "data-grid__filter-option--active"
                                          : ""
                                      }`}
                                      onClick={() => handleColumnFilter(column.key, null)}
                                    >
                                      All
                                    </button>
                                    {column.filterOptions.map((option) => (
                                      <button
                                        key={option.value}
                                        className={`data-grid__filter-option ${
                                          columnFilters[column.key] === option.value
                                            ? "data-grid__filter-option--active"
                                            : ""
                                        }`}
                                        onClick={() => {
                                          handleColumnFilter(column.key, option.value)
                                          setOpenDropdowns(new Set())
                                        }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder={`Filter ${column.header}...`}
                                    value={columnFilters[column.key] || ""}
                                    onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                                    className="data-grid__filter-input"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayColumns.length + (selectable ? 1 : 0)}
                      className="data-grid__td data-grid__no-results"
                    >
                      No results found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const actualIndex = (currentPage - 1) * pageSize + index
                    const isSelected = selectedRows.has(actualIndex)

                    return (
                      <tr key={actualIndex} className={`data-grid__tr ${isSelected ? "data-grid__tr--selected" : ""}`}>
                        {selectable && (
                          <td className="data-grid__td">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(index, e.target.checked)}
                              aria-label={`Select row ${index + 1}`}
                            />
                          </td>
                        )}
                        {displayColumns.map((column) => {
                          const value =
                            typeof column.accessor === "function"
                              ? column.accessor(row)
                              : getNestedValue(row, column.accessor as string)

                          return (
                            <td key={column.key} className="data-grid__td">
                              {column.render ? column.render(value, row) : String(value || "")}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="data-grid__pagination">
              <div className="data-grid__pagination-info">
                <div className="data-grid__pagination-text">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)}{" "}
                  of {filteredData.length} entries
                </div>
                {filteredData.length !== data.length && (
                  <div className="data-grid__pagination-text data-grid__pagination-text--muted">
                    (filtered from {data.length} total entries)
                  </div>
                )}
              </div>

              <div className="data-grid__pagination-controls">
                {/* Page size selector */}
                <div className="data-grid__page-size">
                  <span className="data-grid__page-size-label">Rows per page:</span>
                  <div className="data-grid__dropdown">
                    <button
                      className="data-grid__button data-grid__button--outline data-grid__button--small"
                      onClick={(e) => toggleDropdown("pageSize", e)}
                    >
                      {pageSize}
                      <ChevronDown size={16} />
                    </button>
                    {openDropdowns.has("pageSize") && (
                      <div className="data-grid__dropdown-content">
                        {[5, 10, 20, 50, 100].map((size) => (
                          <button
                            key={size}
                            className={`data-grid__dropdown-item ${
                              pageSize === size ? "data-grid__dropdown-item--active" : ""
                            }`}
                            onClick={() => {
                              setPageSize(size)
                              setCurrentPage(1)
                              setOpenDropdowns(new Set())
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation buttons */}
                <button
                  className="data-grid__button data-grid__button--outline data-grid__button--small"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  className="data-grid__button data-grid__button--outline data-grid__button--small"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="data-grid__page-numbers">
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
                      <button
                        key={pageNum}
                        className={`data-grid__button data-grid__button--small ${
                          currentPage === pageNum ? "data-grid__button--primary" : "data-grid__button--outline"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  className="data-grid__button data-grid__button--outline data-grid__button--small"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  className="data-grid__button data-grid__button--outline data-grid__button--small"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
