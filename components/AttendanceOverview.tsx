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
        margin: "8px 14px 6px 14px",
        borderRadius: 4,
        padding: "12px 14px",
        border: "1px solid #dee2e6",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
      }}>
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6
        }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "#007bff",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
          Attendance Overview
        </span>

        {/* Status Pill matching CyberVidhya ACTIVE badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            borderRadius: 3,
            backgroundColor: isSafe ? "#28a745" : "#dc3545",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase"
          }}>
          {isSafe ? (
            <>
              <ShieldCheckIcon size={12} weight="bold" />
              <span>Safe Zone</span>
            </>
          ) : (
            <>
              <WarningCircleIcon size={12} weight="bold" />
              <span>Detention Risk</span>
            </>
          )}
        </span>
      </div>

      {/* Aggregate Attendance Stat */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: isSafe ? "#28a745" : "#dc3545"
          }}>
          {aggregatePercentage}%
        </span>
        <span style={{ fontSize: 11.5, color: "#6c757d", fontWeight: 500 }}>
          (Target: 75%)
        </span>
      </div>

      {/* Metrics Row formatted as Bootstrap mini-cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          paddingTop: 8,
          borderTop: "1px solid #e9ecef"
        }}>
        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: 3,
            padding: "5px 2px"
          }}>
          <div style={{ fontSize: 9.5, color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>
            Attended
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#212529", marginTop: 1 }}>
            {totalAttended}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: 3,
            padding: "5px 2px"
          }}>
          <div style={{ fontSize: 9.5, color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>
            Missed
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: totalMissed > 0 ? "#dc3545" : "#212529",
              marginTop: 1
            }}>
            {totalMissed}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: 3,
            padding: "5px 2px"
          }}>
          <div style={{ fontSize: 9.5, color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>
            Total
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#212529", marginTop: 1 }}>
            {totalClasses}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: 3,
            padding: "5px 2px"
          }}>
          <div style={{ fontSize: 9.5, color: "#6c757d", fontWeight: 600, textTransform: "uppercase" }}>
            At Risk
          </div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: detentionCount > 0 ? "#dc3545" : "#28a745",
              marginTop: 1
            }}>
            {detentionCount}
          </div>
        </div>
      </div>
    </div>
  )
}
