import { InfoIcon, ShieldCheckIcon, WarningCircleIcon, WarningIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"
import type { AttendanceStatus } from "~types"

interface StatusPillProps {
  readonly status: AttendanceStatus
  readonly message: string
  readonly theme?: AppTheme
}

export function StatusPill({ status, message, theme }: Readonly<StatusPillProps>) {
  let Icon = ShieldCheckIcon

  if (status === "deficit") {
    Icon = WarningCircleIcon
  } else if (status === "boundary") {
    Icon = WarningIcon
  } else if (status === "no_classes") {
    Icon = InfoIcon
  }

  // Use theme colors if provided, else fallback to sleek modern colors
  const statusColor = theme?.statusColors?.[status]
  const bg = statusColor ? statusColor.bg : status === "deficit" ? "rgba(244, 63, 94, 0.12)" : status === "boundary" ? "rgba(245, 158, 11, 0.12)" : status === "no_classes" ? "rgba(148, 163, 184, 0.12)" : "rgba(16, 185, 129, 0.12)"
  const color = statusColor ? statusColor.text : status === "deficit" ? "#fb7185" : status === "boundary" ? "#fbbf24" : status === "no_classes" ? "#94a3b8" : "#34d399"
  const border = statusColor ? statusColor.border : status === "deficit" ? "rgba(251, 113, 133, 0.25)" : status === "boundary" ? "rgba(251, 191, 36, 0.25)" : status === "no_classes" ? "rgba(148, 163, 184, 0.25)" : "rgba(52, 211, 153, 0.25)"

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 9999,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.01em",
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        lineHeight: 1.2,
        whiteSpace: "nowrap"
      }}>
      <Icon size={11} weight="bold" />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{message}</span>
    </span>
  )
}

