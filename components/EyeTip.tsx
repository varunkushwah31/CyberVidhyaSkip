import { ArrowSquareOutIcon, EyeIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type { AppTheme } from "~constants/theme"
import { dismissEyeTip, getEyeTipDismissed } from "~utils/storage"

interface EyeTipProps {
  readonly activeTabId: number | null
  readonly forceVisible?: boolean
  readonly onClose?: () => void
  readonly onOpenAttendance?: () => void
  readonly portalUrl?: string
  readonly theme?: AppTheme
}

export function EyeTip({
  activeTabId,
  forceVisible = false,
  onClose,
  onOpenAttendance,
  portalUrl = "https://kiet.cybervidya.net/attendance/my-attendance",
  theme
}: Readonly<EyeTipProps>) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    getEyeTipDismissed().then((value) => {
      setDismissed(value)
      setReady(true)
    })
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    dismissEyeTip()
    onClose?.()
    if (
      activeTabId != null &&
      typeof chrome !== "undefined" &&
      chrome.tabs?.sendMessage
    ) {
      chrome.tabs.sendMessage(activeTabId, { action: "HIDE_EYE_TIP" }, () => {
        void chrome.runtime.lastError
      })
    }
  }

  // If forceVisible is explicitly passed as true, render regardless of persisted dismissed state
  const isVisible = forceVisible ? true : ready && !dismissed
  if (!isVisible) return null

  const isDark = theme?.name === "dark"
  const cardBg = isDark ? "rgba(99, 102, 241, 0.12)" : "#eff6ff"
  const cardBorder = isDark ? "rgba(99, 102, 241, 0.25)" : "#bfdbfe"
  const titleColor = theme?.textPrimary || "#0f172a"
  const bodyColor = theme?.textSecondary || "#475569"
  const accentColor = theme?.accent || "#4f46e5"

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        margin: "8px 14px 2px 14px",
        padding: "8px 10px",
        borderRadius: 10,
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        position: "relative"
      }}>
      <div
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: accentColor,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1
        }}>
        <EyeIcon size={11} weight="bold" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: titleColor,
            letterSpacing: "-0.01em"
          }}>
          Accurate Attendance Data
        </div>
        <p
          style={{
            margin: "2px 0 5px 0",
            fontSize: 10,
            lineHeight: 1.45,
            color: bodyColor
          }}>
          Go to{" "}
          <a
            href={portalUrl}
            onClick={(e) => {
              if (onOpenAttendance) {
                e.preventDefault()
                onOpenAttendance()
              }
            }}
            target="_blank"
            rel="noreferrer"
            style={{
              color: accentColor,
              fontWeight: 600,
              textDecoration: "underline",
              cursor: "pointer",
              wordBreak: "break-all"
            }}>
            {(portalUrl || "https://kiet.cybervidya.net/attendance/my-attendance").replace(/^https?:\/\//, "")}
          </a>{" "}
          for getting one-time accurate data (verified lecture breakdown & OD logs).
        </p>

        {onOpenAttendance && (
          <button
            onClick={onOpenAttendance}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 7px",
              borderRadius: 5,
              border: `1px solid ${cardBorder}`,
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#e0e7ff",
              color: accentColor,
              fontSize: 9.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
            <span>Open My Attendance</span>
            <ArrowSquareOutIcon size={11} weight="bold" />
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        title="Dismiss"
        aria-label="Dismiss attendance guidance"
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          border: "none",
          borderRadius: 6,
          background: "transparent",
          color: theme?.textMuted || "#94a3b8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          transition: "all 0.15s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = titleColor
          e.currentTarget.style.backgroundColor = isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.06)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme?.textMuted || "#94a3b8"
          e.currentTarget.style.backgroundColor = "transparent"
        }}>
        <XIcon size={14} weight="bold" />
      </button>
    </div>
  )
}



