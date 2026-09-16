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
  const isSafe = aggregatePercentage >= 75
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)

  // Circular progress math (radius: 28, circumference: ~175.93)
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const clampedPercent = Math.min(100, Math.max(0, aggregatePercentage))
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference

  const statusTheme = isSafe ? theme.statusColors.surplus : theme.statusColors.deficit

  return (
    <div
      style={{
        flexShrink: 0,
        backgroundColor: theme.cardBg,
        margin: "10px 14px 10px 14px",
        borderRadius: 16,
        padding: "14px 16px",
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease"
      }}>
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: isSafe
            ? "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%)",
          pointerEvents: "none"
        }}
      />

      {/* Main Top Section: Circular Ring + Key Metrics */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 12,
          position: "relative",
          zIndex: 1
        }}>
        {/* Apple Fitness style Circular Progress Ring */}
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
            {/* Background Track */}
            <circle
              cx={34}
              cy={34}
              r={radius}
              fill="transparent"
              stroke={theme.progressBarBg}
              strokeWidth={5.5}
            />
            {/* Active Progress Ring */}
            <circle
              cx={34}
              cy={34}
              r={radius}
              fill="transparent"
              stroke={statusTheme.solid}
              strokeWidth={5.5}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </svg>

          {/* Centered Percentage inside Ring */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: theme.textPrimary,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
                lineHeight: 1
              }}>
              {aggregatePercentage}%
            </span>
          </div>
        </div>

        {/* Right Info Section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4
            }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}>
              Overall Attendance
            </span>

            {/* Dynamic Status Pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2.5px 8px",
                borderRadius: 9999,
                backgroundColor: statusTheme.bg,
                color: statusTheme.text,
                border: `1px solid ${statusTheme.border}`,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.02em"
              }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: statusTheme.solid,
                  boxShadow: `0 0 5px ${statusTheme.solid}`
                }}
              />
              {isSafe ? (
                <>
                  <ShieldCheckIcon size={11} weight="bold" />
                  <span>SAFE ZONE</span>
                </>
              ) : (
                <>
                  <WarningCircleIcon size={11} weight="bold" />
                  <span>AT RISK</span>
                </>
              )}
            </span>
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: statusTheme.text,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2
            }}>
            {aggregatePercentage}%{" "}
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: theme.textMuted,
                letterSpacing: 0
              }}>
              (Target: 75%)
            </span>
          </div>

          <div
            style={{
              fontSize: 11,
              color: theme.textSecondary,
              marginTop: 2,
              fontWeight: 500
            }}>
            {isSafe ? "Meeting minimum 75% attendance criterion" : `${detentionCount} course(s) require urgent attendance`}
          </div>
        </div>
      </div>

      {/* Unified Stats Bar with hairline dividers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: theme.metricBg,
          border: `1px solid ${theme.metricBorder}`,
          borderRadius: 10,
          padding: "7px 4px",
          position: "relative",
          zIndex: 1
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
              fontSize: 13.5,
              fontWeight: 700,
              color: theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalAttended}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: theme.metricBorder }} />

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
              fontSize: 13.5,
              fontWeight: 700,
              color: totalMissed > 0 ? theme.statusColors.deficit.solid : theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalMissed}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: theme.metricBorder }} />

        {/* Total */}
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
              fontSize: 13.5,
              fontWeight: 700,
              color: theme.textPrimary,
              marginTop: 1,
              fontVariantNumeric: "tabular-nums"
            }}>
            {totalClasses}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: theme.metricBorder }} />

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
              fontSize: 13.5,
              fontWeight: 700,
              color:
                detentionCount > 0
                  ? theme.statusColors.deficit.solid
                  : theme.statusColors.surplus.solid,
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

