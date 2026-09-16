import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"
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
  readonly theme: AppTheme
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
  theme
}: Readonly<SearchAndFilterProps>) {
  return (
    <div style={{ padding: "4px 14px 8px 14px" }}>
      {/* Sleek Search Input */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search subjects or course codes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            height: 34,
            boxSizing: "border-box",
            padding: "6px 28px 6px 32px",
            borderRadius: 9,
            border: `1px solid ${theme.inputBorder}`,
            backgroundColor: theme.inputBg,
            fontSize: 12,
            fontWeight: 500,
            color: theme.inputText,
            outline: "none",
            transition: "all 0.15s ease"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.inputFocusBorder
            e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.inputFocusRing}`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.inputBorder
            e.currentTarget.style.boxShadow = "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: theme.textMuted,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center"
          }}>
          <MagnifyingGlassIcon size={14} weight="bold" />
        </div>

        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            title="Clear search"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: theme.textMuted,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <XIcon size={13} weight="bold" />
          </button>
        )}
      </div>

      {/* iOS/Linear Style Segmented Control */}
      <div
        style={{
          display: "flex",
          gap: 3,
          backgroundColor: theme.segmentBg,
          border: `1px solid ${theme.segmentBorder}`,
          borderRadius: 9,
          padding: 3
        }}>
        {/* Tab: All */}
        <button
          onClick={() => onFilterChange("all")}
          style={{
            flex: 1,
            padding: "5px 4px",
            borderRadius: 7,
            border: "none",
            backgroundColor: activeFilter === "all" ? theme.segmentActiveBg : "transparent",
            color: activeFilter === "all" ? theme.segmentActiveText : theme.segmentInactiveText,
            boxShadow: activeFilter === "all" ? theme.segmentActiveShadow : "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            transition: "all 0.15s ease"
          }}>
          <span>All</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 9999,
              fontSize: 9.5,
              fontWeight: 700,
              backgroundColor:
                activeFilter === "all"
                  ? theme.name === "dark"
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.06)"
                  : theme.metricBg,
              color: activeFilter === "all" ? theme.segmentActiveText : theme.textMuted,
              fontVariantNumeric: "tabular-nums"
            }}>
            {counts.all}
          </span>
        </button>

        {/* Tab: At Risk */}
        <button
          onClick={() => onFilterChange("risk")}
          style={{
            flex: 1,
            padding: "5px 4px",
            borderRadius: 7,
            border: "none",
            backgroundColor: activeFilter === "risk" ? theme.segmentActiveBg : "transparent",
            color:
              activeFilter === "risk"
                ? theme.statusColors.deficit.solid
                : counts.risk > 0
                ? theme.statusColors.deficit.solid
                : theme.segmentInactiveText,
            boxShadow: activeFilter === "risk" ? theme.segmentActiveShadow : "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            transition: "all 0.15s ease"
          }}>
          <span>At Risk</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 9999,
              fontSize: 9.5,
              fontWeight: 700,
              backgroundColor:
                activeFilter === "risk"
                  ? theme.statusColors.deficit.bg
                  : counts.risk > 0
                  ? theme.statusColors.deficit.bg
                  : theme.metricBg,
              color:
                activeFilter === "risk" || counts.risk > 0
                  ? theme.statusColors.deficit.solid
                  : theme.textMuted,
              fontVariantNumeric: "tabular-nums"
            }}>
            {counts.risk}
          </span>
        </button>

        {/* Tab: Safe */}
        <button
          onClick={() => onFilterChange("safe")}
          style={{
            flex: 1,
            padding: "5px 4px",
            borderRadius: 7,
            border: "none",
            backgroundColor: activeFilter === "safe" ? theme.segmentActiveBg : "transparent",
            color:
              activeFilter === "safe"
                ? theme.statusColors.surplus.solid
                : theme.segmentInactiveText,
            boxShadow: activeFilter === "safe" ? theme.segmentActiveShadow : "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            transition: "all 0.15s ease"
          }}>
          <span>Safe</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 9999,
              fontSize: 9.5,
              fontWeight: 700,
              backgroundColor:
                activeFilter === "safe"
                  ? theme.statusColors.surplus.bg
                  : theme.metricBg,
              color:
                activeFilter === "safe"
                  ? theme.statusColors.surplus.solid
                  : theme.textMuted,
              fontVariantNumeric: "tabular-nums"
            }}>
            {counts.safe}
          </span>
        </button>
      </div>
    </div>
  )
}

