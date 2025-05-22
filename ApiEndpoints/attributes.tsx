"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { Info, Loader2, Plus, Edit, Check, X, MessageSquare } from "lucide-react"

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

// Component for React Select with pills for Client IDs
const ClientIdSelect = ({
  selectedIds,
  allIds,
  onSelect,
  onRemove,
}: {
  selectedIds: string[]
  allIds: string[]
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}) => {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [filteredIds, setFilteredIds] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pillsContainerRef = useRef<HTMLDivElement>(null)

  // Filter available IDs based on input and already selected IDs
  useEffect(() => {
    const filtered = allIds
      .filter((id) => !selectedIds.includes(id))
      .filter((id) => id.toLowerCase().includes(inputValue.toLowerCase()))
    setFilteredIds(filtered)
  }, [inputValue, allIds, selectedIds])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (!isOpen) setIsOpen(true)
  }

  const handleSelectId = (id: string) => {
    onSelect(id)
    setInputValue("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && !allIds.includes(inputValue.trim())) {
      // Add new custom ID
      onSelect(inputValue.trim())
      setInputValue("")
      e.preventDefault()
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={pillsContainerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px",
          border: "1px solid #E5E7EB",
          borderRadius: "6px",
          backgroundColor: "white",
          minHeight: "40px",
          maxHeight: "150px",
          overflowY: "auto",
          alignItems: "center",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedIds.map((id) => (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#EFF6FF",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "13px",
              gap: "6px",
              border: "1px solid #DBEAFE",
            }}
          >
            <span
              style={{
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {id}
            </span>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                color: "#2563EB",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(id)
              }}
              aria-label="Remove client ID"
            >
              ✕
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length === 0 ? "Search or add client IDs..." : ""}
          style={{
            flex: "1",
            border: "none",
            outline: "none",
            fontSize: "14px",
            minWidth: "120px",
            padding: "4px",
            backgroundColor: "transparent",
          }}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            marginTop: "4px",
            zIndex: 10,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          {filteredIds.length > 0 ? (
            filteredIds.map((id) => (
              <div
                key={id}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #F3F4F6",
                  fontSize: "14px",
                  color: "#4B5563",
                  transition: "background-color 0.2s",
                }}
                onClick={() => handleSelectId(id)}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9FAFB"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white"
                }}
              >
                {id}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "8px 12px",
                color: "#6B7280",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {inputValue.trim() ? `Press Enter to add "${inputValue}" as a new ID` : "No client IDs available"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Inline Editable Field Component
const InlineEditableField = ({
  value,
  onChange,
  placeholder,
  label,
  icon,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  icon: React.ReactNode
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onChange(tempValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "6px",
        overflow: "hidden",
        marginBottom: "16px",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "#F9FAFB",
          borderBottom: isEditing ? "1px solid #E5E7EB" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon}
          <h3 style={{ fontSize: "16px", fontWeight: "500", color: "#111827", margin: 0 }}>{label}</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#2563EB",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <Edit size={16} />
            Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleCancel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: "#EF4444",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: "#10B981",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <Check size={16} />
              Save
            </button>
          </div>
        )}
      </div>
      {!isEditing ? (
        value ? (
          <div style={{ padding: "12px 16px", fontSize: "14px", color: "#4B5563" }}>{value}</div>
        ) : (
          <div style={{ padding: "12px 16px", fontSize: "14px", color: "#9CA3AF", fontStyle: "italic" }}>
            {placeholder}
          </div>
        )
      ) : (
        <div style={{ padding: "12px 16px" }}>
          <textarea
            ref={textareaRef}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              fontSize: "14px",
              minHeight: "100px",
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  )
}


export default function ServiceExplorerPage({ services_attributes = sampleServicesAttributes }) {
  // State for selected clients, services, endpoints, and operations
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([])
  const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([])
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedClientIds, setExpandedClientIds] = useState<string[]>([])
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([])
  const [expandedEndpointIds, setExpandedEndpointIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [tooltipContent, setTooltipContent] = useState<{ text: string; x: number; y: number } | null>(null)

  // State for data management
  const [clients, setClients] = useState<Client[]>([])
  const [loadingEndpoints, setLoadingEndpoints] = useState<string[]>([])

  // Additional state variables
  const [description, setDescription] = useState("")
  const [comments, setComments] = useState("")
  const [activeTab, setActiveTab] = useState<"attributes" | "details">("attributes")

  // Initialize clients from props when component mounts
  useEffect(() => {
    console.log("Initializing clients from props:", services_attributes)
    setClients(services_attributes)

    // Initialize expanded state for services (expanded by default)
    const initialExpandedServiceIds = services_attributes.flatMap((client) =>
      client.services.map((service) => service.apiId),
    )
    setExpandedServiceIds(initialExpandedServiceIds)

    // Initialize selected state based on the used flag and lastModifiedBy
    const initialSelectedClientIds: string[] = []
    const initialSelectedServiceIds: string[] = []
    const initialSelectedEndpointIds: string[] = []
    const initialSelectedOperationIds: string[] = []

    services_attributes.forEach((client) => {
      // Only process clients with used=true and lastModifiedBy not null
      if (client.used && client.lastModifiedBy !== null) {
        initialSelectedClientIds.push(client.appId)

        client.services.forEach((service) => {
          if (service.used) {
            let hasSelectedEndpoint = false

            service.endpoints.forEach((endpoint) => {
              if (endpoint.used) {
                initialSelectedEndpointIds.push(endpoint.endpointId)
                hasSelectedEndpoint = true

                // Handle operations if they exist
                if (endpoint.operations) {
                  endpoint.operations.forEach((operation) => {
                    if (operation.used) {
                      initialSelectedOperationIds.push(`${endpoint.endpointId}-${operation.operation}`)
                    }
                  })
                }
              }
            })

            // Only select the service if it has at least one selected endpoint
            if (hasSelectedEndpoint) {
              initialSelectedServiceIds.push(service.apiId)
            }
          }
        })
      }
    })

    setSelectedClientIds(initialSelectedClientIds)
    setSelectedServiceIds(initialSelectedServiceIds)
    setSelectedEndpointIds(initialSelectedEndpointIds)
    setSelectedOperationIds(initialSelectedOperationIds)

    // Set all clients as expanded by default
    setExpandedClientIds(services_attributes.map((client) => client.appId))
  }, [services_attributes])

  // Get the selected clients
  const selectedClients = useMemo(() => {
    return clients.filter((client) => selectedClientIds.includes(client.appId))
  }, [clients, selectedClientIds])

  // Get all selected services
  const selectedServices = useMemo(() => {
    const services: { service: Service; clientId: string }[] = []
    selectedClients.forEach((client) => {
      client.services.forEach((service) => {
        if (selectedServiceIds.includes(service.apiId)) {
          services.push({ service, clientId: client.appId })
        }
      })
    })
    return services
  }, [selectedClients, selectedServiceIds])

  // Get the active service for the tabs
  const activeService = useMemo(() => {
    if (!activeServiceId || selectedServices.length === 0) return selectedServices[0] || null
    const found = selectedServices.find(({ service }) => service.apiId === activeServiceId)
    return found || selectedServices[0] || null
  }, [activeServiceId, selectedServices])

  // Get all selected endpoints
  const selectedEndpoints = useMemo(() => {
    const endpoints: { endpoint: Endpoint; serviceId: string; clientId: string }[] = []
    selectedClients.forEach((client) => {
      client.services.forEach((service) => {
        if (selectedServiceIds.includes(service.apiId)) {
          service.endpoints.forEach((endpoint) => {
            if (selectedEndpointIds.includes(endpoint.endpointId)) {
              endpoints.push({ endpoint, serviceId: service.apiId, clientId: client.appId })
            }
          })
        }
      })
    })
    return endpoints
  }, [selectedClients, selectedServiceIds, selectedEndpointIds])

  // Get operations for the active service and selected endpoints
  const selectedOperations = useMemo(() => {
    if (!activeService) return []

    const operations: { operation: string; endpointId: string; method: string }[] = []
    activeService.service.endpoints.forEach((endpoint) => {
      if (selectedEndpointIds.includes(endpoint.endpointId) && endpoint.operations) {
        endpoint.operations.forEach((op) => {
          const operationId = `${endpoint.endpointId}-${op.operation}`
          // For SOAP endpoints, only include selected operations
          if (endpoint.method === "SOAP") {
            if (selectedOperationIds.includes(operationId)) {
              operations.push({ operation: op.operation, endpointId: endpoint.endpointId, method: endpoint.method })
            }
          } else {
            // For REST endpoints, include all operations
            operations.push({ operation: op.operation, endpointId: endpoint.endpointId, method: endpoint.method })
          }
        })
      }
    })
    return operations
  }, [activeService, selectedEndpointIds, selectedOperationIds])

  // Paginate the operations
  const paginatedOperations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return selectedOperations.slice(startIndex, startIndex + itemsPerPage)
  }, [selectedOperations, currentPage])

  const totalPages = Math.ceil(selectedOperations.length / itemsPerPage)

  // Filter clients and services based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients

    return clients.filter((client) => {
      const clientMatches =
        client.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.appId.toLowerCase().includes(searchQuery.toLowerCase())

      const serviceMatches = client.services.some(
        (service) =>
          service.apiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.endpoints.some(
            (endpoint) =>
              endpoint.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
              endpoint.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (endpoint.operations &&
                endpoint.operations.some((operation) =>
                  operation.operation.toLowerCase().includes(searchQuery.toLowerCase()),
                )),
          ),
      )

      return clientMatches || serviceMatches
    })
  }, [searchQuery, clients])

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    setSelectedClientIds((prev) => {
      if (prev.includes(clientId)) {
        // Deselecting client - remove client and all its services and endpoints
        const client = clients.find((c) => c.appId === clientId)
        if (client) {
          const serviceIds = client.services.map((s) => s.apiId)
          const endpointIds = client.services.flatMap((s) => s.endpoints.map((e) => e.endpointId))
          const operationIds = client.services.flatMap((s) =>
            s.endpoints.flatMap((e) =>
              e.operations ? e.operations.map((op) => `${e.endpointId}-${op.operation}`) : [],
            ),
          )

          setSelectedServiceIds((prev) => prev.filter((id) => !serviceIds.includes(id)))
          setSelectedEndpointIds((prev) => prev.filter((id) => !endpointIds.includes(id)))
          setSelectedOperationIds((prev) => prev.filter((id) => !operationIds.includes(id)))
        }

        return prev.filter((id) => id !== clientId)
      } else {
        // Selecting client - add client but don't automatically select services/endpoints
        return [...prev, clientId]
      }
    })
  }

  // Handle service selection
  const handleServiceSelect = (serviceId: string, clientId: string) => {
    setSelectedServiceIds((prev) => {
      // Check if service is being selected or deselected
      const isSelected = !prev.includes(serviceId)

      // Update selected services list
      const updatedServiceIds = isSelected ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)

      // Find all endpoints for this service
      const client = clients.find((c) => c.appId === clientId)
      if (!client) return updatedServiceIds

      const service = client.services.find((s) => s.apiId === serviceId)
      if (!service) return updatedServiceIds

      const serviceEndpointIds = service.endpoints.map((e) => e.endpointId)
      const serviceOperationIds = service.endpoints.flatMap((e) =>
        e.operations ? e.operations.map((op) => `${e.endpointId}-${op.operation}`) : [],
      )

      // Update selected endpoints based on service selection
      setSelectedEndpointIds((prevEndpoints) => {
        if (isSelected) {
          // Add all service endpoints if not already selected
          const newEndpoints = [...prevEndpoints]
          serviceEndpointIds.forEach((id) => {
            if (!newEndpoints.includes(id)) {
              newEndpoints.push(id)
            }
          })
          return newEndpoints
        } else {
          // Remove all endpoints belonging to this service
          return prevEndpoints.filter((id) => !serviceEndpointIds.includes(id))
        }
      })

      // Update selected operations based on service selection
      setSelectedOperationIds((prevOperations) => {
        if (isSelected) {
          // Add all service operations if not already selected
          const newOperations = [...prevOperations]
          serviceOperationIds.forEach((id) => {
            if (!newOperations.includes(id)) {
              newOperations.push(id)
            }
          })
          return newOperations
        } else {
          // Remove all operations belonging to this service
          return prevOperations.filter((id) => !serviceOperationIds.includes(id))
        }
      })

      // Make sure the client is selected
      if (isSelected && !selectedClientIds.includes(clientId)) {
        setSelectedClientIds((prev) => [...prev, clientId])
      }

      return updatedServiceIds
    })

    // Set as active service if it's the first one selected
    if (selectedServiceIds.length === 0) {
      setActiveServiceId(serviceId)
    }
  }

  // Handle endpoint selection
  const handleEndpointSelect = (endpointId: string, serviceId: string, clientId: string) => {
    // Check if the endpoint is currently selected
    const isCurrentlySelected = selectedEndpointIds.includes(endpointId)

    if (isCurrentlySelected) {
      // DESELECTING: Remove this endpoint from selection
      setSelectedEndpointIds((prev) => prev.filter((id) => id !== endpointId))

      // Remove any operations associated with this endpoint
      setSelectedOperationIds((prev) => prev.filter((id) => !id.startsWith(`${endpointId}-`)))

      // Find all endpoints for this service
      const client = clients.find((c) => c.appId === clientId)
      if (!client) return

      const service = client.services.find((s) => s.apiId === serviceId)
      if (!service) return

      const serviceEndpointIds = service.endpoints.map((e) => e.endpointId)

      // Check if any other endpoints from this service are still selected
      const hasOtherSelectedEndpoints = serviceEndpointIds.some(
        (id) => id !== endpointId && selectedEndpointIds.includes(id),
      )

      // If no other endpoints remain selected, deselect the service
      if (!hasOtherSelectedEndpoints) {
        setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId))
      }
    } else {
      // SELECTING: Add this endpoint to selection
      setSelectedEndpointIds((prev) => [...prev, endpointId])

      // Find the endpoint to check if it has operations that should be selected
      const client = clients.find((c) => c.appId === clientId)
      if (!client) return

      const service = client.services.find((s) => s.apiId === serviceId)
      if (!service) return

      const endpoint = service.endpoints.find((e) => e.endpointId === endpointId)
      if (!endpoint) return

      // If the endpoint has operations and they are marked as used, select them
      if (endpoint.operations) {
        const usedOperationIds = endpoint.operations
          .filter((op) => op.used)
          .map((op) => `${endpointId}-${op.operation}`)

        if (usedOperationIds.length > 0) {
          setSelectedOperationIds((prev) => [...prev, ...usedOperationIds])
        }
      }

      // Make sure the parent service is selected
      if (!selectedServiceIds.includes(serviceId)) {
        setSelectedServiceIds((prev) => [...prev, serviceId])
      }

      // Make sure the client is selected
      if (!selectedClientIds.includes(clientId)) {
        setSelectedClientIds((prev) => [...prev, clientId])
      }
    }

    // Toggle endpoint expansion for SOAP endpoints
    const client = clients.find((c) => c.appId === clientId)
    if (client) {
      const service = client.services.find((s) => s.apiId === serviceId)
      if (service) {
        const endpoint = service.endpoints.find((e) => e.endpointId === endpointId)
        if (endpoint && endpoint.method === "SOAP") {
          setExpandedEndpointIds((prev) => {
            if (prev.includes(endpointId)) {
              return prev.filter((id) => id !== endpointId)
            } else {
              return [...prev, endpointId]
            }
          })
        }
      }
    }
  }

  // Handle operation selection
  const handleOperationSelect = (operationId: string, endpointId: string, serviceId: string, clientId: string) => {
    const fullOperationId = `${endpointId}-${operationId}`

    setSelectedOperationIds((prev) => {
      if (prev.includes(fullOperationId)) {
        return prev.filter((id) => id !== fullOperationId)
      } else {
        return [...prev, fullOperationId]
      }
    })

    // Make sure the endpoint is selected
    if (!selectedEndpointIds.includes(endpointId)) {
      setSelectedEndpointIds((prev) => [...prev, endpointId])
    }

    // Make sure the service is selected
    if (!selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds((prev) => [...prev, serviceId])
    }

    // Make sure the client is selected
    if (!selectedClientIds.includes(clientId)) {
      setSelectedClientIds((prev) => [...prev, clientId])
    }
  }

  // Toggle endpoint expansion
  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpointIds((prev) => {
      if (prev.includes(endpointId)) {
        return prev.filter((id) => id !== endpointId)
      } else {
        return [...prev, endpointId]
      }
    })
  }

  // Handle service tab change
  const handleServiceTabChange = (serviceId: string) => {
    setActiveServiceId(serviceId)
  }

  // Toggle client expansion
  const toggleClient = (clientId: string) => {
    setExpandedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId],
    )
  }

  // Toggle service expansion
  const toggleService = (serviceId: string) => {
    setExpandedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Clear selected endpoints and services
  const clearSelectedItems = () => {
    setSelectedEndpointIds([])
    setSelectedServiceIds([])
    setSelectedOperationIds([])
    setSelectedClientIds([])
    setActiveServiceId(null)
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
    switch (method.toUpperCase()) {
      case "GET":
        return {
          backgroundColor: "#DBEAFE",
          color: "#1E40AF",
        }
      case "POST":
        return {
          backgroundColor: "#DEF7EC",
          color: "#046C4E",
        }
      case "PUT":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
        }
      case "DELETE":
        return {
          backgroundColor: "#FEE2E2",
          color: "#B91C1C",
        }
      case "SOAP":
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

  // Get all client IDs for the select component
  const allClientIds = useMemo(() => {
    return clients.map((client) => client.appId)
  }, [clients])

 
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
        {/* Search and Client Section */}
        <div>
          <div style={styles.sidebarHeader}>{/* Header space maintained but content removed */}</div>

          {/* Search and Clear Selection */}
          <div style={styles.searchContainer}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search clients, services or endpoints..."
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
                  selectedEndpointIds.length > 0 ||
                  selectedServiceIds.length > 0 ||
                  selectedOperationIds.length > 0 ||
                  selectedClientIds.length > 0
                    ? 1
                    : 0.5,
                cursor:
                  selectedEndpointIds.length > 0 ||
                  selectedServiceIds.length > 0 ||
                  selectedOperationIds.length > 0 ||
                  selectedClientIds.length > 0
                    ? "pointer"
                    : "default",
              }}
              onClick={clearSelectedItems}
            >
              ✕ Clear selection
            </button>
            <button style={styles.addIdButton}>
              <Plus size={14} /> Add ID
            </button>
          </div>

          {/* Client List */}
          <div style={styles.clientList}>
            {/* Client ID Selector */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827" }}>Client ID(s)</h3>
              </div>
              <ClientIdSelect
                selectedIds={selectedClientIds}
                allIds={allClientIds}
                onSelect={handleClientSelect}
                onRemove={handleClientSelect}
              />
            </div>

            {/* Selected Clients */}
            {filteredClients
              .filter((client) => selectedClientIds.includes(client.appId))
              .map((client) => (
                <div key={client.appId} style={styles.clientItem}>
                  {/* Client Header */}
                  <div style={styles.clientHeader} onClick={() => toggleClient(client.appId)}>
                    <span style={styles.clientName}>
                      <TruncatedText
                        text={client.appName}
                        maxLength={20}
                        onShowTooltip={showTooltip}
                        onHideTooltip={hideTooltip}
                      />
                    </span>
                    <span
                      style={{
                        ...styles.lastModifiedBadge,
                        ...(client.lastModifiedBy ? styles.lastModifiedActive : styles.lastModifiedInactive),
                      }}
                    >
                      {client.lastModifiedBy ? "Active" : "Inactive"}
                    </span>
                    <button style={styles.expandButton}>{expandedClientIds.includes(client.appId) ? "▼" : "▶"}</button>
                  </div>

                  {/* Services */}
                  {expandedClientIds.includes(client.appId) && (
                    <div>
                      {client.services.map((service) => {
                        const isExpanded = expandedServiceIds.includes(service.apiId)
                        const isSelected = selectedServiceIds.includes(service.apiId)

                        return (
                          <div key={service.apiId} style={styles.serviceItem}>
                            {/* Service Header */}
                            <div
                              style={{
                                ...styles.serviceHeader,
                                backgroundColor: isSelected ? "rgba(37, 99, 235, 0.05)" : "transparent",
                              }}
                              onClick={() => toggleService(service.apiId)}
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
                                  handleServiceSelect(service.apiId, client.appId)
                                }}
                              />
                              <div style={styles.serviceName}>
                                <TruncatedText
                                  text={service.apiName}
                                  maxLength={25}
                                  onShowTooltip={showTooltip}
                                  onHideTooltip={hideTooltip}
                                />
                                <span style={styles.serviceVersion}>v{service.version}</span>
                              </div>
                              <button style={styles.expandButton}>{isExpanded ? "▼" : "▶"}</button>
                            </div>

                            {/* Endpoints */}
                            {isExpanded && (
                              <div style={styles.endpointList}>
                                {service.endpoints.map((endpoint) => {
                                  const isEndpointSelected = selectedEndpointIds.includes(endpoint.endpointId)
                                  const isEndpointExpanded = expandedEndpointIds.includes(endpoint.endpointId)
                                  const isSoap = endpoint.method.toUpperCase() === "SOAP"
                                  const isLoading = loadingEndpoints.includes(endpoint.endpointId)

                                  return (
                                    <div key={endpoint.endpointId}>
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
                                          onChange={() =>
                                            handleEndpointSelect(endpoint.endpointId, service.apiId, client.appId)
                                          }
                                        />
                                        <span style={styles.endpointPath}>
                                          <TruncatedText
                                            text={endpoint.endpoint}
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
                                        {isSoap && endpoint.operations && (
                                          <>
                                            {isLoading ? (
                                              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                            ) : (
                                              <button
                                                style={styles.expandButton}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  toggleEndpoint(endpoint.endpointId)
                                                }}
                                              >
                                                {isEndpointExpanded ? "▼" : "▶"}
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {/* SOAP Operations (nested under endpoint) */}
                                      {isSoap && isEndpointExpanded && endpoint.operations && !isLoading && (
                                        <div>
                                          {endpoint.operations.map((operation) => {
                                            const operationId = `${endpoint.endpointId}-${operation.operation}`
                                            const isOperationSelected = selectedOperationIds.includes(operationId)
                                            return (
                                              <div
                                                key={operationId}
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
                                                  onChange={() =>
                                                    handleOperationSelect(
                                                      operation.operation,
                                                      endpoint.endpointId,
                                                      service.apiId,
                                                      client.appId,
                                                    )
                                                  }
                                                  disabled={!isEndpointSelected}
                                                />
                                                <span style={styles.operationName}>{operation.operation}</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}

                                      {/* Loading state for SOAP operations */}
                                      {isSoap && isEndpointExpanded && isLoading && (
                                        <div style={{ ...styles.operationItem, justifyContent: "center" }}>
                                          <span
                                            style={{
                                              color: "#6B7280",
                                              fontSize: "14px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "8px",
                                            }}
                                          >
                                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                            Loading operations...
                                          </span>
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

            {selectedClientIds.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "14px" }}>
                Select clients to view their services
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Now below the client section */}
        <div style={styles.mainContent}>
          {/* Main Tabs */}
          <div style={styles.mainTabs}>
            <div
              style={{
                ...styles.mainTab,
                ...(activeTab === "attributes" ? styles.activeMainTab : {}),
              }}
              onClick={() => setActiveTab("attributes")}
            >
              Attributes
            </div>
            <div
              style={{
                ...styles.mainTab,
                ...(activeTab === "details" ? styles.activeMainTab : {}),
              }}
              onClick={() => setActiveTab("details")}
            >
              Additional Details
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "attributes" ? (
            // Attributes Tab Content
            <>
              {/* Information Banner */}
              <div style={styles.infoBanner}>
                <div style={styles.infoBannerIcon}>
                  <Info size={20} />
                </div>
                <div style={styles.infoBannerContent}>
                  <div style={styles.infoBannerTitle}>Important Information</div>
                  <div style={styles.infoBannerText}>
                    Select services and endpoints to view their attributes. You can filter operations by using the
                    search box above. For SOAP endpoints, you need to select specific operations after selecting the
                    endpoint.
                  </div>
                </div>
              </div>

              {selectedServiceIds.length > 0 ? (
                <>
                  {/* Service Tabs */}
                  <div style={styles.tabsContainer}>
                    {selectedServices.map(({ service }) => (
                      <button
                        key={service.apiId}
                        style={{
                          ...styles.tab,
                          ...(service.apiId === activeService?.service.apiId ? styles.activeTab : {}),
                        }}
                        onClick={() => handleServiceTabChange(service.apiId)}
                      >
                        <span style={styles.tabIcon}>🔗</span>
                        <TruncatedText
                          text={`${service.apiName} v${service.version}`}
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
                  {activeService && (selectedEndpointIds.length > 0 || selectedOperationIds.length > 0) ? (
                    <div style={styles.tableContainer}>
                      {/* This is where you'll integrate your table component */}
                      <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
                        <p style={{ fontSize: "14px", color: "#4B5563" }}>
                          Operations table for {activeService.service.apiName} - {selectedOperations.length} operations
                          found
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
                            {Math.min(currentPage * itemsPerPage, selectedOperations.length)} of{" "}
                            {selectedOperations.length} operations
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
                  <p>{selectedClientIds.length > 0 ? "Select a service to continue" : "Select a client to begin"}</p>
                </div>
              )}
            </>
          ) : (
            // Details Tab Content
            <div>
              <InlineEditableField
                value={description}
                onChange={setDescription}
                placeholder="Enter a description for this service..."
                label="Description"
                icon={<Info size={18} color="#2563EB" />}
              />
              <InlineEditableField
                value={comments}
                onChange={setComments}
                placeholder="Add your comments here..."
                label="Comments"
                icon={<MessageSquare size={18} color="#2563EB" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
