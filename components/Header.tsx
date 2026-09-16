import { ArrowClockwiseIcon, GraduationCapIcon, InfoIcon } from "@phosphor-icons/react"

interface HeaderProps {
  readonly scanning: boolean
  readonly onScan: () => void
  readonly onToggleTip?: () => void
  readonly tipActive?: boolean
}

export function Header({ scanning, onScan, onToggleTip, tipActive }: Readonly<HeaderProps>) {
  return (
    <div
      style={{
        backgroundColor: "#2b333e",
        color: "#ffffff",
        padding: "13px 18px",
        borderBottom: "2.5px solid #007bff",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: "#007bff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 1px 4px rgba(0, 123, 255, 0.35)"
            }}>
            <GraduationCapIcon size={19} weight="fill" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "#ffffff"
              }}>
              CyberVidhya Attendance
            </h1>
            <p style={{ margin: "1px 0 0 0", fontSize: 11, color: "#adb5bd", fontWeight: 500 }}>
              75% Strict Attendance Planner
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {onToggleTip && (
            <button
              onClick={onToggleTip}
              title="Attendance Info & Tips"
              style={{
                background: tipActive ? "#007bff" : "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
                width: 28,
                height: 28,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}>
              <InfoIcon size={15} weight="bold" />
            </button>
          )}

          <button
            onClick={onScan}
            disabled={scanning}
            title="Rescan Courses"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              color: "#ffffff",
              width: 28,
              height: 28,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: scanning ? "wait" : "pointer",
              transition: "all 0.15s ease"
            }}>
            <ArrowClockwiseIcon
              size={14}
              weight="bold"
              className={scanning ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>
    </div>
  )
}


