import type { SubjectAttendance } from "~types"
import { StatusPill } from "./StatusPill"

interface CourseCardProps {
  readonly subject: SubjectAttendance
}

function getBarColor(status: SubjectAttendance["status"], isBoundary: boolean): string {
  if (status === "no_classes") {
    return "#6c757d"
  }
  if (status === "deficit") {
    return "#dc3545"
  }
  if (isBoundary) {
    return "#ffc107"
  }
  return "#28a745"
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
        borderRadius: 4,
        padding: "10px 12px",
        marginBottom: 7,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        border: "1px solid #dee2e6",
        transition: "all 0.15s ease"
      }}>
      {/* Top Meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {subject.courseCode && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 5px",
                borderRadius: 3,
                backgroundColor: "#f8f9fa",
                color: "#212529",
                border: "1px solid #ced4da",
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
                padding: "2px 5px",
                borderRadius: 3,
                backgroundColor: "#e7f1ff",
                color: "#007bff",
                border: "1px solid #b6d4fe"
              }}>
              {subject.component}
            </span>
          )}
          {subject.credit !== undefined && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#6c757d"
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
          fontSize: 12.5,
          fontWeight: 600,
          color: "#212529",
          marginBottom: 7,
          lineHeight: 1.35
        }}>
        {subject.subjectName}
      </div>

      {/* Progress Bar with 75% target indicator */}
      <div style={{ marginBottom: 7 }}>
        <div
          style={{
            position: "relative",
            height: 5,
            backgroundColor: "#e9ecef",
            borderRadius: 2,
            overflow: "hidden"
          }}>
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              backgroundColor: barColor,
              borderRadius: 2,
              transition: "width 0.3s ease"
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
              backgroundColor: "#343a40",
              opacity: 0.35,
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
          color: "#495057"
        }}>
        <div>
          {subject.total > 0 ? (
            <span>
              Attended: <strong style={{ color: "#212529" }}>{subject.attended}</strong>
              {" / "}
              {subject.total}
              {subject.missed > 0 && (
                <span style={{ color: "#dc3545" }}>{` (Missed: ${subject.missed})`}</span>
              )}
            </span>
          ) : (
            <span style={{ color: "#6c757d" }}>No conducted classes</span>
          )}
        </div>

        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: barColor
          }}>
          {subject.percentage}%
        </span>
      </div>
    </div>
  )
}
