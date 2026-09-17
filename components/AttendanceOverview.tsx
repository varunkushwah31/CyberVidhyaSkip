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

  // Circular gauge math (radius: 26, circumference: ~163.36)
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clampedPercent = Math.min(100, Math.max(0, aggregatePercentage))
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference

  const statusTheme = isSafe ? theme.statusColors.surplus : theme.statusColors.deficit
  const diffPercent = Math.abs(aggregatePercentage - 75).toFixed(1)

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
        position: "relative",
        boxSizing: "border-box"
      }}>
      {/* Primary Row: Gauge + Actionable Skip Intelligence */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 11
        }}>
        {/* Precision Progress Ring */}
        <div style={{ position: "relative", width: 62, height: 62, flexShrink: 0 }}>
          <svg width={62} height={62} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={31}
              cy={31}
              r={radius}
              fill="transparent"
              stroke={theme.progressBarBg}
              strokeWidth={5}
            />
            <circle
              cx={31}
              cy={31}
              r={radius}
              fill="transparent"
              stroke={statusTheme.solid}
              strokeWidth={5}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>

          {/* Centered Percentage inside Ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: theme.textPrimary,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em"
              }}>
              {aggregatePercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Intelligence Lockup */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 3
            }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
              Aggregate
            </span>

            {/* Quiet Status Pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: 9999,
                backgroundColor: statusTheme.bg,
                color: statusTheme.text,
                border: `1px solid ${statusTheme.border}`,
                fontSize: 9.5,
                fontWeight: 600,
                lineHeight: 1.2
              }}>
              <span
                style={{
                  width: 4.5,
                  height: 4.5,
                  borderRadius: "50%",
                  backgroundColor: statusTheme.solid
                }}
              />
              <span>
                {isSafe ? `Safe (+${diffPercent}%)` : `Deficit (-${diffPercent}%)`}
              </span>
            </span>
          </div>

          {/* Decisive Primary Message */}
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: "-0.015em",
              color: theme.textPrimary,
              lineHeight: 1.25
            }}>
            {isSafe ? (
              bufferClasses > 0 ? (
                <span>
                  Can skip{" "}
                  <strong style={{ color: statusTheme.text }}>
                    {bufferClasses} class{bufferClasses > 1 ? "es" : ""}
                  </strong>
                </span>
              ) : (
                <span style={{ color: theme.textPrimary }}>
                  On 75% boundary
                </span>
              )
            ) : (
              <span>
                Attend next{" "}
                <strong style={{ color: statusTheme.text }}>
                  {neededClasses} class{neededClasses > 1 ? "es" : ""}
                </strong>
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 10.5,
              color: theme.textSecondary,
              marginTop: 2,
              fontWeight: 400
            }}>
            {isSafe
              ? "Maintains mandatory 75% attendance"
              : `${detentionCount} course${detentionCount > 1 ? "s" : ""} currently below 75%`}
          </div>
        </div>
      </div>

      {/* 4-Column Metric Strip with Hairline Dividers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: theme.metricBg,
          border: `1px solid ${theme.metricBorder}`,
          borderRadius: 8,
          padding: "6px 2px"
        }}>
        {/* Attended */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
            Attended
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalAttended}
          </div>
        </div>

        <div style={{ width: 1, height: 16, backgroundColor: theme.divider }} />

        {/* Missed */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
            Missed
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: totalMissed > 0 ? theme.statusColors.deficit.solid : theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalMissed}
          </div>
        </div>

        <div style={{ width: 1, height: 16, backgroundColor: theme.divider }} />

        {/* Total Conducted */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
            Total
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalClasses}
          </div>
        </div>

        <div style={{ width: 1, height: 16, backgroundColor: theme.divider }} />

        {/* At Risk */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
            At Risk
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: detentionCount > 0 ? theme.statusColors.deficit.solid : theme.textMuted,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {detentionCount}
          </div>
        </div>
      </div>
    </div>
  )
}
