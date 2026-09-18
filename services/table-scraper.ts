import type { AttendanceMetrics, SubjectAttendance } from "~types";
import { compute75Metrics, estimateAttendance } from "~utils/attendance-calculator";
import { cleanElementText, parseInteger, parsePercentage } from "~utils/dom-utils";

import { injectTableBadge } from "./badge-renderer";
import { cacheCourseData, findCachedCourse, setLastClickedCourse } from "./modal-scraper";

interface TableColumnIndices {
  codeIdx: number
  nameIdx: number
  compIdx: number
  creditIdx: number
  percentIdx: number
  presentIdx: number
  absentIdx: number
  totalIdx: number
  adjustedIdx: number
}

export function findTableColumnIndices(headerCells: Element[]): TableColumnIndices {
  let codeIdx = -1
  let nameIdx = -1
  let compIdx = -1
  let creditIdx = -1
  let percentIdx = -1
  let presentIdx = -1
  let absentIdx = -1
  let totalIdx = -1
  let adjustedIdx = -1

  headerCells.forEach((cell, idx) => {
    const text = (cell.textContent || "").toLowerCase().trim()
    if (text.includes("course code") || text === "code" || text.includes("variant")) {
      codeIdx = idx
    } else if (
      text === "course" ||
      text === "course name" ||
      text.includes("course name") ||
      text.includes("subject")
    ) {
      nameIdx = idx
    } else if (text.includes("component")) {
      compIdx = idx
    } else if (text.includes("credit")) {
      creditIdx = idx
    } else if (
      text.includes("special attendance") ||
      text.includes("adjusted") ||
      text.includes("adjustment") ||
      text === "od"
    ) {
      adjustedIdx = idx
    } else if (
      text === "present" ||
      text === "presents" ||
      text === "attended" ||
      text.includes("total present") ||
      text.includes("classes attended") ||
      text.includes("no of present")
    ) {
      presentIdx = idx
    } else if (
      text === "absent" ||
      text === "missed" ||
      text.includes("total absent") ||
      text.includes("classes missed") ||
      text.includes("no of absent")
    ) {
      absentIdx = idx
    } else if (
      text === "lectures" ||
      text === "total" ||
      text.includes("total lecture") ||
      text.includes("total class") ||
      text.includes("conducted") ||
      text.includes("held")
    ) {
      totalIdx = idx
    } else if (
      !text.includes("special") &&
      (text.includes("attendance") || text.includes("%"))
    ) {
      percentIdx = idx
    }
  })

  // Fallback standard column indices if headers didn't match directly
  if (codeIdx === -1 && headerCells.length >= 8) codeIdx = 1
  if (nameIdx === -1 && headerCells.length >= 8) nameIdx = 2
  if (compIdx === -1 && headerCells.length >= 8) compIdx = 4
  if (creditIdx === -1 && headerCells.length >= 8) creditIdx = 5
  if (presentIdx === -1 && headerCells.length >= 9) presentIdx = 6
  if (absentIdx === -1 && headerCells.length >= 9) absentIdx = 7
  if (percentIdx === -1 && headerCells.length >= 8) percentIdx = 8

  return {
    codeIdx,
    nameIdx,
    compIdx,
    creditIdx,
    percentIdx,
    presentIdx,
    absentIdx,
    totalIdx,
    adjustedIdx
  }
}

export function isCourseTable(headerJoined: string): boolean {
  // Strictly skip lecture-wise date history tables
  if (
    headerJoined.includes("time slot") ||
    headerJoined.includes("lecture type") ||
    headerJoined.includes("date")
  ) {
    return false
  }

  // Must be the courses table or My Attendance table
  return (
    headerJoined.includes("course") ||
    headerJoined.includes("attendance") ||
    headerJoined.includes("lectures") ||
    headerJoined.includes("presents")
  )
}

/**
 * Calculates attended and total counts from table present/absent columns,
 * ensuring students marked "ADJUSTED" are counted as present even if the
 * DashboardTable only displays Present and Absent columns.
 */
function calculateAdjustedFromTable(
  present: number,
  absent: number,
  tableTotal: number,
  percentage: number
): { attended: number; total: number } {
  if (tableTotal > present + absent) {
    const impliedAdjusted = tableTotal - (present + absent)
    return { attended: present + impliedAdjusted, total: tableTotal }
  }

  if (percentage <= 0 || percentage >= 100 || present + absent === 0) {
    return { attended: present, total: present + absent }
  }

  const basePercent = (present / (present + absent)) * 100
  if (percentage <= basePercent + 0.1) {
    return { attended: present, total: present + absent }
  }

  const impliedAdj = Math.round(((percentage * absent) / (100 - percentage)) - present)
  if (impliedAdj > 0) {
    return { attended: present + impliedAdj, total: present + absent + impliedAdj }
  }

  return { attended: present, total: present + absent }
}

