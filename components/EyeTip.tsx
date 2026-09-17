import { EyeIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type { AppTheme } from "~constants/theme"
import { dismissEyeTip, getEyeTipDismissed } from "~utils/storage"

interface EyeTipProps {
  readonly activeTabId: number | null
  readonly forceVisible?: boolean
  readonly onClose?: () => void
  readonly theme?: AppTheme
}

export function EyeTip({ activeTabId, forceVisible = false, onClose, theme }: Readonly<EyeTipProps>) {
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
        padding: "10px 12px",
        borderRadius: 10,
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        position: "relative"
      }}>
      <div
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: accentColor,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1
        }}>
        <EyeIcon size={13} weight="bold" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: titleColor,
            letterSpacing: "-0.01em"
          }}>
          Accurate Attendance Tracking
        </div>
        <p
          style={{
            margin: "2px 0 0 0",
            fontSize: 10.5,
            lineHeight: 1.4,
            color: bodyColor
          }}>
          Lecture and duty leave (OD) logs are verified from{" "}
          <strong style={{ color: accentColor }}>My Attendance</strong> or by
          clicking each course's <strong style={{ color: titleColor }}>eye icon</strong>.
        </p>
      </div>

      <button
        onClick={handleDismiss}
        title="Dismiss"
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
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
        <XIcon size={13} weight="bold" />
      </button>
    </div>
  )
}



