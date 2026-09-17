import { ArrowClockwiseIcon, GraduationCapIcon, InfoIcon, MoonIcon, SunIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"

interface HeaderProps {
  readonly scanning: boolean
  readonly onScan: () => void
  readonly onToggleTip?: () => void
  readonly tipActive?: boolean
  readonly theme: AppTheme
  readonly onToggleTheme: () => void
}

export function Header({
  scanning,
  onScan,
  onToggleTip,
  tipActive,
  theme,
  onToggleTheme
}: Readonly<HeaderProps>) {
  const isDark = theme.name === "dark"

  return (
    <div
      style={{
        backgroundColor: theme.headerBg,
        borderBottom: `1px solid ${theme.headerBorder}`,
        padding: "11px 16px",
        transition: "all 0.2s ease"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Brand Lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: theme.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
              flexShrink: 0
            }}>
            <GraduationCapIcon size={17} weight="fill" />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: theme.textPrimary,
                lineHeight: 1.2
              }}>
              CyberVidhya
            </div>
            <div
              style={{
                fontSize: 10,
                color: theme.textMuted,
                fontWeight: 500,
                marginTop: 1,
                letterSpacing: "0.01em"
              }}>
              75% Attendance & Skip Planner
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: theme.metricBg,
              border: `1px solid ${theme.metricBorder}`,
              color: theme.textSecondary,
              width: 28,
              height: 28,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textPrimary
              e.currentTarget.style.borderColor = theme.cardHoverBorder
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textSecondary
              e.currentTarget.style.borderColor = theme.metricBorder
            }}>
            {isDark ? <SunIcon size={14} weight="bold" /> : <MoonIcon size={14} weight="bold" />}
          </button>

          {/* Info / Tips Guide Button */}
          {onToggleTip && (
            <button
              onClick={onToggleTip}
              title="Attendance Info & Tips"
              style={{
                background: tipActive
                  ? isDark
                    ? "rgba(99, 102, 241, 0.22)"
                    : "#e0e7ff"
                  : theme.metricBg,
                border: tipActive
                  ? `1px solid ${theme.accent}`
                  : `1px solid ${theme.metricBorder}`,
                color: tipActive ? theme.accent : theme.textSecondary,
                width: 28,
                height: 28,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                padding: 0
              }}
              onMouseEnter={(e) => {
                if (!tipActive) {
                  e.currentTarget.style.color = theme.textPrimary
                  e.currentTarget.style.borderColor = theme.cardHoverBorder
                }
              }}
              onMouseLeave={(e) => {
                if (!tipActive) {
                  e.currentTarget.style.color = theme.textSecondary
                  e.currentTarget.style.borderColor = theme.metricBorder
                }
              }}>
              <InfoIcon size={14} weight={tipActive ? "fill" : "bold"} />
            </button>
          )}

          {/* Rescan Button */}
          <button
            onClick={onScan}
            disabled={scanning}
            title="Rescan Courses"
            style={{
              background: theme.metricBg,
              border: `1px solid ${theme.metricBorder}`,
              color: theme.textSecondary,
              width: 28,
              height: 28,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: scanning ? "wait" : "pointer",
              transition: "all 0.15s ease",
              padding: 0
            }}
            onMouseEnter={(e) => {
              if (!scanning) {
                e.currentTarget.style.color = theme.textPrimary
                e.currentTarget.style.borderColor = theme.cardHoverBorder
              }
            }}
            onMouseLeave={(e) => {
              if (!scanning) {
                e.currentTarget.style.color = theme.textSecondary
                e.currentTarget.style.borderColor = theme.metricBorder
              }
            }}>
            <ArrowClockwiseIcon
              size={14}
              weight="bold"
              style={{
                transform: scanning ? "rotate(360deg)" : "none",
                transition: scanning ? "transform 0.8s linear infinite" : "none"
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}



