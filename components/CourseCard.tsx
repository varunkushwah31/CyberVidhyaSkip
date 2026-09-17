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
  const progressRatio = Math.min(1, Math.max(0, subject.percentage / 100))

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: theme.cardShadow,
        border: `1px solid ${theme.cardBorder}`,
        transition: "border-color 0.15s ease",
        boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.cardHoverBorder
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.cardBorder
      }}>
      {/* Top Row: Course Identity + Status Pill */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 9
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Course Name */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.textPrimary,
              lineHeight: 1.35,
              letterSpacing: "-0.015em"
            }}>
            {subject.subjectName}
          </div>

          {/* Clean Meta Line */}
          <div
            style={{
              fontSize: 10.5,
              color: theme.textSecondary,
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 5
            }}>
            {subject.courseCode && (
              <span
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontWeight: 600,
                  color: theme.textPrimary
                }}>
                {subject.courseCode}
              </span>
            )}
            {subject.courseCode && (subject.component || subject.credit !== undefined) && (
              <span style={{ color: theme.textMuted }}>·</span>
            )}
            {subject.component && (
              <span>
                {subject.component.charAt(0).toUpperCase() +
                  subject.component.slice(1).toLowerCase()}
              </span>
            )}
            {subject.component && subject.credit !== undefined && (
              <span style={{ color: theme.textMuted }}>·</span>
            )}
            {subject.credit !== undefined && (
              <span style={{ color: theme.textMuted }}>{subject.credit} Cr</span>
            )}
          </div>
        </div>

        <StatusPill status={subject.status} message={subject.message} theme={theme} />
      </div>

      {/* Slim Progress Track with 75% Requirement Line */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div
          style={{
            position: "relative",
            height: 4,
            backgroundColor: theme.progressBarBg,
            borderRadius: 9999,
            overflow: "hidden"
          }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: currentStatusColors.solid,
              borderRadius: 9999,
              transformOrigin: "left",
              transform: `scaleX(${progressRatio})`,
              transition: "transform 0.25s ease-out"
            }}
          />
        </div>
        {/* 75% Target Marker */}
        <div
          style={{
            position: "absolute",
            left: "75%",
            top: -2,
            bottom: -2,
            width: 1.5,
            backgroundColor: theme.textMuted,
            opacity: 0.4,
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
          fontSize: 10.5,
          color: theme.textSecondary,
          fontVariantNumeric: "tabular-nums"
        }}>
        <div>
          {subject.total > 0 ? (
            <span>
              Attended{" "}
              <strong
                style={{
                  color: theme.textPrimary,
                  fontWeight: 600
                }}>
                {subject.attended}
              </strong>{" "}
              of {subject.total}
              {subject.missed > 0 && (
                <span
                  style={{
                    color:
                      subject.status === "deficit"
                        ? theme.statusColors.deficit.solid
                        : theme.textMuted,
                    fontWeight: 500,
                    marginLeft: 6
                  }}>
                  · {subject.missed} missed
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: theme.textMuted }}>No conducted classes</span>
          )}
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: currentStatusColors.solid,
            letterSpacing: "-0.01em"
          }}>
          {subject.percentage}%
        </span>
      </div>
    </div>
  )
}

