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
    <div style={{ padding: "4px 14px 6px 14px" }}>
      {/* Pill-Shaped Search Input */}
      <div style={{ position: "relative", marginBottom: 6 }}>
        <input
          type="text"
          placeholder="Search subjects or course codes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            height: 30,
            boxSizing: "border-box",
            padding: "5px 28px 5px 30px",
            borderRadius: 9999,
            border: `1px solid ${theme.inputBorder}`,
            backgroundColor: theme.inputBg,
            fontSize: 11.5,
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
          <MagnifyingGlassIcon size={13} weight="bold" />
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
            <XIcon size={12} weight="bold" />
          </button>
        )}
      </div>

      {/* Underline Indicator Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0
        }}>
        {/* Tab: All */}
        <button
          onClick={() => onFilterChange("all")}
          style={{
            flex: 1,
            padding: "4px 4px 6px 4px",
            borderRadius: 0,
            border: "none",
            borderBottom: activeFilter === "all"
              ? `2px solid ${theme.accent}`
              : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeFilter === "all" ? theme.textPrimary : theme.segmentInactiveText,
            fontSize: 10.5,
            fontWeight: activeFilter === "all" ? 700 : 500,
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
              padding: "0px 5px",
              borderRadius: 9999,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor: activeFilter === "all"
                ? theme.name === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)"
                : theme.metricBg,
              color: activeFilter === "all" ? theme.textPrimary : theme.textMuted,
              fontVariantNumeric: "tabular-nums",
              lineHeight: "16px"
            }}>
            {counts.all}
          </span>
        </button>

        {/* Tab: At Risk */}
        <button
          onClick={() => onFilterChange("risk")}
          style={{
            flex: 1,
            padding: "4px 4px 6px 4px",
            borderRadius: 0,
            border: "none",
            borderBottom: activeFilter === "risk"
              ? `2px solid ${theme.statusColors.deficit.solid}`
              : "2px solid transparent",
            backgroundColor: "transparent",
            color:
              activeFilter === "risk"
                ? theme.statusColors.deficit.solid
                : counts.risk > 0
                ? theme.statusColors.deficit.solid
                : theme.segmentInactiveText,
            fontSize: 10.5,
            fontWeight: activeFilter === "risk" ? 700 : 500,
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
              padding: "0px 5px",
              borderRadius: 9999,
              fontSize: 9,
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
              fontVariantNumeric: "tabular-nums",
              lineHeight: "16px"
            }}>
            {counts.risk}
          </span>
        </button>

        {/* Tab: Safe */}
        <button
          onClick={() => onFilterChange("safe")}
          style={{
            flex: 1,
            padding: "4px 4px 6px 4px",
            borderRadius: 0,
            border: "none",
            borderBottom: activeFilter === "safe"
              ? `2px solid ${theme.statusColors.surplus.solid}`
              : "2px solid transparent",
            backgroundColor: "transparent",
            color:
              activeFilter === "safe"
                ? theme.statusColors.surplus.solid
                : theme.segmentInactiveText,
            fontSize: 10.5,
            fontWeight: activeFilter === "safe" ? 700 : 500,
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
              padding: "0px 5px",
              borderRadius: 9999,
              fontSize: 9,
              fontWeight: 700,
              backgroundColor:
                activeFilter === "safe"
                  ? theme.statusColors.surplus.bg
                  : theme.metricBg,
              color:
                activeFilter === "safe"
                  ? theme.statusColors.surplus.solid
                  : theme.textMuted,
              fontVariantNumeric: "tabular-nums",
              lineHeight: "16px"
            }}>
            {counts.safe}
          </span>
        </button>
      </div>
    </div>
  )
}

