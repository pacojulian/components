
"use client"

import { useState } from "react"
import { Copy, Check, Info } from "lucide-react"

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

interface ApiEndpointProps {
  method: Method
  path: string
  maxPathLength?: number
}

export default function ApiEndpoint({ method, path, maxPathLength = 40 }: ApiEndpointProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)

  // Truncate path if it's too long
  const displayPath = path.length > maxPathLength ? path.substring(0, maxPathLength) + "..." : path

  // Method color mapping
  const methodColors: Record<Method, { bg: string; text: string }> = {
    GET: { bg: "#e0f2fe", text: "#0369a1" },
    POST: { bg: "#dcfce7", text: "#166534" },
    PUT: { bg: "#fef9c3", text: "#854d0e" },
    DELETE: { bg: "#fee2e2", text: "#b91c1c" },
    PATCH: { bg: "#f3e8ff", text: "#7e22ce" },
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="api-endpoint">
      <p
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
          margin: "0 0 4px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            backgroundColor: methodColors[method].bg,
            color: methodColors[method].text,
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "12px",
            letterSpacing: "0.5px",
          }}
        >
          {method}
        </span>
        Endpoint
      </p>

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#f1f5f9",
          padding: "8px 12px",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "14px",
          overflowX: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {displayPath}

        {path.length > maxPathLength && (
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              marginLeft: "4px",
            }}
          >
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: "0",
                cursor: "pointer",
                color: "#64748b",
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={16} />
            </button>

            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  bottom: "24px",
                  right: "-10px",
                  backgroundColor: "#1e293b",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  zIndex: 10,
                  maxWidth: "300px",
                  overflowX: "auto",
                }}
              >
                {path}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "10px",
                    width: "0",
                    height: "0",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid #1e293b",
                  }}
                ></div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={copyToClipboard}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            color: copied ? "#16a34a" : "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
          title="Copy to clipboard"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}
