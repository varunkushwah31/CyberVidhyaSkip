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
    <div style={{ padding: "4px 14px 8px 14px" }}>
      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 7 }}>
        <input
          type="text"
          placeholder="Search subjects or course codes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            height: 32,
            boxSizing: "border-box",
            padding: "6px 12px 6px 32px",
            borderRadius: 4,
            border: "1px solid #ced4da",
            backgroundColor: "#ffffff",
            fontSize: 12,
            color: "#495057",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 9,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6c757d",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center"
          }}>
          <MagnifyingGlassIcon size={14} weight="bold" />
        </div>
      </div>

      {/* Filter Tabs (Bootstrap button group style) */}
      <div style={{ display: "flex", gap: 5 }}>
        <button
          onClick={() => onFilterChange("all")}
          style={{
            flex: 1,
            padding: "5px 6px",
            borderRadius: 4,
            border: activeFilter === "all" ? "1px solid #007bff" : "1px solid #ced4da",
            backgroundColor: activeFilter === "all" ? "#007bff" : "#ffffff",
            color: activeFilter === "all" ? "#ffffff" : "#495057",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}>
          <span>All</span>
          <span
            style={{
              padding: "1px 5px",
              borderRadius: 8,
              fontSize: 10,
              backgroundColor: activeFilter === "all" ? "rgba(255, 255, 255, 0.25)" : "#e9ecef",
              color: activeFilter === "all" ? "#ffffff" : "#495057"
            }}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => onFilterChange("risk")}
          style={{
            flex: 1,
            padding: "5px 6px",
            borderRadius: 4,
            border: activeFilter === "risk" ? "1px solid #dc3545" : "1px solid #ced4da",
            backgroundColor: activeFilter === "risk" ? "#dc3545" : "#ffffff",
            color: activeFilter === "risk" ? "#ffffff" : "#495057",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}>
          <span>At Risk</span>
          <span
            style={{
              padding: "1px 5px",
              borderRadius: 8,
              fontSize: 10,
              backgroundColor:
                activeFilter === "risk"
                  ? "rgba(255, 255, 255, 0.25)"
                  : counts.risk > 0
                  ? "#fce8e6"
                  : "#e9ecef",
              color:
                activeFilter === "risk"
                  ? "#ffffff"
                  : counts.risk > 0
                  ? "#c5221f"
                  : "#495057"
            }}>
            {counts.risk}
          </span>
        </button>

        <button
          onClick={() => onFilterChange("safe")}
          style={{
            flex: 1,
            padding: "5px 6px",
            borderRadius: 4,
            border: activeFilter === "safe" ? "1px solid #28a745" : "1px solid #ced4da",
            backgroundColor: activeFilter === "safe" ? "#28a745" : "#ffffff",
            color: activeFilter === "safe" ? "#ffffff" : "#495057",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}>
          <span>Safe</span>
          <span
            style={{
              padding: "1px 5px",
              borderRadius: 8,
              fontSize: 10,
              backgroundColor: activeFilter === "safe" ? "rgba(255, 255, 255, 0.25)" : "#e9ecef",
              color: activeFilter === "safe" ? "#ffffff" : "#495057"
            }}>
            {counts.safe}
          </span>
        </button>
      </div>
    </div>
  )
}
