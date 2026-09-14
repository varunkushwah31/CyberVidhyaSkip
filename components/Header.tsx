import { ArrowClockwiseIcon, GraduationCapIcon } from "@phosphor-icons/react"

interface HeaderProps {
  readonly scanning: boolean
  readonly onScan: () => void
}

export function Header({ scanning, onScan }: Readonly<HeaderProps>) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #090d16 0%, #171c28 50%, #1e1b4b 100%)",
        color: "#ffffff",
        padding: "16px 20px 14px 20px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)"
            }}>
            <GraduationCapIcon size={20} weight="fill" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#f8fafc"
              }}>
              Bunk Planner
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
              Strict 75% Attendance Guard
            </p>
          </div>
        </div>

        <button
          onClick={onScan}
          disabled={scanning}
          title="Rescan Courses"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#e2e8f0",
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: scanning ? "wait" : "pointer",
            transition: "all 0.15s ease"
          }}>
          <ArrowClockwiseIcon
            size={15}
            weight="bold"
            className={scanning ? "animate-spin" : ""}
          />
        </button>
      </div>
    </div>
  )
}
