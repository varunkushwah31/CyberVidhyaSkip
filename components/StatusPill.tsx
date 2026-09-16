import { InfoIcon, ShieldCheckIcon, WarningIcon, WarningCircleIcon } from "@phosphor-icons/react"
import type { AttendanceStatus } from "~types"

interface StatusPillProps {
  readonly status: AttendanceStatus
  readonly message: string
}

export function StatusPill({ status, message }: Readonly<StatusPillProps>) {
  let bg = "#e6f4ea"
  let color = "#137333"
  let border = "#ceead6"
  let Icon = ShieldCheckIcon

  if (status === "deficit") {
    bg = "#fce8e6"
    color = "#c5221f"
    border = "#fad2cf"
    Icon = WarningCircleIcon
  } else if (status === "boundary") {
    bg = "#fff8e1"
    color = "#b06000"
    border = "#ffe082"
    Icon = WarningIcon
  } else if (status === "no_classes") {
    bg = "#f1f3f4"
    color = "#5f6368"
    border = "#dadce0"
    Icon = InfoIcon
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 3,
        fontSize: 10.5,
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
