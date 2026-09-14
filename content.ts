import type { PlasmoCSConfig } from "plasmo"
import type { AttendanceStore, SubjectAttendance } from "./types"

// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["https://*.cybervidya.net/*", "http://*.cybervidya.net/*", "<all_urls>"],
  all_frames: true, // Crucial for ERP portals that render content inside iframes
  run_at: "document_idle"
}

const BADGE_CLASS = "cv-attendance-calc-badge"

console.log(
  "[CyberVidhya Attendance] Content script loaded on:",
  window.location.href,
  "| isTopFrame:",
  window === window.top
)

interface ColumnMapping {
  subjectIdx: number
  codeIdx: number
  componentIdx: number
  attendedIdx: number
  missedIdx: number
  totalIdx: number
  percentIdx: number
}

/**
 * Checks if a string represents a calendar date (e.g. 01/09/2026 or 2026-09-01).
 * Never treat dates as course attendance numbers or subject names!
 */
function isDateString(str: string): boolean {
  return (
    /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(str) ||
    /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/.test(str)
  )
}

/**
 * Checks if a table is a daywise/lecture-wise attendance history log.
 * These tables list dates (13/08/2026, 14/08/2026, etc.) and MUST be skipped!
 */
function isLectureWiseHistoryTable(table: HTMLTableElement): boolean {
  const headerText = Array.from(table.querySelectorAll("th, thead td"))
    .map((c) => (c.textContent || "").toLowerCase())
    .join(" ")

  if (
    headerText.includes("date") ||
    headerText.includes("time slot") ||
    headerText.includes("lecture type") ||
    headerText.includes("day")
  ) {
    return true
  }

  // Check if inside a "Lecture Wise Attendance Details" modal
  const parentModal = table.closest(".modal, [class*='modal'], [class*='dialog'], [class*='popup']")
  if (parentModal) {
    const modalTitle =
      parentModal.querySelector(".modal-title, h1, h2, h3, h4, h5, [class*='title']")
        ?.textContent || ""
    if (modalTitle.toLowerCase().includes("lecture wise")) {
      return true
    }
  }

  // Check first few rows for date strings in the 2nd column
  const firstDataRows = table.querySelectorAll("tbody tr, tr")
  let dateMatches = 0
  for (let i = 0; i < Math.min(4, firstDataRows.length); i++) {
    const row = firstDataRows[i]
    if (isDateString(row.textContent || "")) {
      dateMatches++
    }
  }
  if (dateMatches >= 2) {
    return true
  }

  return false
}

/**
 * Safely extracts text from an element without including any injected badges.
 */
function cleanElementText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove())
  return (clone.textContent || "").trim().replace(/\s+/g, " ")
}

/**
 * Resolves column indices specifically for Subject/Course Attendance tables.
 */
function resolveSubjectColumnIndices(table: HTMLTableElement): ColumnMapping {
  const mapping: ColumnMapping = {
    subjectIdx: -1,
    codeIdx: -1,
    componentIdx: -1,
    attendedIdx: -1,
    missedIdx: -1,
    totalIdx: -1,
    percentIdx: -1
  }

  const theadRows = table.querySelectorAll("thead tr")
  const headerRow = theadRows.length > 0 ? theadRows[theadRows.length - 1] : table.querySelector("tr")
  if (!headerRow) return mapping

  const cells = headerRow.querySelectorAll<HTMLTableCellElement>("th, td")

  cells.forEach((cell, index) => {
    const text = (cell.textContent || "").toLowerCase().trim()

    if (text.includes("course code") || text.includes("sub code") || text === "code") {
      mapping.codeIdx = index
    } else if (
      text.includes("course name") ||
      text.includes("subject name") ||
      text.includes("course") ||
      text.includes("subject") ||
      text.includes("paper")
    ) {
      // Prioritize course name over code
      if (!text.includes("code") || mapping.subjectIdx === -1) {
        mapping.subjectIdx = index
      }
    } else if (text.includes("component") || text.includes("type")) {
      mapping.componentIdx = index
    } else if (
      text.includes("attended") ||
      text.includes("present") ||
      text.includes("attnd") ||
      text === "p"
    ) {
      mapping.attendedIdx = index
    } else if (
      text.includes("absent") ||
      text.includes("missed") ||
      text === "a"
    ) {
      mapping.missedIdx = index
    } else if (
      text.includes("lecture") ||
      text.includes("total") ||
      text.includes("conducted") ||
      text.includes("held") ||
      text.includes("delivered") ||
      text.includes("max")
    ) {
      mapping.totalIdx = index
    } else if (text.includes("%") || text.includes("percentage") || text.includes("att %")) {
      mapping.percentIdx = index
    }
  })

  // Fallback: If no subject name column found, try column 1 or 2
  if (mapping.subjectIdx === -1 && cells.length >= 3) {
    mapping.subjectIdx = mapping.codeIdx === 1 ? 2 : 1
  }

  return mapping
}

