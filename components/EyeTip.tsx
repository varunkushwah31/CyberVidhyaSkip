import { EyeIcon, XIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

import { dismissEyeTip, getEyeTipDismissed } from "~utils/storage"

interface EyeTipProps {
  readonly activeTabId: number | null
  readonly forceVisible?: boolean
  readonly onClose?: () => void
}

export function EyeTip({ activeTabId, forceVisible = false, onClose }: Readonly<EyeTipProps>) {
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
  const isVisible = forceVisible ? true : (ready && !dismissed)
  if (!isVisible) return null

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        margin: "6px 14px 2px 14px",
        padding: "8px 12px",
        borderRadius: 4,
        backgroundColor: "#ffffff",
        border: "1px solid #dee2e6",
        borderLeft: "4px solid #007bff",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
      }}>
      <div
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 3,
          backgroundColor: "#e7f1ff",
          color: "#007bff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1
        }}>
        <EyeIcon size={15} weight="bold" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#212529",
            letterSpacing: "-0.01em"
          }}>
          Accurate Attendance Tracking
        </div>
        <p
          style={{
            margin: "2px 0 0 0",
            fontSize: 11,
            lineHeight: 1.4,
            color: "#495057"
          }}>
          Exact lecture and duty leave (OD) counts are verified from the{" "}
          <strong style={{ color: "#007bff" }}>My Attendance</strong> page or by
          clicking each course's <strong style={{ color: "#212529" }}>eye icon (👁️)</strong>.
        </p>
      </div>

      <button
        onClick={handleDismiss}
        title="Dismiss"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          border: "none",
          borderRadius: 3,
          background: "transparent",
          color: "#6c757d",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0
        }}>
        <XIcon size={13} weight="bold" />
      </button>
    </div>
  )
}


