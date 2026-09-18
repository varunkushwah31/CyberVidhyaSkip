import { getPortalAttendanceUrl } from "~utils/portal-utils";





const WIDGET_ID = "cv-floating-attendance-widget"
const DISMISSED_KEY = "cv_floating_widget_dismissed"

let isDismissed = false

// Check persisted dismissal status
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get([DISMISSED_KEY], (res) => {
    if (res?.[DISMISSED_KEY] === true) {
      isDismissed = true
      removeFloatingWidget()
    }
  })
}

export function removeFloatingWidget(): void {
  const existing = document.getElementById(WIDGET_ID)
  if (existing) existing.remove()
}

/**
 * Injects or updates a native-styled floating attendance tab on CyberVidhya.
 * Designed to seamlessly blend with CyberVidhya ERP's clean, light-mode institutional aesthetic:
 * Pure white card surface, subtle slate border, refined typography, and matching badge colors.
 */
export function renderFloatingWidget(
  percentage: number,
  detentionCount: number,
  totalClasses: number,
  bufferSkips = 0
): void {
  if (isDismissed || typeof document === "undefined" || !document.body) return
  if (totalClasses <= 0 && percentage <= 0) return

  let widget = document.getElementById(WIDGET_ID)

  const isDeficit = detentionCount > 0 || percentage < 75
  const isBoundary = !isDeficit && (percentage === 75 || bufferSkips === 0)

  // Align with CyberVidhya table badge design tokens
  const badgeTheme = isDeficit
    ? {
        bg: "#fff1f2",
        text: "#9f1239",
        border: "#fecdd3",
        icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        label: detentionCount > 0 ? `${detentionCount} Risk` : "Below 75%"
      }
    : isBoundary
      ? {
          bg: "#fffbeb",
          text: "#92400e",
          border: "#fde68a",
          icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
          label: "Don't miss!"
        }
      : {
          bg: "#ecfdf5",
          text: "#065f46",
          border: "#a7f3d0",
          icon: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
          label: bufferSkips > 0 ? `Can miss ${bufferSkips}` : "Safe"
        }

  if (!widget) {
    widget = document.createElement("div")
    widget.id = WIDGET_ID
    widget.title = "CyberVidhya Attendance Tracker • Click to view My Attendance"
    widget.style.position = "fixed"
    widget.style.bottom = "18px"
    widget.style.right = "22px"
    widget.style.zIndex = "99999"
    widget.style.display = "flex"
    widget.style.alignItems = "center"
    widget.style.gap = "8px"
    widget.style.padding = "5px 10px 5px 10px"
    widget.style.borderRadius = "9999px"
    widget.style.backgroundColor = "#ffffff"
    widget.style.border = "1px solid #e2e8f0"
    widget.style.boxShadow =
      "0 4px 14px -1px rgba(15, 23, 42, 0.09), 0 2px 5px -1px rgba(15, 23, 42, 0.04)"
    widget.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    widget.style.cursor = "pointer"
    widget.style.userSelect = "none"
    widget.style.transition =
      "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease"

    widget.onmouseenter = () => {
      if (widget) {
        widget.style.transform = "translateY(-2px)"
        widget.style.boxShadow =
          "0 8px 22px -2px rgba(15, 23, 42, 0.13), 0 3px 7px -1px rgba(15, 23, 42, 0.06)"
        widget.style.borderColor = "#cbd5e1"
      }
    }
    widget.onmouseleave = () => {
      if (widget) {
        widget.style.transform = "translateY(0)"
        widget.style.boxShadow =
          "0 4px 14px -1px rgba(15, 23, 42, 0.09), 0 2px 5px -1px rgba(15, 23, 42, 0.04)"
        widget.style.borderColor = "#e2e8f0"
      }
    }

    // Clicking widget navigates to /attendance/my-attendance
    widget.onclick = (e) => {
      const target = e.target as HTMLElement | null
      if (target?.closest(".cv-widget-close")) {
        e.stopPropagation()
        isDismissed = true
        removeFloatingWidget()
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set({ [DISMISSED_KEY]: true })
        }
        return
      }

      const attendanceUrl = getPortalAttendanceUrl(window.location.href)
      if (window.location.href !== attendanceUrl) {
        window.location.href = attendanceUrl
      }
    }

    document.body.appendChild(widget)
  }

  const safePercentage =
    typeof percentage === "number" && !Number.isNaN(percentage) ? percentage : 0

  widget.innerHTML = `
    <!-- Mini Brand Icon Accent -->
    <div style="width:22px;height:22px;border-radius:6px;background-color:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    </div>

    <!-- Attendance Percentage Numerals -->
    <span style="font-size:12.5px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;letter-spacing:-0.015em;line-height:1;">
      ${safePercentage.toFixed(1)}%
    </span>

    <!-- Native-styled Status Badge -->
    <span style="display:inline-flex;align-items:center;background-color:${badgeTheme.bg};color:${badgeTheme.text};border:1px solid ${badgeTheme.border};padding:2px 8px;border-radius:9999px;font-size:10.5px;font-weight:600;letter-spacing:0.01em;line-height:1.2;">
      ${badgeTheme.icon}
      <span>${badgeTheme.label}</span>
    </span>

    <!-- Popout Arrow -->
    <div style="display:flex;align-items:center;color:#94a3b8;margin-left:-2px;" title="Open attendance page">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </div>

    <!-- Soft Vertical Divider -->
    <div style="width:1px;height:14px;background-color:#e2e8f0;margin:0 1px;"></div>

    <!-- Delicate Dismiss Button -->
    <span class="cv-widget-close" title="Dismiss floating tab" style="display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;color:#94a3b8;font-size:13px;line-height:1;transition:background-color 0.15s ease, color 0.15s ease;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </span>
  `

  const closeBtn = widget.querySelector<HTMLElement>(".cv-widget-close")
  if (closeBtn) {
    closeBtn.onmouseenter = () => {
      closeBtn.style.backgroundColor = "#f1f5f9"
      closeBtn.style.color = "#334155"
    }
    closeBtn.onmouseleave = () => {
      closeBtn.style.backgroundColor = "transparent"
      closeBtn.style.color = "#94a3b8"
    }
  }
}
