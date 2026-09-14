import { InfoIcon, ShieldCheckIcon, WarningIcon, WarningCircleIcon } from "@phosphor-icons/react"
import type { AttendanceStatus } from "~types"

interface StatusPillProps {
  readonly status: AttendanceStatus
  readonly message: string
}

export function StatusPill({ status, message }: Readonly<StatusPillProps>) {
  let bg = "#ecfdf5"
  let color = "#047857"
  let border = "#a7f3d0"
  let Icon = ShieldCheckIcon

  if (status === "deficit") {
    bg = "#fff1f2"
    color = "#be123c"
    border = "#fecdd3"
    Icon = WarningCircleIcon
  } else if (status === "boundary") {
    bg = "#fffbeb"
    color = "#b45309"
    border = "#fde68a"
    Icon = WarningIcon
  } else if (status === "no_classes") {
    bg = "#f1f5f9"
    color = "#475569"
    border = "#cbd5e1"
    Icon = InfoIcon
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        lineHeight: 1.2
      }}>
      <Icon size={12} weight="bold" />
      <span>{message}</span>
    </span>
  )
}
