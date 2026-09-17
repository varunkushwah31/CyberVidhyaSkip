import { ShieldCheckIcon, WarningCircleIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"
import type { SubjectAttendance } from "~types"

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
  const isAggregateSafe = aggregatePercentage >= 75
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)

  // Deficit courses analysis
  const deficitSubjects = activeSubjects.filter((s) => s.status === "deficit" || s.percentage < 75)
  const hasDeficit = detentionCount > 0 || deficitSubjects.length > 0
  const deficitCount = Math.max(detentionCount, deficitSubjects.length)
  const classesNeededToRecover = deficitSubjects.reduce((acc, s) => {
    return acc + Math.max(1, Math.ceil(3 * s.total - 4 * s.attended))
  }, 0)

  // Strict 75% aggregate buffer calculation
  let aggregateBufferClasses = 0
  let aggregateNeededClasses = 0
  if (totalClasses > 0) {
    if (isAggregateSafe) {
      aggregateBufferClasses = Math.max(0, Math.floor((4 * totalAttended - 3 * totalClasses) / 3))
    } else {
      aggregateNeededClasses = Math.max(1, 3 * totalClasses - 4 * totalAttended)
    }
  }

  // Visual status theme - prioritized by course debarment risk
  const statusTheme = hasDeficit
    ? theme.statusColors.deficit
    : isAggregateSafe
      ? theme.statusColors.surplus
      : theme.statusColors.deficit

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
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: theme.textPrimary,
              lineHeight: 1.25
            }}>
            {hasDeficit ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <WarningCircleIcon size={17} weight="fill" style={{ color: theme.statusColors.deficit.solid, flexShrink: 0 }} />
                <span>
                  <strong style={{ color: theme.statusColors.deficit.solid, fontWeight: 700 }}>
                    {deficitCount} {deficitCount === 1 ? "course" : "courses"}
                  </strong>{" "}
                  below 75%
                </span>
              </span>
            ) : isAggregateSafe ? (
              aggregateBufferClasses > 0 ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheckIcon size={17} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
                  <span>
                    Can skip{" "}
                    <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                      {aggregateBufferClasses} {aggregateBufferClasses === 1 ? "class" : "classes"}
                    </strong>
                  </span>
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheckIcon size={17} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
                  <span>On 75% boundary</span>
                </span>
              )
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <WarningCircleIcon size={17} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
                <span>
                  Attend next{" "}
                  <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                    {aggregateNeededClasses} {aggregateNeededClasses === 1 ? "class" : "classes"}
                  </strong>
                </span>
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
            {hasDeficit
              ? `Attend next ${classesNeededToRecover} ${classesNeededToRecover === 1 ? "class" : "classes"} to recover · ${aggregatePercentage.toFixed(1)}% aggregate`
              : isAggregateSafe
                ? `All courses meet 75% rule · ${aggregatePercentage.toFixed(1)}% aggregate`
                : `${aggregatePercentage.toFixed(1)}% aggregate · Below 75% requirement`}
          </div>
        </div>

        {/* Clean Percentage Badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
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
          {hasDeficit && <WarningCircleIcon size={12} weight="fill" />}
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
              <strong style={{ color: hasDeficit ? theme.statusColors.deficit.solid : theme.textSecondary, fontWeight: 600 }}>
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
