import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import type { FilterType } from "~types"

interface SearchAndFilterProps {
  readonly searchTerm: string
  readonly onSearchChange: (value: string) => void
  readonly activeFilter: FilterType
  readonly onFilterChange: (filter: FilterType) => void
  readonly counts: {
    readonly all: number
    readonly risk: number
    readonly safe: number
  }
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts
}: Readonly<SearchAndFilterProps>) {
  return (
    <div style={{ padding: "4px 16px 8px 16px" }}>
      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search subjects or course codes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 12px 8px 34px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            fontSize: 12,
            color: "#0f172a",
            outline: "none",
            transition: "all 0.15s ease"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center"
          }}>
          <MagnifyingGlassIcon size={15} weight="bold" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onFilterChange("all")}
          style={{
            flex: 1,
            padding: "5px 8px",
            borderRadius: 6,
            border: activeFilter === "all" ? "1px solid #6366f1" : "1px solid #e2e8f0",
            backgroundColor: activeFilter === "all" ? "#e0e7ff" : "#ffffff",
            color: activeFilter === "all" ? "#3730a3" : "#64748b",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}>
          All ({counts.all})
        </button>

        <button
          onClick={() => onFilterChange("risk")}
          style={{
            flex: 1,
            padding: "5px 8px",
            borderRadius: 6,
            border: activeFilter === "risk" ? "1px solid #f43f5e" : "1px solid #e2e8f0",
            backgroundColor: activeFilter === "risk" ? "#ffe4e6" : "#ffffff",
            color: activeFilter === "risk" ? "#be123c" : "#64748b",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}>
          At Risk ({counts.risk})
        </button>

        <button
          onClick={() => onFilterChange("safe")}
          style={{
            flex: 1,
            padding: "5px 8px",
            borderRadius: 6,
            border: activeFilter === "safe" ? "1px solid #10b981" : "1px solid #e2e8f0",
            backgroundColor: activeFilter === "safe" ? "#d1fae5" : "#ffffff",
            color: activeFilter === "safe" ? "#065f46" : "#64748b",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}>
          Safe ({counts.safe})
        </button>
      </div>
    </div>
  )
}
