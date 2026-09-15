import type { AttendanceMetrics, SubjectAttendance } from "~types";
import { compute75Metrics, estimateAttendance } from "~utils/attendance-calculator";
import { cleanElementText, parsePercentage } from "~utils/dom-utils";



import { injectBadge } from "./badge-renderer";
import { findCachedCourse, setLastClickedCourse } from "./modal-scraper";


/**
 * Scrapes and enhances the "Current Registered Courses" table on the General Dashboard.
 * Injects clean action badges directly into the Attendance % column.
 */
export function scrapeGeneralDashboardTable(): SubjectAttendance[] {
  const tables = document.querySelectorAll<HTMLTableElement>("table")
  const extracted: SubjectAttendance[] = []

  tables.forEach((table) => {
    const headerCells = Array.from(table.querySelectorAll("th, thead td"))
    const headerTexts = headerCells.map((c) =>
      (c.textContent || "").toLowerCase().trim()
    )
    const headerJoined = headerTexts.join(" ")

    // Strictly skip lecture-wise date history tables
    if (
      headerJoined.includes("time slot") ||
      headerJoined.includes("lecture type") ||
      headerJoined.includes("date")
    ) {
      return
    }

    // Must be the courses table
    if (
      !headerJoined.includes("course") &&
      !headerJoined.includes("attendance")
    ) {
      return
    }

    let codeIdx = -1
    let nameIdx = -1
    let compIdx = -1
    let creditIdx = -1
    let percentIdx = -1

    headerCells.forEach((cell, idx) => {
      const text = (cell.textContent || "").toLowerCase().trim()
      if (text.includes("course code") || text === "code") {
        codeIdx = idx
      } else if (text.includes("course name") || text.includes("subject")) {
        nameIdx = idx
      } else if (text.includes("component")) {
        compIdx = idx
      } else if (text.includes("credit")) {
        creditIdx = idx
      } else if (text.includes("attendance") || text.includes("%")) {
        percentIdx = idx
      }
    })

    // Fallback standard column indices if headers didn't match directly
    if (codeIdx === -1 && headerCells.length >= 8) codeIdx = 1
    if (nameIdx === -1 && headerCells.length >= 8) nameIdx = 2
    if (compIdx === -1 && headerCells.length >= 8) compIdx = 4
    if (creditIdx === -1 && headerCells.length >= 8) creditIdx = 5
    if (percentIdx === -1 && headerCells.length >= 8) percentIdx = 8

    const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr, tr")

    rows.forEach((row) => {
      if (row.querySelector("th") && !row.querySelector("td")) return

      const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"))
      if (cells.length < 4) return

      const codeCell = codeIdx >= 0 ? cells[codeIdx] : null
      const nameCell = nameIdx >= 0 ? cells[nameIdx] : null
      const compCell = compIdx >= 0 ? cells[compIdx] : null
      const creditCell = creditIdx >= 0 ? cells[creditIdx] : null
      const percentCell = percentIdx >= 0 ? cells[percentIdx] : null

      if (!nameCell || !percentCell) return

      const courseCode = codeCell
        ? cleanElementText(codeCell).toUpperCase()
        : ""
      let courseName = cleanElementText(nameCell)

      // Check if full course name is stored in title attribute of cell or child elements
      const titleAttr =
        nameCell.getAttribute("title") ||
        nameCell.querySelector("[title]")?.getAttribute("title")
      if (titleAttr && titleAttr.trim().length > courseName.length) {
        courseName = titleAttr.trim()
      }

      const component = compCell
        ? cleanElementText(compCell).toUpperCase()
        : "THEORY"
      const credit = creditCell
        ? Number.parseFloat(cleanElementText(creditCell)) || 1
        : 1
      const percentage = parsePercentage(cleanElementText(percentCell))

      if (!courseName) return

      // Attach row click listener to capture eye-icon clicks and bind to modal
      if (!row.dataset.hasClickListener) {
        row.dataset.hasClickListener = "true"
        row.addEventListener("click", () => {
          setLastClickedCourse({
            courseCode,
            courseName,
            component,
            percentage
          })
          window.dispatchEvent(new CustomEvent("CV_CHECK_MODAL"))
        })
      }

      // Look up cached exact attendance numbers (from live API or opened modals)
      const cached = findCachedCourse(courseCode, courseName, component)

      let metrics: AttendanceMetrics
      if (cached && cached.totalClasses > 0) {
        metrics = compute75Metrics(cached.presentClasses, cached.totalClasses)
      } else {
        metrics = estimateAttendance(percentage, credit, component)
      }

      // Inject badge into the percent cell with transparent click-through
      const tooltip =
        metrics.total > 0
          ? `${metrics.attended} attended / ${metrics.total} total classes (${percentage}%)`
          : `Attendance: ${percentage}% (Credit: ${credit})`

      injectBadge(percentCell, metrics.message, metrics.badgeStyles, tooltip)

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