function resolveRowMetrics(
  courseCode: string,
  courseName: string,
  component: string,
  credit: number,
  percentage: number,
  tablePresent: number,
  tableAbsent: number,
  tableTotal: number,
  tableAdjusted: number
): AttendanceMetrics {
  // 1. Primary ground truth: Compute directly from live rendered table columns!
  // When Presents and Lectures are displayed on screen, they are the verified university counts.
  if (tablePresent >= 0 && (tableTotal >= 0 || tableAbsent >= 0)) {
    if (tableTotal === 0 && tablePresent === 0) {
      return compute75Metrics(0, 0)
    }

    const validTotal =
      tableTotal > 0
        ? tableTotal
        : tableAbsent >= 0
          ? tablePresent + tableAbsent + tableAdjusted
          : 0
    const validAttended = tablePresent + tableAdjusted

    if (validTotal > 0 && validAttended <= validTotal) {
      cacheCourseData({
        courseCode,
        courseName,
        componentName: component,
        presentClasses: validAttended,
        totalClasses: validTotal,
        percentage,
        adjustedClasses: tableAdjusted
      })
      return compute75Metrics(validAttended, validTotal)
    }

    // Fallback if table displays Present & Absent without Total:
    const validAbsent = tableAbsent >= 0 ? tableAbsent : Math.max(0, validTotal - tablePresent)
    const counts = calculateAdjustedFromTable(tablePresent, validAbsent, validTotal, percentage)
    if (counts.total > 0 && counts.attended <= counts.total) {
      cacheCourseData({
        courseCode,
        courseName,
        componentName: component,
        presentClasses: counts.attended,
        totalClasses: counts.total,
        percentage,
        adjustedClasses: tableAdjusted
      })
      return compute75Metrics(counts.attended, counts.total)
    }
  }

  // 2. Secondary fallback: Look up cached exact attendance numbers (from opened lecture modals)
  const cached = findCachedCourse(courseCode, courseName, component)
  if (cached && cached.totalClasses > 0) {
    const cachedPercent = (cached.presentClasses / cached.totalClasses) * 100
    // Verify cached percentage aligns with row percentage to avoid stale/mismatched data
    if (Math.abs(cachedPercent - percentage) <= 2.5) {
      return compute75Metrics(cached.presentClasses, cached.totalClasses)
    }
  }

  // 3. Final fallback: Conservative estimation when table only displays percentage
  return estimateAttendance(percentage, credit, component)
}

function attachRowClickListener(
  row: HTMLTableRowElement,
  context: { courseCode: string; courseName: string; component: string; percentage: number }
): void {
  if (!row.dataset.hasClickListener) {
    row.dataset.hasClickListener = "true"
    row.addEventListener("click", () => {
      setLastClickedCourse(context)
      window.dispatchEvent(new CustomEvent("CV_CHECK_MODAL"))
    })
  }
}

/**
 * Scrapes and enhances the "Current Registered Courses" or "Course Components" table.
 * Injects clean action badges directly into the Attendance % column.
 * Counts students marked "ADJUSTED" / "Special Attendance" as present.
 */