/**
 * Strict 75% Attendance Formula
 */
function compute75Metrics(attended: number, total: number) {
  const percentage = Number(((attended / total) * 100).toFixed(1))
  let status: "deficit" | "surplus" | "boundary"
  let actionCount = 0
  let message = ""
  let badgeStyles: { bg: string; text: string; border: string; icon: string }

  if (4 * attended < 3 * total) {
    // Deficit: Below 75%
    actionCount = 3 * total - 4 * attended
    status = "deficit"
    message = `Attend next ${actionCount}`
    badgeStyles = {
      bg: "#fff1f2",
      text: "#be123c",
      border: "#fecdd3",
      icon: "🚨"
    }
  } else {
    // Surplus: 75% or higher
    actionCount = Math.floor((4 * attended - 3 * total) / 3)
    if (actionCount > 0) {
      status = "surplus"
      message = `Can miss ${actionCount}`
      badgeStyles = {
        bg: "#ecfdf5",
        text: "#047857",
        border: "#a7f3d0",
        icon: "🛡️"
      }
    } else {
      status = "boundary"
      message = "Don't miss!"
      badgeStyles = {
        bg: "#fffbeb",
        text: "#b45309",
        border: "#fde68a",
        icon: "⚠️"
      }
    }
  }

  return { percentage, status, actionCount, message, badgeStyles }
}

/**
 * Injects or updates a clean, modern chip badge in the target cell.
 */
function injectBadge(
  container: HTMLElement,
  message: string,
  styles: { bg: string; text: string; border: string; icon: string }
): void {
  let badge = container.querySelector<HTMLSpanElement>(`.${BADGE_CLASS}`)
  if (!badge) {
    badge = document.createElement("span")
    badge.className = BADGE_CLASS
    badge.style.display = "inline-flex"
    badge.style.alignItems = "center"
    badge.style.gap = "4px"
    badge.style.marginLeft = "8px"
    badge.style.padding = "2px 8px"
    badge.style.borderRadius = "9999px"
    badge.style.fontSize = "11px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1.3"
    badge.style.whiteSpace = "nowrap"
    badge.style.verticalAlign = "middle"
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"
    badge.style.cursor = "default"
    badge.style.transition = "all 0.15s ease"
    container.appendChild(badge)
  }

  badge.innerHTML = `<span style="font-size:10px">${styles.icon}</span><span>${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`
}

/**
 * Strategy 1: Scrapes main Subject Attendance Tables.
 * Strictly skips daywise / lecturewise tables!
 */
