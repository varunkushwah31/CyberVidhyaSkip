import type { SubjectAttendance } from "~types"
import { StatusPill } from "./StatusPill"

interface CourseCardProps {
  readonly subject: SubjectAttendance
}

function getBarColor(status: SubjectAttendance["status"], isBoundary: boolean): string {
  if (status === "no_classes") {
    return "#94a3b8"
  }
  if (status === "deficit") {
    return "#ef4444"
  }
  if (isBoundary) {
    return "#f59e0b"
  }
  return "#10b981"
}

export function CourseCard({ subject }: Readonly<CourseCardProps>) {
  const isSafe = subject.percentage >= 75
  const isBoundary = isSafe && (subject.percentage === 75 || subject.actionCount === 0)
  const barColor = getBarColor(subject.status, isBoundary)
  const progressWidth = Math.min(100, Math.max(0, subject.percentage))

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        border: "1px solid #e2e8f0",
        transition: "all 0.15s ease"
      }}>
      {/* Top Meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {subject.courseCode && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
                letterSpacing: "0.02em"
              }}>
              {subject.courseCode}
            </span>
          )}
          {subject.component && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "#f1f5f9",
                color: "#475569"
              }}>
              {subject.component}
            </span>
          )}
          {subject.credit !== undefined && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#64748b"
              }}>
              {subject.credit} Cr
            </span>
          )}
        </div>

        <StatusPill status={subject.status} message={subject.message} />
      </div>

      {/* Subject Name */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#1e293b",
          marginBottom: 10,
          lineHeight: 1.35
        }}>
        {subject.subjectName}
      </div>

      {/* Progress Bar with 75% target indicator */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            position: "relative",
            height: 6,
            backgroundColor: "#f1f5f9",
            borderRadius: 9999,
            overflow: "hidden"
          }}>
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              backgroundColor: barColor,
              borderRadius: 9999,
              transition: "width 0.4s ease"
            }}
          />
          {/* 75% Marker Line */}
          <div
            style={{
              position: "absolute",
              left: "75%",
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: "rgba(15, 23, 42, 0.35)",
              zIndex: 2
            }}
            title="75% Target"
          />
        </div>
      </div>

      {/* Stats Breakdown */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "#64748b"
        }}>
        <div>
          {subject.total > 0 ? (
            <span>
              Attended: <strong style={{ color: "#0f172a" }}>{subject.attended}</strong>
              {" / "}
              {subject.total}
              {subject.missed > 0 && <span>{` (Missed: ${subject.missed})`}</span>}
            </span>
          ) : (
            <span>No conducted classes recorded</span>
          )}
        </div>

        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: barColor
          }}>
          {subject.percentage}%
        </span>
      </div>
    </div>
  )
}
