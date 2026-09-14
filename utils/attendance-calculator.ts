import { STATUS_THEMES } from "~constants/theme"
import type { AttendanceMetrics, SubjectAttendance } from "~types"

/**
 * Strict 75% Attendance Formula:
 * Deficit (< 75%): required = (3 * T) - (4 * A)
 * Surplus (>= 75%): safeToMiss = Math.floor((4 * A - 3 * T) / 3)
 */
export function compute75Metrics(attended: number, total: number): AttendanceMetrics {
  if (total <= 0) {
    return {
      attended: 0,
      total: 0,
      percentage: 0,
      status: "no_classes",
      actionCount: 0,
      message: "No classes held",
      badgeStyles: STATUS_THEMES.no_classes
    }
  }

  const percentage = Number(((attended / total) * 100).toFixed(1))

  // Deficit: 4A < 3T (< 75%)
  if (4 * attended < 3 * total) {
    const actionCount = 3 * total - 4 * attended
    return {
      attended,
      total,
      percentage,
      status: "deficit",
      actionCount,
      message: `Attend next ${actionCount}`,
      badgeStyles: STATUS_THEMES.deficit
    }
  }

  // Surplus or Boundary: 4A >= 3T (>= 75%)
  const safeToMiss = Math.floor((4 * attended - 3 * total) / 3)
  if (safeToMiss > 0) {
    return {
      attended,
      total,
      percentage,
      status: "surplus",
      actionCount: safeToMiss,
      message: `Can miss ${safeToMiss}`,
      badgeStyles: STATUS_THEMES.surplus
    }
  }

  return {
    attended,
    total,
    percentage,
    status: "boundary",
    actionCount: 0,
    message: "Don't miss!",
    badgeStyles: STATUS_THEMES.boundary
  }
}

/**
 * Estimates class counts from percentage and credit when exact modal counts aren't yet opened.
 */
export function estimateAttendance(
  percentage: number,
  credit: number,
  component: string
): AttendanceMetrics {
  if (percentage === 0 && (component === "PROJECT" || credit <= 1)) {
    return {
      attended: 0,
      total: 0,
      percentage: 0,
      status: "no_classes",
      actionCount: 0,
      message: "No classes held",
      badgeStyles: STATUS_THEMES.no_classes
    }
  }

  if (percentage === 75) {
    return {
      attended: 3,
      total: 4,
      percentage: 75,
      status: "boundary",
      actionCount: 0,
      message: "Don't miss!",
      badgeStyles: STATUS_THEMES.boundary
    }
  }

  // Estimate total held classes based on course credit weight (approx 5.5 to 6 periods per credit conducted so far)
  const estimatedTotal = Math.max(4, Math.round(credit * 5.8))
  const estimatedAttended = Math.round((percentage / 100) * estimatedTotal)

  return compute75Metrics(estimatedAttended, estimatedTotal)
}

/**
 * Calculates credit-weighted aggregate attendance matching CyberVidya's 91.0%.
 * Excludes unconducted courses (e.g. Project Internship with 0%).
 */
export function calculateAggregatePercentage(subjects: SubjectAttendance[]): number {
  const activeSubjects = subjects.filter(
    (s) => s.status !== "no_classes" && s.percentage > 0 && (s.credit || 1) > 0
  )

  if (activeSubjects.length === 0) return 0

  const totalCredits = activeSubjects.reduce((acc, s) => acc + (s.credit || 1), 0)
  const weightedSum = activeSubjects.reduce(
    (acc, s) => acc + s.percentage * (s.credit || 1),
    0
  )

  return totalCredits > 0 ? Number((weightedSum / totalCredits).toFixed(1)) : 0
}