function scrapeSubjectTables(): SubjectAttendance[] {
  const tables = document.querySelectorAll<HTMLTableElement>("table")
  const extracted: SubjectAttendance[] = []

  tables.forEach((table) => {
    // 1. Skip lecture-wise date tables!
    if (isLectureWiseHistoryTable(table)) {
      return
    }

    const mapping = resolveSubjectColumnIndices(table)
    const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr, tr")

    rows.forEach((row) => {
      // Ignore header rows
      if (row.querySelector("th") && !row.querySelector("td")) return

      const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"))
      if (cells.length < 3) return

      // Skip row if it contains dates
      const fullRowText = row.textContent || ""
      if (isDateString(fullRowText) && !fullRowText.toLowerCase().includes("course")) {
        return
      }

      let attended = NaN
      let total = NaN
      let missed = NaN
      let subjectName = ""
      let targetCell: HTMLTableCellElement = cells[0]

      // Extract using header mapping
      if (mapping.attendedIdx >= 0 && cells[mapping.attendedIdx]) {
        attended = parseInt(cells[mapping.attendedIdx].textContent?.trim() || "", 10)
      }

      if (mapping.totalIdx >= 0 && cells[mapping.totalIdx]) {
        total = parseInt(cells[mapping.totalIdx].textContent?.trim() || "", 10)
      }

      if (mapping.missedIdx >= 0 && cells[mapping.missedIdx]) {
        missed = parseInt(cells[mapping.missedIdx].textContent?.trim() || "", 10)
      }

      // If total was not extracted, but attended and missed exist:
      if (Number.isNaN(total) && !Number.isNaN(attended) && !Number.isNaN(missed)) {
        total = attended + missed
      }

      // If total & attended exist but missed does not:
      if (!Number.isNaN(total) && !Number.isNaN(attended) && Number.isNaN(missed)) {
        missed = Math.max(0, total - attended)
      }

      // Extract subject name
      if (mapping.subjectIdx >= 0 && cells[mapping.subjectIdx]) {
        targetCell = cells[mapping.subjectIdx]
        subjectName = cleanElementText(targetCell)
      }

      // Fallback subject cell if empty or pure number:
      if (!subjectName || /^\d+$/.test(subjectName)) {
        for (const cell of cells) {
          const txt = cleanElementText(cell)
          // Find text with letters that is NOT a date, NOT a number, and NOT header labels
          if (
            txt.length > 3 &&
            /[a-zA-Z]{3,}/.test(txt) &&
            !isDateString(txt) &&
            !/^(regular|theory|practical|present|absent)$/i.test(txt)
          ) {
            subjectName = txt
            targetCell = cell
            break
          }
        }
      }

      // Validation: must be a genuine course
      if (
        Number.isNaN(attended) ||
        Number.isNaN(total) ||
        total <= 0 ||
        attended < 0 ||
        attended > total ||
        !subjectName ||
        isDateString(subjectName)
      ) {
        return
      }

      const metrics = compute75Metrics(attended, total)

      // Inject visual chip next to course name
      injectBadge(targetCell, metrics.message, metrics.badgeStyles)

      extracted.push({
        id: `${subjectName}-${total}`,
        subjectName,
        attended,
        missed,
        total,
        percentage: metrics.percentage,
        status: metrics.status,
        actionCount: metrics.actionCount,
        message: metrics.message
      })
    })
  })

  return extracted
}

/**
 * Strategy 2: Scrapes the "Lecture Wise Attendance Details" Modal Summary Header.
 * When a user opens a subject modal, the header explicitly displays:
 * "Course Name : Theory of Computation"
 * "Present : 17"
 * "Lecture : 18"
 * "Attendance % : 94 %"
 */
function scrapeModalHeader(): SubjectAttendance | null {
  const modal = document.querySelector(".modal, [class*='modal'], [class*='dialog'], [class*='popup']")
  if (!modal) return null

  const modalText = cleanElementText(modal as HTMLElement)
  if (
    !modalText.toLowerCase().includes("course name") &&
    !modalText.toLowerCase().includes("lecture wise")
  ) {
    return null
  }

  // Regex extract details from modal summary fields
  const courseMatch = modalText.match(/Course Name\s*:\s*([^:\n\r]+?)(?=\s*(?:Component Name|Course Section|Present|Lecture|$))/i)
  const presentMatch = modalText.match(/Present\s*:\s*(\d+)/i)
  const lectureMatch = modalText.match(/Lecture\s*:\s*(\d+)/i)

  if (courseMatch && presentMatch && lectureMatch) {
    const subjectName = courseMatch[1].trim()
    const attended = parseInt(presentMatch[1], 10)
    const total = parseInt(lectureMatch[1], 10)

    if (total > 0 && attended <= total && subjectName && !isDateString(subjectName)) {
      const missed = Math.max(0, total - attended)
      const metrics = compute75Metrics(attended, total)

      // Inject badge into modal header
      const headerBlock = modal.querySelector(".modal-body, [class*='body'], [class*='header'], table")?.parentElement
      const targetHeader = modal.querySelector("h1, h2, h3, h4, h5, [class*='title']") || headerBlock
      if (targetHeader) {
        injectBadge(targetHeader as HTMLElement, metrics.message, metrics.badgeStyles)
      }

      return {
        id: `${subjectName}-${total}`,
        subjectName,
        attended,
        missed,
        total,
        percentage: metrics.percentage,
        status: metrics.status,
        actionCount: metrics.actionCount,
        message: metrics.message
      }
    }
  }

  return null
}

/**
 * Strategy 3: Directly calls CyberVidhya's internal API.
 * Returns the exact, verified course attendance list across all subjects!
 */
