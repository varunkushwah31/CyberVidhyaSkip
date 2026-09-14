import { ShieldCheckIcon, WarningCircleIcon } from "@phosphor-icons/react"
import type { SubjectAttendance } from "~types"

interface AttendanceOverviewProps {
  readonly aggregatePercentage: number
  readonly activeSubjects: readonly SubjectAttendance[]
  readonly detentionCount: number
}

export function AttendanceOverview({
  aggregatePercentage,
  activeSubjects,
  detentionCount
}: Readonly<AttendanceOverviewProps>) {
  const isSafe = aggregatePercentage >= 75
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        margin: "12px 16px 8px 16px",
        borderRadius: 14,
        padding: "14px 16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)"
      }}>
      {/* Top Banner Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
            Aggregate Attendance
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: isSafe ? "#0f766e" : "#be123c"
              }}>
              {aggregatePercentage}%
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              (Target: 75%)
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 8,
            backgroundColor: isSafe ? "#ecfdf5" : "#fff1f2",
            color: isSafe ? "#047857" : "#be123c",
            border: `1px solid ${isSafe ? "#a7f3d0" : "#fecdd3"}`,
            fontSize: 12,
            fontWeight: 600
          }}>
          {isSafe ? (
            <>
              <ShieldCheckIcon size={16} weight="bold" />
              <span>Safe Zone</span>
            </>
          ) : (
            <>
              <WarningCircleIcon size={16} weight="bold" />
              <span>Detention Risk</span>
            </>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9"
        }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Attended</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 1 }}>
            {totalAttended}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Missed</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#be123c", marginTop: 1 }}>
            {totalMissed}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Conducted</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 1 }}>
            {totalClasses}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>At Risk</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: detentionCount > 0 ? "#be123c" : "#047857",
              marginTop: 1
            }}>
            {detentionCount}
          </div>
        </div>
      </div>
    </div>
  )
}
