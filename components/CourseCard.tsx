import type { AppTheme } from "~constants/theme"
import type { SubjectAttendance } from "~types"
import { StatusPill } from "./StatusPill"

interface CourseCardProps {
  readonly subject: SubjectAttendance
  readonly theme: AppTheme
}

export function CourseCard({ subject, theme }: Readonly<CourseCardProps>) {
  const isSafe = subject.percentage >= 75
  const isBoundary = isSafe && (subject.percentage === 75 || subject.actionCount === 0)

  let statusKey: "deficit" | "boundary" | "surplus" | "no_classes" = "surplus"
  if (subject.status === "no_classes") {
    statusKey = "no_classes"
  } else if (subject.status === "deficit") {
    statusKey = "deficit"
  } else if (isBoundary) {
    statusKey = "boundary"
  }

  const currentStatusColors = theme.statusColors[statusKey]
  const progressWidth = Math.min(100, Math.max(0, subject.percentage))

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 12,
        padding: "11px 13px",
        marginBottom: 8,
        boxShadow: theme.cardShadow,
        border: `1px solid ${theme.cardBorder}`,
        transition: "all 0.15s ease",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.cardHoverBorder
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.cardBorder
        e.currentTarget.style.transform = "none"
      }}>
      {/* Top Meta row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {subject.courseCode && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 6,
                backgroundColor: theme.metricBg,
                color: theme.textPrimary,
                border: `1px solid ${theme.metricBorder}`,
                letterSpacing: "0.04em",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }}>
              {subject.courseCode}
            </span>
          )}
          {(subject.component || subject.credit !== undefined) && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                color: theme.textSecondary,
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}>
              {subject.component && (
                <span>
                  {subject.component.charAt(0).toUpperCase() +
                    subject.component.slice(1).toLowerCase()}
                </span>
              )}
              {subject.component && subject.credit !== undefined && (
                <span style={{ color: theme.textMuted }}>•</span>
              )}
              {subject.credit !== undefined && (
                <span style={{ color: theme.textMuted }}>{subject.credit} Cr</span>
              )}
            </span>
          )}
        </div>

        <StatusPill status={subject.status} message={subject.message} theme={theme} />
      </div>

      {/* Subject Name */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: theme.textPrimary,
          marginBottom: 9,
          lineHeight: 1.35,
          letterSpacing: "-0.015em"
        }}>
        {subject.subjectName}
      </div>

      {/* Progress Bar with 75% target benchmark line */}
      <div style={{ position: "relative", marginBottom: 9 }}>
        <div
          style={{
            position: "relative",
            height: 6,
            backgroundColor: theme.progressBarBg,
            borderRadius: 9999,
            overflow: "hidden"
          }}>
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              background: currentStatusColors.gradient,
              borderRadius: 9999,
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: isSafe ? "0 1px 4px rgba(16, 185, 129, 0.25)" : "none"
            }}
          />
        </div>
        {/* 75% Target Marker Notch */}
        <div
          style={{
            position: "absolute",
            left: "75%",
            top: -2,
            bottom: -2,
            width: 1.5,
            backgroundColor: theme.textMuted,
            opacity: 0.5,
            borderRadius: 1,
            zIndex: 2
          }}
          title="75% Requirement"
        />
      </div>

      {/* Stats Breakdown Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: theme.textSecondary
        }}>
        <div>
          {subject.total > 0 ? (
            <span>
              Attended{" "}
              <strong
                style={{
                  color: theme.textPrimary,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums"
                }}>
                {subject.attended}
              </strong>{" "}
              of{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{subject.total}</span>
              {subject.missed > 0 && (
                <span
                  style={{
                    color: theme.statusColors.deficit.solid,
                    fontWeight: 600,
                    marginLeft: 6,
                    fontVariantNumeric: "tabular-nums"
                  }}>
                  • {subject.missed} missed
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: theme.textMuted }}>No conducted classes</span>
          )}
        </div>

        <span
          style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: currentStatusColors.solid,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em"
          }}>
          {subject.percentage}%
        </span>
      </div>
    </div>
  )
}