export function scrapeGeneralDashboardTable(): SubjectAttendance[] {
  const tables = document.querySelectorAll<HTMLTableElement>("table")
  const extracted: SubjectAttendance[] = []

  tables.forEach((table) => {
    const headerCells = Array.from(table.querySelectorAll("th, thead td"))
    const headerTexts = headerCells.map((c) => (c.textContent || "").toLowerCase().trim())
    const headerJoined = headerTexts.join(" ")

    if (!isCourseTable(headerJoined)) {
      return
    }

    const indices = findTableColumnIndices(headerCells)
    const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr, tr")
    let tableExactCount = 0
    let tableCourseCount = 0

    rows.forEach((row) => {
      if (row.querySelector("th") && !row.querySelector("td")) return

      const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"))
      if (cells.length < 4) return

      const codeCell = indices.codeIdx >= 0 ? cells[indices.codeIdx] : null
      const nameCell = indices.nameIdx >= 0 ? cells[indices.nameIdx] : null
      const compCell = indices.compIdx >= 0 ? cells[indices.compIdx] : null
      const creditCell = indices.creditIdx >= 0 ? cells[indices.creditIdx] : null
      const percentCell = indices.percentIdx >= 0 ? cells[indices.percentIdx] : null

      if (!nameCell || !percentCell) return

      let courseCode = codeCell ? cleanElementText(codeCell).toUpperCase() : ""
      // Extract code prefix if cell is a variant like "IT401B-Bachelor of Technology-..."
      const variantMatch = /^([A-Z0-9]+)/i.exec(courseCode)
      if (courseCode.includes("-") && variantMatch) {
        courseCode = variantMatch[1].toUpperCase()
      }

      let courseName = cleanElementText(nameCell)
      const titleAttr =
        nameCell.getAttribute("title") ||
        nameCell.querySelector("[title]")?.getAttribute("title")
      if (titleAttr && titleAttr.trim().length > courseName.length) {
        courseName = titleAttr.trim()
      }

      if (!courseName) return

      const component = compCell ? cleanElementText(compCell).toUpperCase() : "THEORY"
      const credit = creditCell ? Number.parseFloat(cleanElementText(creditCell)) || 1 : 1
      const percentage = parsePercentage(cleanElementText(percentCell))

      attachRowClickListener(row, { courseCode, courseName, component, percentage })

      const tablePresent =
        indices.presentIdx >= 0 && cells[indices.presentIdx]
          ? parseInteger(cleanElementText(cells[indices.presentIdx]), -1)
          : -1
      const tableAbsent =
        indices.absentIdx >= 0 && cells[indices.absentIdx]
          ? parseInteger(cleanElementText(cells[indices.absentIdx]), -1)
          : -1
      const tableTotal =
        indices.totalIdx >= 0 && cells[indices.totalIdx]
          ? parseInteger(cleanElementText(cells[indices.totalIdx]), -1)
          : -1
      const tableAdjusted =
        indices.adjustedIdx >= 0 && cells[indices.adjustedIdx]
          ? parseInteger(cleanElementText(cells[indices.adjustedIdx]), 0)
          : 0

      const metrics = resolveRowMetrics(
        courseCode,
        courseName,
        component,
        credit,
        percentage,
        tablePresent,
        tableAbsent,
        tableTotal,
        tableAdjusted
      )

      // Check whether this course's exact details are cached from modal or My Attendance
      const cached = findCachedCourse(courseCode, courseName, component)
      const isExact = Boolean(cached && cached.totalClasses > 0)
      if (isExact) {
        tableExactCount++
      }
      tableCourseCount++

      // Clean, native tooltip on eye icon if present
      const eyeIconEl = row.querySelector<HTMLElement>(".fa-eye, [class*='eye']")
      if (eyeIconEl) {
        eyeIconEl.title = isExact
          ? "Exact attendance verified"
          : "Click to view lecture breakdown and verify exact attendance"
        eyeIconEl.style.cursor = "pointer"
      }

      const tooltip =
        metrics.total > 0
          ? `${metrics.attended} attended / ${metrics.total} total classes (${percentage}%)${
              isExact ? " • Exact Verified" : " • Click 👁️ or view My Attendance"
            }`
          : `Attendance: ${percentage}% (Credit: ${credit})`

      const rawPercent = cleanElementText(percentCell)
      const percentDisplay = rawPercent.includes("%") ? rawPercent : `${percentage}%`
      injectTableBadge(percentCell, percentDisplay, metrics.message, metrics.badgeStyles, tooltip)

      // Danger Row Highlighting: subtle soft red warning tint for debarred/deficit courses
      if (metrics.status === "deficit" || percentage < 75) {
        row.classList.add("cv-danger-row")
        row.style.backgroundColor = "rgba(244, 63, 94, 0.06)"
        row.style.transition = "background-color 0.2s ease"
      } else if (row.classList.contains("cv-danger-row")) {
        row.classList.remove("cv-danger-row")
        row.style.backgroundColor = ""
      }


      extracted.push({
        id: `${courseCode || courseName}-${component}`,
        courseCode,
        subjectName: courseName,
        component,
        credit,
        attended: metrics.attended,
        missed: Math.max(0, metrics.total - metrics.attended),
        total: metrics.total,
        percentage,
        status: metrics.status,
        actionCount: metrics.actionCount,
        message: metrics.message
      })
    })
  })



  return extracted
}

