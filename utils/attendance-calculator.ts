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
      message: "No classes",
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
      message: `Attend ${actionCount}`,
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
 * Finds the irreducible minimal integer fraction (A, T) that rounds to the given percentage.
 * Under university strict 75% attendance rules, an unverified estimate must NEVER
 * overestimate safe skips, which would lead to student detention.
 * E.g., for 89%: 8/9 = 88.9% gives exactly 1 safe skip (never 3).
 */
export function getConservativeFraction(percentage: number): { attended: number; total: number } {
  if (percentage <= 0) return { attended: 0, total: 0 }
  if (percentage >= 100) return { attended: 4, total: 4 }
  if (percentage === 75) return { attended: 3, total: 4 }

  for (let t = 1; t <= 60; t++) {
    for (let a = 1; a <= t; a++) {
      const p = Math.round((a / t) * 100)
      if (p === percentage) {
        return { attended: a, total: t }
      }
    }
  }

  return {
    attended: Math.round((percentage / 100) * 10),
    total: 10
  }
}

/**
 * Estimates class counts conservatively when exact API or modal counts aren't yet opened.
 * Strictly guarantees that students are never misled into skipping more classes than allowed.
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
      message: "No classes",
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

  // Use conservative irreducible fraction so safe skips are NEVER overestimated
  const frac = getConservativeFraction(percentage)
  return compute75Metrics(frac.attended, frac.total)
}

/**
 * Calculates credit-weighted aggregate attendance matching CyberVidhya's 91.0%.
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

/**
 * Calculates semester-long skip allowance based on expected total lectures (default: 45).
 * Under the 75% rule, max allowable skips across the whole term is floor(expectedTotal * 0.25).
 */
export function computeSemesterBudget(
  attended: number,
  missed: number,
  totalConducted: number,
  expectedTotal = 45
) {
  const safeTotal = Math.max(totalConducted, expectedTotal)
  const maxAllowedSkips = Math.floor(safeTotal * 0.25)
  const skipsUsed = Math.max(0, missed)
  const skipsRemaining = Math.max(0, maxAllowedSkips - skipsUsed)
  const isExceeded = skipsUsed > maxAllowedSkips

  return {
    expectedTotal: safeTotal,
    maxAllowedSkips,
    skipsUsed,
    skipsRemaining,
    isExceeded
  }
}

/**
 * Computes simulated metrics for "What-If" scenarios.
 * Supports adding attended/missed classes and converting missed classes via Pending OD.
 * Pending OD adds to attended without increasing total (since the class was already held and missed).
 */
export function computeSimulatedMetrics(
  attended: number,
  total: number,
  extraAttended = 0,
  extraMissed = 0,
  pendingOD = 0
): AttendanceMetrics {
  const simTotal = Math.max(0, total + extraAttended + extraMissed)
  let simAttended = Math.max(0, attended + extraAttended + pendingOD)
  if (simTotal > 0 && simAttended > simTotal) {
    simAttended = simTotal
  }

  return compute75Metrics(simAttended, simTotal)
}

