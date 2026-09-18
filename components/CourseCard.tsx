import { ArrowCounterClockwiseIcon, MinusIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";



import type { AppTheme } from "~constants/theme";
import type { CourseSimulation, SimulatedSubjectAttendance } from "~types";
import { computeSemesterBudget, computeSimulatedMetrics } from "~utils/attendance-calculator";



import { StatusPill } from "./StatusPill";


interface CourseCardProps {
  readonly subject: SimulatedSubjectAttendance
  readonly theme: AppTheme
  readonly simulation?: CourseSimulation
  readonly onSimulateChange?: (subjectId: string, sim: CourseSimulation) => void
  readonly onResetSimulation?: (subjectId: string) => void
}

export function CourseCard({
  subject,
  theme,
  simulation,
  onSimulateChange,
  onResetSimulation
}: Readonly<CourseCardProps>) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeSim = simulation || { extraAttended: 0, extraMissed: 0, pendingOD: 0 }
  const isSimulated =
    activeSim.extraAttended !== 0 ||
    activeSim.extraMissed !== 0 ||
    activeSim.pendingOD !== 0

  const safeSubjectAttended = typeof subject.attended === "number" ? subject.attended : 0
  const safeSubjectTotal = typeof subject.total === "number" ? subject.total : 0
  const safeSubjectMissed =
    typeof subject.missed === "number"
      ? subject.missed
      : Math.max(0, safeSubjectTotal - safeSubjectAttended)
  const safeSubjectPercentage =
    typeof subject.percentage === "number" && !Number.isNaN(subject.percentage)
      ? subject.percentage
      : safeSubjectTotal > 0
        ? Number(((safeSubjectAttended / safeSubjectTotal) * 100).toFixed(1))
        : 0
  const safeSubjectId = subject.id || `${subject.courseCode || ""}-${subject.subjectName || ""}`

  // Compute live simulated metrics if active
  const effectiveMetrics = useMemo(() => {
    if (!isSimulated || safeSubjectTotal <= 0) {
      return {
        attended: safeSubjectAttended,
        total: safeSubjectTotal,
        percentage: safeSubjectPercentage,
        status: subject.status || (safeSubjectTotal === 0 ? "no_classes" : safeSubjectPercentage < 75 ? "deficit" : "surplus"),
        message: subject.message || (safeSubjectTotal === 0 ? "No classes" : `${safeSubjectPercentage}%`),
        actionCount: subject.actionCount || 0,
        missed: safeSubjectMissed
      }
    }

    const m = computeSimulatedMetrics(
      safeSubjectAttended,
      safeSubjectTotal,
      activeSim.extraAttended,
      activeSim.extraMissed,
      activeSim.pendingOD
    )
    const effectiveAttended = Math.min(
      safeSubjectTotal + activeSim.extraAttended + activeSim.extraMissed,
      safeSubjectAttended + activeSim.extraAttended + activeSim.pendingOD
    )
    const effectiveTotal = safeSubjectTotal + activeSim.extraAttended + activeSim.extraMissed
    const effectiveMissed = Math.max(0, effectiveTotal - effectiveAttended)

    return {
      attended: effectiveAttended,
      total: effectiveTotal,
      percentage: m.percentage,
      status: m.status,
      message: m.message,
      actionCount: m.actionCount,
      missed: effectiveMissed
    }
  }, [
    isSimulated,
    safeSubjectAttended,
    safeSubjectTotal,
    safeSubjectMissed,
    safeSubjectPercentage,
    subject.status,
    subject.message,
    subject.actionCount,
    activeSim.extraAttended,
    activeSim.extraMissed,
    activeSim.pendingOD
  ])

  // Compute semester skip budget (~45 lectures per semester)
  const semesterBudget = useMemo(() => {
    return computeSemesterBudget(
      effectiveMetrics.attended || 0,
      effectiveMetrics.missed || 0,
      effectiveMetrics.total || 0,
      45
    )
  }, [effectiveMetrics.attended, effectiveMetrics.missed, effectiveMetrics.total])

  const isSafe = (effectiveMetrics.percentage || 0) >= 75
  const isBoundary =
    isSafe && (effectiveMetrics.percentage === 75 || effectiveMetrics.actionCount === 0)

  let statusKey: "deficit" | "boundary" | "surplus" | "no_classes" = "surplus"
  if (effectiveMetrics.status === "no_classes") {
    statusKey = "no_classes"
  } else if (effectiveMetrics.status === "deficit") {
    statusKey = "deficit"
  } else if (isBoundary) {
    statusKey = "boundary"
  }

  const currentStatusColors =
    theme?.statusColors?.[statusKey] || {
      bg: "rgba(16, 185, 129, 0.1)",
      text: "#34d399",
      border: "rgba(52, 211, 153, 0.2)",
      gradient: "#10b981",
      solid: "#10b981"
    }
  const progressRatio = Math.min(1, Math.max(0, (effectiveMetrics.percentage || 0) / 100))
  const percentageDelta = isSimulated
    ? Number(((effectiveMetrics.percentage || 0) - safeSubjectPercentage).toFixed(1))
    : 0

  const handleStep = (field: keyof CourseSimulation, delta: number) => {
    if (!onSimulateChange) return
    const updated = {
      ...activeSim,
      [field]: Math.max(0, (activeSim[field] || 0) + delta)
    }
    onSimulateChange(safeSubjectId, updated)
  }

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: theme.cardShadow,
        border: isSimulated
          ? `1px dashed ${theme.accent}`
          : `1px solid ${theme.cardBorder}`,
        transition: "border-color 0.15s ease",
        boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        if (!isSimulated) e.currentTarget.style.borderColor = theme.cardHoverBorder
      }}
      onMouseLeave={(e) => {
        if (!isSimulated) e.currentTarget.style.borderColor = theme.cardBorder
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
              letterSpacing: "-0.015em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap"
            }}>
            <span>{subject.subjectName}</span>
            {isSimulated && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "1px 6px",
                  borderRadius: 9999,
                  backgroundColor:
                    theme.name === "dark"
                      ? "rgba(99, 102, 241, 0.2)"
                      : "rgba(79, 70, 229, 0.1)",
                  color: theme.accent,
                  border: `1px solid ${theme.accent}33`,
                  fontWeight: 700
                }}>
                SIMULATED {percentageDelta > 0 ? `+${percentageDelta}%` : `${percentageDelta}%`}
              </span>
            )}
          </div>

          {/* Meta Line */}
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

        <StatusPill
          status={effectiveMetrics.status}
          message={effectiveMetrics.message}
          theme={theme}
        />
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

      {/* Stats Breakdown Row + Action Toggle */}
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
          {effectiveMetrics.total > 0 ? (
            <span>
              Attended{" "}
              <strong
                style={{
                  color: theme.textPrimary,
                  fontWeight: 600
                }}>
                {effectiveMetrics.attended}
              </strong>{" "}
              of {effectiveMetrics.total}
              {effectiveMetrics.missed > 0 && (
                <span
                  style={{
                    color:
                      effectiveMetrics.status === "deficit"
                        ? theme.statusColors.deficit.solid
                        : theme.textMuted,
                    fontWeight: 500,
                    marginLeft: 6
                  }}>
                  · {effectiveMetrics.missed} missed
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: theme.textMuted }}>No conducted classes</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: currentStatusColors.solid,
              letterSpacing: "-0.01em"
            }}>
            {effectiveMetrics.percentage}%
          </span>

          {/* Simulator Drawer Button */}
          {subject.total > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              title="Open What-If Simulator & Leave Planner"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: 6,
                border: `1px solid ${
                  drawerOpen || isSimulated ? theme.accent : theme.inputBorder
                }`,
                backgroundColor:
                  drawerOpen || isSimulated
                    ? theme.name === "dark"
                      ? "rgba(99, 102, 241, 0.18)"
                      : "rgba(79, 70, 229, 0.1)"
                    : theme.metricBg,
                color: drawerOpen || isSimulated ? theme.accent : theme.textMuted,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}>
              <SlidersHorizontalIcon size={12} weight="bold" />
              <span>{drawerOpen ? "Close" : "Simulate"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive What-If Simulator Drawer */}
      {drawerOpen && subject.total > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${theme.divider}`,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
          {/* Controls Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6
            }}>
            {/* Attend Next Stepper */}
            <div
              style={{
                backgroundColor: theme.metricBg,
                border: `1px solid ${theme.metricBorder}`,
                borderRadius: 8,
                padding: "6px 7px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
              <span style={{ fontSize: 9.5, color: theme.textSecondary, fontWeight: 600 }}>
                Attend Next
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  disabled={activeSim.extraAttended <= 0}
                  onClick={() => handleStep("extraAttended", -1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: activeSim.extraAttended <= 0 ? "not-allowed" : "pointer",
                    opacity: activeSim.extraAttended <= 0 ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <MinusIcon size={10} weight="bold" />
                </button>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      activeSim.extraAttended > 0
                        ? theme.statusColors.surplus.solid
                        : theme.textPrimary,
                    minWidth: 14,
                    textAlign: "center"
                  }}>
                  +{activeSim.extraAttended}
                </span>
                <button
                  type="button"
                  onClick={() => handleStep("extraAttended", 1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <PlusIcon size={10} weight="bold" />
                </button>
              </div>
            </div>

            {/* Miss Next Stepper */}
            <div
              style={{
                backgroundColor: theme.metricBg,
                border: `1px solid ${theme.metricBorder}`,
                borderRadius: 8,
                padding: "6px 7px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}>
              <span style={{ fontSize: 9.5, color: theme.textSecondary, fontWeight: 600 }}>
                Miss Next
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  disabled={activeSim.extraMissed <= 0}
                  onClick={() => handleStep("extraMissed", -1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: activeSim.extraMissed <= 0 ? "not-allowed" : "pointer",
                    opacity: activeSim.extraMissed <= 0 ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <MinusIcon size={10} weight="bold" />
                </button>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      activeSim.extraMissed > 0
                        ? theme.statusColors.deficit.solid
                        : theme.textPrimary,
                    minWidth: 14,
                    textAlign: "center"
                  }}>
                  +{activeSim.extraMissed}
                </span>
                <button
                  type="button"
                  onClick={() => handleStep("extraMissed", 1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <PlusIcon size={10} weight="bold" />
                </button>
              </div>
            </div>

            {/* Pending OD Stepper */}
            <div
              style={{
                backgroundColor: theme.metricBg,
                border: `1px solid ${theme.metricBorder}`,
                borderRadius: 8,
                padding: "6px 7px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4
              }}
              title="Pending Duty Leave / Medical certificates waiting for ERP approval">
              <span style={{ fontSize: 9.5, color: theme.textSecondary, fontWeight: 600 }}>
                Pending OD
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  disabled={activeSim.pendingOD <= 0}
                  onClick={() => handleStep("pendingOD", -1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: activeSim.pendingOD <= 0 ? "not-allowed" : "pointer",
                    opacity: activeSim.pendingOD <= 0 ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <MinusIcon size={10} weight="bold" />
                </button>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      activeSim.pendingOD > 0 ? theme.accent : theme.textPrimary,
                    minWidth: 14,
                    textAlign: "center"
                  }}>
                  +{activeSim.pendingOD}
                </span>
                <button
                  type="button"
                  onClick={() => handleStep("pendingOD", 1)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: theme.cardBg,
                    color: theme.textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <PlusIcon size={10} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Semester Budget & Reset Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 10,
              padding: "4px 2px",
              color: theme.textMuted
            }}>
            <span>
              Sem Budget (~{semesterBudget.expectedTotal} classes):{" "}
              <strong
                style={{
                  color: semesterBudget.isExceeded
                    ? theme.statusColors.deficit.solid
                    : theme.textPrimary
                }}>
                {semesterBudget.skipsRemaining} skips left
              </strong>{" "}
              (used {semesterBudget.skipsUsed} of {semesterBudget.maxAllowedSkips} allowed)
            </span>

            {isSimulated && onResetSimulation && (
              <button
                type="button"
                onClick={() => onResetSimulation(safeSubjectId)}
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
                  padding: 0
                }}>
                <ArrowCounterClockwiseIcon size={11} weight="bold" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