async function fetchCyberVidhyaApi(): Promise<SubjectAttendance[]> {
  if (!window.location.hostname.includes("cybervidya.net")) {
    return []
  }

  try {
    let token = ""
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || ""
      const val = localStorage.getItem(key) || ""
      if (key.toLowerCase().includes("token") || key.toLowerCase().includes("auth")) {
        token = val.replace(/^["']|["']$/g, "")
        break
      }
      try {
        const parsed = JSON.parse(val)
        if (parsed.token || parsed.accessToken || parsed.access_token) {
          token = parsed.token || parsed.accessToken || parsed.access_token
          break
        }
      } catch {}
    }

    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `GlobalEducation ${token}`
    }

    const res = await fetch("/api/attendance/course/component/student", {
      headers,
      credentials: "include"
    })

    if (!res.ok) return []

    const json = await res.json()
    const studentData = json?.data
    const list = studentData?.attendanceCourseComponentInfoList

    if (!Array.isArray(list) || list.length === 0) return []

    console.log("[CyberVidhya Attendance] API returned courses:", list.length)

    const results: SubjectAttendance[] = []
    list.forEach((item: any) => {
      const subjectName = item.courseName || item.courseCode
      if (!subjectName || isDateString(subjectName)) return

      let attended = 0
      let total = 0

      if (Array.isArray(item.attendanceComponentInfoList)) {
        item.attendanceComponentInfoList.forEach((comp: any) => {
          attended += comp.presentClasses || comp.attendedClasses || 0
          total += comp.totalClasses || comp.conductedClasses || 0
        })
      } else {
        attended = item.presentClasses || item.attendedClasses || item.attended || 0
        total = item.totalClasses || item.conductedClasses || item.total || 0
      }

      if (total <= 0 || attended > total) return

      const missed = Math.max(0, total - attended)
      const metrics = compute75Metrics(attended, total)

      results.push({
        id: `${subjectName}-${total}`,
        subjectName,
        attended,
        missed,
        total,
        percentage: metrics.percentage,
        status: metrics.status,
        actionCount: metrics.actionCount,
        message: metrics.message
      })
    })

    return results
  } catch (err) {
    console.debug("[CyberVidhya Attendance] API call skipped:", err)
    return []
  }
}

/**
 * Main coordinator function.
 */
export async function processAttendanceTable(): Promise<number> {
  const subjectMap = new Map<string, SubjectAttendance>()

  // 1. Try CyberVidhya internal API first for 100% accurate subjects
  const apiSubjects = await fetchCyberVidhyaApi()
  apiSubjects.forEach((s) => subjectMap.set(s.subjectName, s))

  // 2. Scrape subject tables from DOM
  const tableSubjects = scrapeSubjectTables()
  tableSubjects.forEach((s) => {
    if (!subjectMap.has(s.subjectName)) {
      subjectMap.set(s.subjectName, s)
    }
  })

  // 3. If modal header is open, include or update that subject
  const modalSubject = scrapeModalHeader()
  if (modalSubject) {
    subjectMap.set(modalSubject.subjectName, modalSubject)
  }

  const subjects = Array.from(subjectMap.values())

  console.log(`[CyberVidhya Attendance] Final subject-wise count: ${subjects.length}`)

  // Store in chrome.storage.local
  if (subjects.length > 0 && typeof chrome !== "undefined" && chrome.storage?.local) {
    const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0)
    const totalMissed = subjects.reduce((acc, s) => acc + s.missed, 0)
    const totalClasses = subjects.reduce((acc, s) => acc + s.total, 0)
    const overallPercentage =
      totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 0
    const detentionCount = subjects.filter((s) => s.status === "deficit").length

    const payload: AttendanceStore = {
      lastUpdated: Date.now(),
      url: window.location.href,
      subjects,
      overall: {
        totalAttended,
        totalMissed,
        totalClasses,
        percentage: overallPercentage,
        detentionCount
      }
    }

    chrome.storage.local.set({ attendanceData: payload })
  }

  return subjects.length
}

// Listen for popup messages
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "SCAN_NOW") {
      processAttendanceTable().then((count) => {
        sendResponse({ success: true, count, url: window.location.href })
      })
      return true
    }
  })
}

// Debounced DOM observer
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedProcess(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processAttendanceTable()
  }, 200)
}

function initObserver(): void {
  const targetNode = document.body || document.documentElement

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        debouncedProcess()
        break
      }
    }
  })

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  })
}

// Lifecycle execution triggers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    processAttendanceTable()
    initObserver()
  })
} else {
  processAttendanceTable()
  initObserver()
}

window.addEventListener("load", () => {
  processAttendanceTable()
})

setTimeout(processAttendanceTable, 800)
setTimeout(processAttendanceTable, 2000)
