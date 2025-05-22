"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"

// Add this import for the info icon
import { Info } from "lucide-react"

// Define the types based on the updated data format
interface Operation {
  name: string
}

// Update the Endpoint interface to better handle SOAP operations
interface Endpoint {
  path: string
  method: "get" | "post" | "put" | "delete" | "soap"
  operations?: string[] // Optional since REST endpoints don't have operations
}

interface Service {
  serviceName: string
  endpoints: Endpoint[]
}

interface Repository {
  id: string
  services: Service[]
}

// Helper function to truncate text
const truncateText = (text: string, maxLength = 25) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Component for displaying truncated text with an info icon
const TruncatedText = ({
  text,
  maxLength = 25,
  onShowTooltip,
  onHideTooltip,
}: {
  text: string
  maxLength?: number
  onShowTooltip: (text: string, e: React.MouseEvent) => void
  onHideTooltip: () => void
}) => {
  const truncated = text.length > maxLength
  const displayText = truncated ? text.substring(0, maxLength) + "..." : text

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span>{displayText}</span>
      {truncated && (
        <span
          style={{
            display: "inline-flex",
            cursor: "pointer",
            color: "#6B7280",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => onShowTooltip(text, e)}
          onMouseLeave={onHideTooltip}
        >
          <Info size={14} />
        </span>
      )}
    </div>
  )
}

// Sample data based on the new format
const sampleData: Repository[] = [
  {
    id: "customer-api",
    services: [
      {
        serviceName: "CustomerManagement",
        endpoints: [
          {
            path: "/api/v1/customers",
            method: "get",
            operations: ["customerId", "customerName", "customerEmail", "customerPhone"],
          },
          {
            path: "/api/v1/customers/create",
            method: "post",
            operations: ["firstName", "lastName", "email", "phoneNumber", "address"],
          },
          {
            path: "/api/v1/customers/{customerId}",
            method: "put",
            operations: ["customerId", "firstName", "lastName", "email"],
          },
        ],
      },
      {
        serviceName: "CustomerManagement 2.0",
        endpoints: [
          {
            path: "/api/v2/customers",
            method: "get",
            operations: ["customerId", "fullName", "email", "phoneNumber", "addressLine1", "addressLine2"],
          },
          {
            path: "/api/v2/customers/{customerId}",
            method: "get",
            operations: ["customerId", "fullName", "email", "phoneNumber", "dateOfBirth", "customerSegment"],
          },
        ],
      },
      {
        serviceName: "CustomerPreferences",
        endpoints: [
          {
            path: "/api/v1/customers/{customerId}/preferences",
            method: "get",
            operations: ["customerId", "communicationPreferences", "marketingConsent"],
          },
          {
            path: "/api/v1/customers/{customerId}/preferences",
            method: "put",
            operations: ["customerId", "communicationPreferences", "marketingConsent"],
          },
        ],
      },
    ],
  },
  {
    id: "product-api",
    services: [
      {
        serviceName: "ProductCatalog",
        endpoints: [
          {
            path: "/api/v1/products",
            method: "get",
            operations: ["productId", "productName", "price", "category", "inStock"],
          },
          {
            path: "/api/v1/products/{productId}",
            method: "get",
            operations: ["productId", "productName", "description", "price", "category", "specifications"],
          },
          {
            path: "/api/v1/products",
            method: "post",
            operations: ["productName", "description", "price", "category", "specifications"],
          },
        ],
      },
      {
        serviceName: "InventoryManagement",
        endpoints: [
          {
            path: "/api/v1/inventory",
            method: "get",
            operations: ["productId", "warehouseId", "quantity", "lastUpdated"],
          },
          {
            path: "/api/v1/inventory/{productId}",
            method: "put",
            operations: ["productId", "warehouseId", "quantity", "reason"],
          },
        ],
      },
    ],
  },
  {
    id: "order-api-with-very-long-name-that-needs-truncation",
    services: [
      {
        serviceName: "OrderManagement",
        endpoints: [
          {
            path: "/api/v1/orders",
            method: "get",
            operations: ["orderId", "customerId", "orderDate", "totalAmount", "status"],
          },
          {
            path: "/api/v1/orders/{orderId}",
            method: "get",
            operations: [
              "orderId",
              "customerId",
              "orderDate",
              "items",
              "shippingAddress",
              "billingAddress",
              "paymentMethod",
              "subtotal",
              "tax",
              "shippingCost",
              "totalAmount",
              "status",
            ],
          },
        ],
      },
      // Update the sample data to better represent SOAP structure
      {
        serviceName: "SOAP Order Service",
        endpoints: [
          {
            path: "http://example.com/soap/OrderService",
            method: "soap",
            operations: ["CreateOrder", "GetOrderStatus", "UpdateOrderDetails", "CancelOrder", "GetOrderHistory"],
          },
          {
            path: "http://example.com/soap/OrderPaymentService",
            method: "soap",
            operations: ["ProcessPayment", "RefundPayment", "GetPaymentStatus"],
          },
        ],
      },
      {
        serviceName: "Shipping",
        endpoints: [
          {
            path: "/api/v1/shipping/methods",
            method: "get",
            operations: ["shippingMethodId", "name", "description", "cost", "estimatedDeliveryDays"],
          },
          {
            path: "/api/v1/shipping/track/{trackingNumber}",
            method: "get",
            operations: ["trackingNumber", "carrier", "status", "estimatedDeliveryDate", "trackingEvents"],
          },
          {
            path: "/api/v1/shipping/shipments",
            method: "post",
            operations: [
              "orderId",
              "shippingMethodId",
              "items",
              "shippingAddress",
              "packageDimensions",
              "packageWeight",
            ],
          },
        ],
      },
    ],
  },
]

