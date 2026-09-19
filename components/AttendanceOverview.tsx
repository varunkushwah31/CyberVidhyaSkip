import { ArrowCounterClockwiseIcon, CalendarCheckIcon, ShieldCheckIcon, WarningCircleIcon } from "@phosphor-icons/react";



import type { AppTheme } from "~constants/theme";
import type { SubjectAttendance } from "~types";





interface AttendanceOverviewProps {
  readonly aggregatePercentage: number
  readonly activeSubjects: readonly SubjectAttendance[]
  readonly detentionCount: number
  readonly theme: AppTheme
  readonly isSimulated?: boolean
  readonly originalAggregate?: number
  readonly onResetAllSimulations?: () => void
  readonly onSimulateTomorrowLeave?: () => void
  readonly onRevertTomorrowLeave?: () => void
  readonly isTomorrowLeaveSimulated?: boolean
}

export function AttendanceOverview({
  aggregatePercentage,
  activeSubjects,
  detentionCount,
  theme,
  isSimulated = false,
  originalAggregate,
  onResetAllSimulations,
  onSimulateTomorrowLeave,
  onRevertTomorrowLeave,
  isTomorrowLeaveSimulated = false
}: Readonly<AttendanceOverviewProps>) {
  const safeAggregate =
    typeof aggregatePercentage === "number" &&
    !Number.isNaN(aggregatePercentage)
      ? aggregatePercentage
      : 0
  const safeActiveSubjects = activeSubjects || []
  const safeDetentionCount = detentionCount || 0

  const isAggregateSafe = safeAggregate >= 75
  const totalAttended = safeActiveSubjects.reduce((acc, s) => acc + (s.attended || 0), 0)
  const totalMissed = safeActiveSubjects.reduce((acc, s) => acc + (s.missed || 0), 0)
  const totalClasses = safeActiveSubjects.reduce((acc, s) => acc + (s.total || 0), 0)

  // Deficit courses analysis
  const deficitSubjects = safeActiveSubjects.filter((s) => s.status === "deficit" || (s.percentage || 0) < 75)
  const hasDeficit = safeDetentionCount > 0 || deficitSubjects.length > 0
  const deficitCount = Math.max(safeDetentionCount, deficitSubjects.length)
  const classesNeededToRecover = deficitSubjects.reduce((acc, s) => {
    return acc + Math.max(1, Math.ceil(3 * (s.total || 0) - 4 * (s.attended || 0)))
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

  const progressRatio = Math.min(1, Math.max(0, safeAggregate / 100))
  const safeOriginal =
    typeof originalAggregate === "number" && !Number.isNaN(originalAggregate)
      ? originalAggregate
      : undefined
  const aggregateDelta =
    isSimulated && safeOriginal !== undefined
      ? Number((safeAggregate - safeOriginal).toFixed(1))
      : 0


  return (
    <div
      style={{
        flexShrink: 0,
        backgroundColor: isSimulated ? theme.cardBg : theme.overviewAccentBg,
        margin: "8px 14px 8px 14px",
        borderRadius: 12,
        padding: "14px 15px 12px 15px",
        border: isSimulated
          ? `1px dashed ${theme.accent}`
          : `1px solid ${theme.overviewAccentBorder}`,
        boxShadow: theme.cardShadow,
        boxSizing: "border-box",
        transition: "all 0.2s ease"
      }}>
      {/* Simulation Banner when active */}
      {isSimulated && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
            marginBottom: 10,
            borderRadius: 7,
            backgroundColor:
              theme.name === "dark"
                ? "rgba(99, 102, 241, 0.16)"
                : "rgba(79, 70, 229, 0.08)",
            border: `1px solid ${theme.accent}33`,
            fontSize: 10,
            color: theme.accent
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
            <span>⚡ What-If Simulation Active</span>
            {safeOriginal !== undefined && (
              <span style={{ color: theme.textSecondary, fontWeight: 500 }}>
                ({safeOriginal.toFixed(1)}% &rarr; {safeAggregate.toFixed(1)}%)
              </span>
            )}
          </div>
          {onResetAllSimulations && (
            <button
              type="button"
              onClick={onResetAllSimulations}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: "none",
                border: "none",
                color: theme.statusColors.deficit.solid,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 4px"
              }}>
              <ArrowCounterClockwiseIcon size={11} weight="bold" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      )}

      {/* Top Row: Hero Percentage + Action Verdict */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14
        }}>
        {/* Hero Percentage Numeral */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 3,
            flexShrink: 0
          }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: statusTheme.solid,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              transition: "color 0.2s ease"
            }}>
            {safeAggregate.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: statusTheme.solid,
              opacity: 0.7
            }}>
            %
          </span>
          {isSimulated && aggregateDelta !== 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: aggregateDelta > 0 ? theme.statusColors.surplus.solid : theme.statusColors.deficit.solid,
                marginLeft: 4
              }}>
              {aggregateDelta > 0 ? `+${aggregateDelta}` : aggregateDelta}%
            </span>
          )}
        </div>

        {/* Action Verdict */}
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          {/* Primary Action Insight */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: theme.textPrimary,
              lineHeight: 1.25
            }}>
            {hasDeficit ? (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                <span>
                  <strong style={{ color: theme.statusColors.deficit.solid, fontWeight: 700 }}>
                    {deficitCount} {deficitCount === 1 ? "course" : "courses"}
                  </strong>{" "}
                  below 75%
                </span>
                <WarningCircleIcon size={15} weight="fill" style={{ color: theme.statusColors.deficit.solid, flexShrink: 0 }} />
              </span>
            ) : isAggregateSafe ? (
              aggregateBufferClasses > 0 ? (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                  <span>
                    Can skip{" "}
                    <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                      {aggregateBufferClasses} {aggregateBufferClasses === 1 ? "class" : "classes"}
                    </strong>
                  </span>
                  <ShieldCheckIcon size={15} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                  <span>On 75% boundary</span>
                  <ShieldCheckIcon size={15} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
                </span>
              )
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                <span>
                  Attend next{" "}
                  <strong style={{ color: statusTheme.solid, fontWeight: 700 }}>
                    {aggregateNeededClasses} {aggregateNeededClasses === 1 ? "class" : "classes"}
                  </strong>
                </span>
                <WarningCircleIcon size={15} weight="fill" style={{ color: statusTheme.solid, flexShrink: 0 }} />
              </span>
            )}
          </div>

          {/* Contextual Status Subtitle */}
          <div
            style={{
              fontSize: 10.5,
              color: theme.textSecondary,
              marginTop: 2,
              fontWeight: 400,
              lineHeight: 1.4
            }}>
            {hasDeficit
              ? `Attend next ${classesNeededToRecover} to recover`
              : isAggregateSafe
                ? "All courses meet 75% rule"
                : "Below 75% requirement"}
          </div>
        </div>
      </div>

      {/* Thicker progress track with inner glow */}
      <div
        style={{
          position: "relative",
          height: 6,
          backgroundColor: theme.progressBarBg,
          borderRadius: 9999,
          overflow: "hidden",
          marginTop: 12,
          marginBottom: 10
        }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: statusTheme.solid,
            borderRadius: 9999,
            transformOrigin: "left",
            transform: `scaleX(${progressRatio})`,
            transition: "transform 0.3s ease-out",
            boxShadow: theme.progressBarGlow
          }}
        />
      </div>

      {/* Balanced meta stats line + Leave Simulator Action */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          color: theme.textMuted,
          fontVariantNumeric: "tabular-nums"
        }}>
        <span>
          <strong style={{ color: theme.textSecondary, fontWeight: 600 }}>{totalAttended}</strong> attended of{" "}
          <strong style={{ color: theme.textSecondary, fontWeight: 600 }}>{totalClasses}</strong> total
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onSimulateTomorrowLeave && (
            <button
              type="button"
              onClick={isTomorrowLeaveSimulated ? onRevertTomorrowLeave : onSimulateTomorrowLeave}
              title="Test the impact of missing 1 class in every active subject tomorrow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: `1px solid ${
                  isTomorrowLeaveSimulated ? theme.accent : theme.inputBorder
                }`,
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 9.5,
                fontWeight: 600,
                color: isTomorrowLeaveSimulated ? theme.accent : theme.textSecondary,
                cursor: "pointer",
                backgroundColor: isTomorrowLeaveSimulated
                  ? theme.name === "dark"
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(79, 70, 229, 0.08)"
                  : "transparent",
                transition: "all 0.15s ease"
              }}>
              <CalendarCheckIcon size={11} weight="bold" />
              <span>{isTomorrowLeaveSimulated ? "Revert Tomorrow" : "Skip Tomorrow?"}</span>
            </button>
          )}

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
    </div>
  )
}
