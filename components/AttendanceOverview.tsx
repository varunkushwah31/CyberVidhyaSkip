import type { AppTheme } from "~constants/theme"
import type { SubjectAttendance } from "~types";
interface AttendanceOverviewProps {
  readonly aggregatePercentage: number
  readonly activeSubjects: readonly SubjectAttendance[]
  readonly detentionCount: number
  readonly theme: AppTheme
}

export function AttendanceOverview({
  aggregatePercentage,
  activeSubjects,
  detentionCount,
  theme
}: Readonly<AttendanceOverviewProps>) {
  const isSafe = aggregatePercentage >= 75
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)

  // Strict 75% mathematical calculations
  let bufferClasses = 0
  let neededClasses = 0
  if (totalClasses > 0) {
    if (isSafe) {
      bufferClasses = Math.max(0, Math.floor((4 * totalAttended - 3 * totalClasses) / 3))
    } else {
      neededClasses = Math.max(1, 3 * totalClasses - 4 * totalAttended)
    }
  }

  const statusTheme = isSafe ? theme.statusColors.surplus : theme.statusColors.deficit
  const progressRatio = Math.min(1, Math.max(0, aggregatePercentage / 100))

  return (
    <div
      style={{
        flexShrink: 0,
        backgroundColor: theme.cardBg,
        margin: "8px 14px 8px 14px",
        borderRadius: 12,
        padding: "13px 15px",
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
        boxSizing: "border-box"
      }}>
      {/* Top Row: Direct Action Verdict + Percentage Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Primary Action Insight */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: theme.textPrimary,
              lineHeight: 1.25
            }}>
            {isSafe ? (
              bufferClasses > 0 ? (
                <span>
                  Can skip{" "}
                  <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                    {bufferClasses} {bufferClasses === 1 ? "class" : "classes"}
                  </strong>
                </span>
              ) : (
                <span>On 75% boundary</span>
              )
            ) : (
              <span>
                Attend next{" "}
                <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                  {neededClasses} {neededClasses === 1 ? "class" : "classes"}
                </strong>
              </span>
            )}
          </div>

          {/* Contextual Status Subtitle */}
          <div
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              marginTop: 3,
              fontWeight: 400,
              lineHeight: 1.4
            }}>
            {isSafe
              ? `${aggregatePercentage.toFixed(1)}% aggregate · 75% requirement met`
              : `${aggregatePercentage.toFixed(1)}% aggregate · ${detentionCount} course${
                  detentionCount > 1 ? "s" : ""
                } below 75%`}
          </div>
        </div>

        {/* Clean Percentage Badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 8px",
            borderRadius: 9999,
            backgroundColor: statusTheme.bg,
            color: statusTheme.text,
            border: `1px solid ${statusTheme.border}`,
            fontSize: 11.5,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
            flexShrink: 0
          }}>
          {aggregatePercentage.toFixed(1)}%
        </span>
      </div>

      {/* Slim, elegant progress track */}
      <div
        style={{
          position: "relative",
          height: 4,
          backgroundColor: theme.progressBarBg,
          borderRadius: 9999,
          overflow: "hidden",
          marginTop: 11,
          marginBottom: 9
        }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: statusTheme.solid,
            borderRadius: 9999,
            transformOrigin: "left",
            transform: `scaleX(${progressRatio})`,
            transition: "transform 0.3s ease-out"
          }}
        />
      </div>

      {/* Balanced meta stats line */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10.5,
          color: theme.textMuted,
          fontVariantNumeric: "tabular-nums"
        }}>
        <span>
          <strong style={{ color: theme.textSecondary, fontWeight: 600 }}>{totalAttended}</strong> attended of{" "}
          <strong style={{ color: theme.textSecondary, fontWeight: 600 }}>{totalClasses}</strong> total
        </span>
        <span>
          {totalMissed > 0 ? (
            <span>
              <strong style={{ color: detentionCount > 0 ? theme.statusColors.deficit.solid : theme.textSecondary, fontWeight: 600 }}>
                {totalMissed}
              </strong>{" "}
              missed
            </span>
          ) : (
            <span>0 missed</span>
          )}
        </span>
      </div>
    </div>
  )
}