export default function ServiceExplorerPage() {
  // State for selected repositories, services, endpoints, and active service
  const [selectedRepositoryIds, setSelectedRepositoryIds] = useState<string[]>([])
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([])
  const [selectedEndpointPaths, setSelectedEndpointPaths] = useState<string[]>([])
  const [selectedSoapOperations, setSelectedSoapOperations] = useState<string[]>([])
  const [activeServiceName, setActiveServiceName] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRepositories, setExpandedRepositories] = useState<string[]>([])
  const [expandedServices, setExpandedServices] = useState<string[]>([])
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [tooltipContent, setTooltipContent] = useState<{ text: string; x: number; y: number } | null>(null)

    // Initialize repositories from props when component mounts
  useEffect(() => {
    console.log("Initializing repositories from props:", sampleData)
    setRepositories(sampleData)
  }, [])

  useEffect(() => {
    console.log("Selected repository IDs changed:", selectedRepositoryIds)
  }, [selectedRepositoryIds])

  // Add a useEffect to log when repositories change
  // Add this after the other useEffects:
  useEffect(() => {
    console.log("Repositories state updated:", repositories)
  }, [repositories])
  // Get the selected repositories
  const selectedRepositories = useMemo(() => {
    return sampleData.filter((repo) => selectedRepositoryIds.includes(repo.id))
  }, [selectedRepositoryIds])

  // Get all selected services
  const selectedServices = useMemo(() => {
    const services: Service[] = []
    selectedRepositories.forEach((repo) => {
      repo.services.forEach((service) => {
        if (selectedServiceNames.includes(service.serviceName)) {
          services.push(service)
        }
      })
    })
    return services
  }, [selectedRepositories, selectedServiceNames])

  // Get the active service for the tabs
  const activeService = useMemo(() => {
    if (!activeServiceName || selectedServices.length === 0) return selectedServices[0] || null
    return selectedServices.find((service) => service.serviceName === activeServiceName) || selectedServices[0] || null
  }, [activeServiceName, selectedServices])

  // Get all selected endpoints
  const selectedEndpoints = useMemo(() => {
    const endpoints: { endpoint: Endpoint; serviceName: string }[] = []
    selectedRepositories.forEach((repo) => {
      repo.services.forEach((service) => {
        if (selectedServiceNames.includes(service.serviceName)) {
          service.endpoints.forEach((endpoint) => {
            if (selectedEndpointPaths.includes(endpoint.path)) {
              endpoints.push({ endpoint, serviceName: service.serviceName })
            }
          })
        }
      })
    })
    return endpoints
  }, [selectedRepositories, selectedServiceNames, selectedEndpointPaths])

  // Get operations for the active service and selected endpoints
  const selectedOperations = useMemo(() => {
    if (!activeService) return []

    const operations: { operation: string; endpointPath: string; method: string }[] = []
    activeService.endpoints.forEach((endpoint) => {
      if (selectedEndpointPaths.includes(endpoint.path) && endpoint.operations) {
        endpoint.operations.forEach((operation) => {
          // For SOAP endpoints, only include selected operations
          if (endpoint.method === "soap") {
            if (selectedSoapOperations.includes(operation)) {
              operations.push({ operation, endpointPath: endpoint.path, method: endpoint.method })
            }
          } else {
            // For REST endpoints, include all operations
            operations.push({ operation, endpointPath: endpoint.path, method: endpoint.method })
          }
        })
      }
    })
    return operations
  }, [activeService, selectedEndpointPaths, selectedSoapOperations])

  // Paginate the operations
  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return selectedOperations.slice(startIndex, startIndex + itemsPerPage)
  }, [selectedOperations, currentPage])

  const totalPages = Math.ceil(selectedOperations.length / itemsPerPage)

  // Filter repositories and services based on search query
  const filteredRepositories = useMemo(() => {
    if (!searchQuery) return sampleData

    return sampleData.filter((repo) => {
      const repoMatches = repo.id.toLowerCase().includes(searchQuery.toLowerCase())

      const serviceMatches = repo.services.some(
        (service) =>
          service.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.endpoints.some(
            (endpoint) =>
              endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (endpoint.operations &&
                endpoint.operations.some((operation) => operation.toLowerCase().includes(searchQuery.toLowerCase()))),
          ),
      )

      return repoMatches || serviceMatches
    })
  }, [searchQuery])

  // Handle repository selection
  const handleRepositorySelect = (repoId: string) => {
    setSelectedRepositoryIds((prev) => {
      if (prev.includes(repoId)) {
        return prev.filter((id) => id !== repoId)
      } else {
        return [...prev, repoId]
      }
    })
  }

   // Handle service selection
  const handleServiceSelect = (serviceName: string) => {
    setSelectedServiceNames((prev) => {
      // Check if service is being selected or deselected
      const isSelected = !prev.includes(serviceName)

      // Update selected services list
      const updatedServiceNames = isSelected ? [...prev, serviceName] : prev.filter((name) => name !== serviceName)

      // Find all endpoints for this service
      const serviceEndpoints: string[] = []
      repositories.forEach((repo) => {
        repo.services.forEach((service) => {
          if (service.serviceName === serviceName) {
            service.endpoints.forEach((endpoint) => {
              serviceEndpoints.push(endpoint.path)
            })
          }
        })
      })

      // Update selected endpoints based on service selection
      setSelectedEndpointPaths((prevEndpoints) => {
        if (isSelected) {
          // Add all service endpoints if not already selected
          const newEndpoints = [...prevEndpoints]
          serviceEndpoints.forEach((path) => {
            if (!newEndpoints.includes(path)) {
              newEndpoints.push(path)
            }
          })
          return newEndpoints
        } else {
          // Remove all endpoints belonging to this service
          return prevEndpoints.filter((path) => !serviceEndpoints.includes(path))
        }
      })

      return updatedServiceNames
    })

    // Set as active service if it's the first one selected
    if (selectedServiceNames.length === 0) {
      setActiveServiceName(serviceName)
    }
  }

  // Handle endpoint selection
  const handleEndpointSelect = (endpointPath: string, isSoap: boolean) => {
    // First, update the endpoint selection
    setSelectedEndpointPaths((prev) => {
      const isSelected = !prev.includes(endpointPath)
      const updatedEndpoints = isSelected ? [...prev, endpointPath] : prev.filter((path) => path !== endpointPath)

      return updatedEndpoints
    })

    // Find the parent service of this endpoint
    let parentServiceName: string | null = null
    repositories.forEach((repo) => {
      repo.services.forEach((service) => {
        service.endpoints.forEach((endpoint) => {
          if (endpoint.path === endpointPath) {
            parentServiceName = service.serviceName
          }
        })
      })
    })

    // If we found a parent service, make sure it's selected when endpoint is selected
    if (parentServiceName) {
      setSelectedServiceNames((prev) => {
        const isEndpointSelected = !selectedEndpointPaths.includes(endpointPath)

        if (isEndpointSelected && !prev.includes(parentServiceName!)) {
          // Add the parent service if endpoint is being selected
          return [...prev, parentServiceName!]
        } else if (!isEndpointSelected) {
          // If endpoint is being deselected, check if we should deselect the service

          // Find all endpoints for this service
          let serviceHasSelectedEndpoints = false
          repositories.forEach((repo) => {
            repo.services.forEach((service) => {
              if (service.serviceName === parentServiceName) {
                service.endpoints.forEach((endpoint) => {
                  // Check if any other endpoint from this service is still selected
                  // (excluding the one being deselected)
                  if (endpoint.path !== endpointPath && selectedEndpointPaths.includes(endpoint.path)) {
                    serviceHasSelectedEndpoints = true
                  }
                })
              }
            })
          })

          // If no endpoints remain selected for this service, deselect the service
          if (!serviceHasSelectedEndpoints) {
            return prev.filter((name) => name !== parentServiceName)
          }
        }

        return prev
      })
    }

    // Toggle endpoint expansion for SOAP endpoints
    if (isSoap) {
      setExpandedEndpoints((prev) => {
        if (prev.includes(endpointPath)) {
          return prev.filter((path) => path !== endpointPath)
        } else {
          return [...prev, endpointPath]
        }
      })

      // Fetch operations when a SOAP endpoint is selected
      fetchOperationsForEndpoint(endpointPath, isSoap)
    }
  }

  // Handle SOAP operation selection
  const handleSoapOperationSelect = (operation: string) => {
    setSelectedSoapOperations((prev) => {
      if (prev.includes(operation)) {
        return prev.filter((op) => op !== operation)
      } else {
        return [...prev, operation]
      }
    })
  }

  // Handle SOAP operation selection
  const handleSoapOperationSelect = (operation: string) => {
    setSelectedSoapOperations((prev) => {
      if (prev.includes(operation)) {
        return prev.filter((op) => op !== operation)
      } else {
        return [...prev, operation]
      }
    })
  }

  // Toggle endpoint expansion
  const toggleEndpoint = (endpointPath: string) => {
    setExpandedEndpoints((prev) => {
      if (prev.includes(endpointPath)) {
        return prev.filter((path) => path !== endpointPath)
      } else {
        return [...prev, endpointPath]
      }
    })
  }

  // Handle service tab change
  const handleServiceTabChange = (serviceName: string) => {
    setActiveServiceName(serviceName)
  }

  // Toggle repository expansion
  const toggleRepository = (repoId: string) => {
    setExpandedRepositories((prev) => (prev.includes(repoId) ? prev.filter((id) => id !== repoId) : [...prev, repoId]))
  }

  // Toggle service expansion
  const toggleService = (serviceName: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceName) ? prev.filter((name) => name !== serviceName) : [...prev, serviceName],
    )
  }

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Clear selected endpoints and services
  const clearSelectedEndpoints = () => {
    setSelectedEndpointPaths([])
    setSelectedServiceNames([])
    setSelectedSoapOperations([])
    setActiveServiceName(null)
  }

  // Show tooltip
  const showTooltip = (text: string, event: React.MouseEvent) => {
    setTooltipContent({
      text,
      x: event.clientX,
      y: event.clientY,
    })
  }

  // Hide tooltip
  const hideTooltip = () => {
    setTooltipContent(null)
  }

  // Get method badge color
  const getMethodBadgeStyle = (method: string) => {
    switch (method.toLowerCase()) {
      case "get":
        return {
          backgroundColor: "#DBEAFE",
          color: "#1E40AF",
        }
      case "post":
        return {
          backgroundColor: "#DEF7EC",
          color: "#046C4E",
        }
      case "put":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
        }
      case "delete":
        return {
          backgroundColor: "#FEE2E2",
          color: "#B91C1C",
        }
      case "soap":
        return {
          backgroundColor: "#E0E7FF",
          color: "#4338CA",
        }
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#4B5563",
        }
    }
  }

  // Styles - Updated to blue color scheme and English text
  const styles = {
    container: {
      margin: "0 auto",
      padding: "16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
      position: "relative" as const,
    },
    gridContainer: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: "24px",
    },
    sidebarHeader: {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      color: "#111827",
    },
    badge: {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      color: "#2563EB",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "14px",
      marginLeft: "8px",
      fontWeight: "500",
    },
    searchContainer: {
      position: "relative",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    searchInput: {
      flex: "1",
      padding: "10px 12px",
      paddingLeft: "36px",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      fontSize: "14px",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9CA3AF",
      fontSize: "16px",
    },
    clearButton: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#9CA3AF",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
    },
    clearSelectionButton: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      color: "#2563EB",
      background: "none",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      padding: "8px 12px",
      whiteSpace: "nowrap" as const,
    },
    repoList: {
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      overflow: "hidden",
      maxHeight: "600px",
      overflowY: "auto",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    },
    repoSelector: {
      padding: "12px",
      backgroundColor: "#F9FAFB",
      borderBottom: "1px solid #E5E7EB",
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    repoButton: {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "14px",
      cursor: "pointer",
      border: "1px solid #E5E7EB",
      backgroundColor: "white",
      transition: "all 0.2s",
    },
    repoButtonSelected: {
      backgroundColor: "#2563EB",
      color: "white",
      border: "1px solid #2563EB",
    },
    repoItem: {
      borderBottom: "1px solid #E5E7EB",
    },
    repoHeader: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      cursor: "pointer",
      backgroundColor: "#F3F4F6",
      fontWeight: "500",
    },
    repoName: {
      fontWeight: "600",
      flex: 1,
      fontSize: "14px",
      cursor: "pointer",
    },
    expandButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      color: "#6B7280",
      fontSize: "12px",
    },
    serviceItem: {
      borderBottom: "1px solid #E5E7EB",
    },
    serviceHeader: {
      display: "flex",
      alignItems: "center",
      padding: "10px 12px",
      paddingLeft: "24px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    checkbox: {
      marginRight: "8px",
      cursor: "pointer",
    },
    serviceName: {
      flex: 1,
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
    },
    serviceVersion: {
      fontSize: "12px",
      color: "#6B7280",
      marginLeft: "6px",
    },
    endpointList: {
      backgroundColor: "#F9FAFB",
    },
    endpointItem: {
      display: "flex",
      alignItems: "center",
      padding: "10px 12px",
      paddingLeft: "48px",
      borderTop: "1px solid #E5E7EB",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    operationItem: {
      display: "flex",
      alignItems: "center",
      padding: "10px 12px",
      paddingLeft: "72px",
      borderTop: "1px solid #E5E7EB",
      cursor: "pointer",
      transition: "background-color 0.2s",
      backgroundColor: "#F3F4F6",
    },
    hoverItem: {
      backgroundColor: "white",
      transition: "background-color 0.2s",
    },
    endpointPath: {
      flex: 1,
      fontSize: "14px",
      cursor: "pointer",
    },
    operationName: {
      flex: 1,
      fontSize: "14px",
    },
    methodBadge: {
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
      textTransform: "uppercase" as const,
    },
    mainContent: {
      display: "flex",
      flexDirection: "column" as const,
    },
    contentHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    contentTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#111827",
    },
    tabsContainer: {
      display: "flex",
      borderBottom: "1px solid #E5E7EB",
      marginBottom: "16px",
      overflowX: "auto",
    },
    tab: {
      padding: "8px 16px",
      borderBottom: "2px solid transparent",
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#6B7280",
      transition: "all 0.2s",
    },
    activeTab: {
      borderBottom: "2px solid #2563EB",
      color: "#2563EB",
    },
    tabIcon: {
      fontSize: "16px",
      color: "inherit",
    },
    addButton: {
      padding: "8px 16px",
      backgroundColor: "#2563EB",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginBottom: "16px",
      fontSize: "14px",
      fontWeight: "500",
      transition: "background-color 0.2s",
    },
    emptyState: {
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "32px",
      textAlign: "center" as const,
      backgroundColor: "#F9FAFB",
      color: "#6B7280",
      fontSize: "14px",
    },
    tableContainer: {
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    },
    pagination: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderTop: "1px solid #E5E7EB",
      backgroundColor: "#F9FAFB",
    },
    paginationInfo: {
      fontSize: "14px",
      color: "#6B7280",
    },
    paginationControls: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    paginationButton: {
      padding: "6px 10px",
      borderRadius: "4px",
      border: "1px solid #E5E7EB",
      cursor: "pointer",
      backgroundColor: "white",
      color: "#4B5563",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    paginationButtonDisabled: {
      color: "#D1D5DB",
      cursor: "not-allowed",
      borderColor: "#F3F4F6",
    },
    pageButton: {
      width: "32px",
      height: "32px",
      borderRadius: "4px",
      border: "1px solid #E5E7EB",
      cursor: "pointer",
      backgroundColor: "white",
      color: "#4B5563",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    activePageButton: {
      backgroundColor: "#2563EB",
      color: "white",
      borderColor: "#2563EB",
    },
    tooltip: {
      position: "fixed" as const,
      zIndex: 1000,
      backgroundColor: "#333",
      color: "white",
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      maxWidth: "300px",
      wordBreak: "break-all" as const,
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    },
  }

  return (
    <div style={styles.container}>
      {/* Tooltip */}
      {tooltipContent && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltipContent.x + 10,
            top: tooltipContent.y + 10,
          }}
        >
          {tooltipContent.text}
        </div>
      )}

      <div style={styles.gridContainer}>
        {/* Sidebar */}
        <div>
          <div style={styles.sidebarHeader}>{/* Header space maintained but content removed */}</div>

          {/* Search and Clear Selection */}
          <div style={styles.searchContainer}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search repositories, services or endpoints..."
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span style={styles.searchIcon}>🔍</span>
              {searchQuery && (
                <button style={styles.clearButton} onClick={() => setSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>
            <button
              style={{
                ...styles.clearSelectionButton,
                opacity:
                  selectedEndpointPaths.length > 0 ||
                  selectedServiceNames.length > 0 ||
                  selectedSoapOperations.length > 0
                    ? 1
                    : 0.5,
                cursor:
                  selectedEndpointPaths.length > 0 ||
                  selectedServiceNames.length > 0 ||
                  selectedSoapOperations.length > 0
                    ? "pointer"
                    : "default",
              }}
              onClick={clearSelectedEndpoints}
            >
              ✕ Clear selection
            </button>
          </div>

          {/* Repository List */}
          <div style={styles.repoList}>
            {/* Repository Selector */}
            <div style={styles.repoSelector}>
              {sampleData.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleRepositorySelect(repo.id)}
                  style={{
                    ...styles.repoButton,
                    ...(selectedRepositoryIds.includes(repo.id) ? styles.repoButtonSelected : {}),
                  }}
                >
                  <TruncatedText
                    text={repo.id.toUpperCase()}
                    maxLength={15}
                    onShowTooltip={showTooltip}
                    onHideTooltip={hideTooltip}
                  />
                </button>
              ))}
            </div>

            {/* Selected Repositories */}
            {filteredRepositories
              .filter((repo) => selectedRepositoryIds.includes(repo.id))
              .map((repo) => (
                <div key={repo.id} style={styles.repoItem}>
                  {/* Repository Header */}
                  <div style={styles.repoHeader} onClick={() => toggleRepository(repo.id)}>
                    <span style={styles.repoName}>
                      <TruncatedText
                        text={repo.id.toUpperCase()}
                        maxLength={20}
                        onShowTooltip={showTooltip}
                        onHideTooltip={hideTooltip}
                      />
                    </span>
                    <button style={styles.expandButton}>{expandedRepositories.includes(repo.id) ? "▼" : "▶"}</button>
                  </div>

                  {/* Services */}
                  {expandedRepositories.includes(repo.id) && (
                    <div>
                      {repo.services.map((service) => {
                        const isExpanded = expandedServices.includes(service.serviceName)
                        const isSelected = selectedServiceNames.includes(service.serviceName)

                        return (
                          <div key={service.serviceName} style={styles.serviceItem}>
                            {/* Service Header */}
                            <div
                              style={{
                                ...styles.serviceHeader,
                                backgroundColor: isSelected ? "rgba(37, 99, 235, 0.05)" : "transparent",
                              }}
                              onClick={() => toggleService(service.serviceName)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "white"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected
                                  ? "rgba(37, 99, 235, 0.05)"
                                  : "transparent"
                              }}
                            >
                              <input
                                type="checkbox"
                                style={styles.checkbox}
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleServiceSelect(service.serviceName)
                                }}
                              />
                              <div style={styles.serviceName}>
                                <TruncatedText
                                  text={service.serviceName}
                                  maxLength={25}
                                  onShowTooltip={showTooltip}
                                  onHideTooltip={hideTooltip}
                                />
                              </div>
                              <button style={styles.expandButton}>{isExpanded ? "▼" : "▶"}</button>
                            </div>

                            {/* Endpoints */}
                            {isExpanded && (
                              <div style={styles.endpointList}>
                                {service.endpoints.map((endpoint, index) => {
                                  const isEndpointSelected = selectedEndpointPaths.includes(endpoint.path)
                                  const isEndpointExpanded = expandedEndpoints.includes(endpoint.path)
                                  const isSoap = endpoint.method === "soap"

                                  return (
                                    <div key={`${endpoint.path}-${index}`}>
                                      {/* Endpoint Item */}
                                      <div
                                        style={{
                                          ...styles.endpointItem,
                                          backgroundColor: isEndpointSelected
                                            ? "rgba(37, 99, 235, 0.05)"
                                            : "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = "white"
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isEndpointSelected
                                            ? "rgba(37, 99, 235, 0.05)"
                                            : "transparent"
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          style={styles.checkbox}
                                          checked={isEndpointSelected}
                                          onChange={() => handleEndpointSelect(endpoint.path, isSoap)}
                                          disabled={!isSelected}
                                        />
                                        <span style={styles.endpointPath}>
                                          <TruncatedText
                                            text={endpoint.path}
                                            maxLength={20}
                                            onShowTooltip={showTooltip}
                                            onHideTooltip={hideTooltip}
                                          />
                                        </span>
                                        <span
                                          style={{
                                            ...styles.methodBadge,
                                            ...getMethodBadgeStyle(endpoint.method),
                                          }}
                                        >
                                          {endpoint.method}
                                        </span>
                                        {isSoap && (
                                          <button
                                            style={styles.expandButton}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleEndpoint(endpoint.path)
                                            }}
                                          >
                                            {isEndpointExpanded ? "▼" : "▶"}
                                          </button>
                                        )}
                                      </div>

                                      {/* SOAP Operations (nested under endpoint) */}
                                      {isSoap && isEndpointExpanded && endpoint.operations && (
                                        <div>
                                          {endpoint.operations.map((operation) => {
                                            const isOperationSelected = selectedSoapOperations.includes(operation)
                                            return (
                                              <div
                                                key={`${endpoint.path}-${operation}`}
                                                style={{
                                                  ...styles.operationItem,
                                                  backgroundColor: isOperationSelected
                                                    ? "rgba(37, 99, 235, 0.05)"
                                                    : "#F3F4F6",
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = "white"
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = isOperationSelected
                                                    ? "rgba(37, 99, 235, 0.05)"
                                                    : "#F3F4F6"
                                                }}
                                              >
                                                <input
                                                  type="checkbox"
                                                  style={styles.checkbox}
                                                  checked={isOperationSelected}
                                                  onChange={() => handleSoapOperationSelect(operation)}
                                                  disabled={!isEndpointSelected}
                                                />
                                                <span style={styles.operationName}>{operation}</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

            {selectedRepositoryIds.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "14px" }}>
                Select repositories to view their services
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          <div style={styles.contentHeader}>
            <h2 style={styles.contentTitle}>Attributes</h2>
          </div>

          {selectedServiceNames.length > 0 ? (
            <>
              {/* Service Tabs */}
              <div style={styles.tabsContainer}>
                {selectedServices.map((service) => (
                  <button
                    key={service.serviceName}
                    style={{
                      ...styles.tab,
                      ...(service.serviceName === activeService?.serviceName ? styles.activeTab : {}),
                    }}
                    onClick={() => handleServiceTabChange(service.serviceName)}
                  >
                    <span style={styles.tabIcon}>🔗</span>
                    <TruncatedText
                      text={service.serviceName}
                      maxLength={20}
                      onShowTooltip={showTooltip}
                      onHideTooltip={hideTooltip}
                    />
                  </button>
                ))}
              </div>

              {/* Add Button */}
              <button style={styles.addButton}>Add</button>

              {/* Placeholder for the table component */}
              {activeService && (selectedEndpointPaths.length > 0 || selectedSoapOperations.length > 0) ? (
                <div style={styles.tableContainer}>
                  {/* This is where you'll integrate your table component */}
                  <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
                    <p style={{ fontSize: "14px", color: "#4B5563" }}>
                      Operations table for {activeService.serviceName} - {selectedOperations.length} operations found
                    </p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                      (Your table component will be integrated here)
                    </p>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={styles.pagination}>
                      <div style={styles.paginationInfo}>
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, selectedOperations.length)} of {selectedOperations.length}{" "}
                        operations
                      </div>
                      <div style={styles.paginationControls}>
                        <button
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                          }}
                        >
                          ◀
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageToShow
                          if (totalPages <= 5) {
                            pageToShow = i + 1
                          } else if (currentPage <= 3) {
                            pageToShow = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageToShow = totalPages - 4 + i
                          } else {
                            pageToShow = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageToShow}
                              onClick={() => handlePageChange(pageToShow)}
                              style={{
                                ...styles.pageButton,
                                ...(currentPage === pageToShow ? styles.activePageButton : {}),
                              }}
                            >
                              {pageToShow}
                            </button>
                          )
                        })}

                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                          }}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <p>Select endpoints to view their operations</p>
                </div>
              )}
            </>
          ) : (
            <div style={styles.emptyState}>
              <p>
                {selectedRepositoryIds.length > 0 ? "Select a service to continue" : "Select a repository to begin"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
