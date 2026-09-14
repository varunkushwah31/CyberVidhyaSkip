import type { PlasmoCSConfig } from "plasmo";



import type { AttendanceStore, SubjectAttendance } from "~types";


// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["https://*.cybervidya.net/*", "http://*.cybervidya.net/*", "<all_urls>"],
  all_frames: true,
  run_at: "document_idle"
}

const BADGE_CLASS = "cv-attendance-badge"

console.log(
  "[CyberVidhya Attendance] Content script initialized on:",
  window.location.href,
  "| isTopFrame:",
  window === window.top
)

// In-memory cache of courses fetched from CyberVidhya API
const apiCourseCache = new Map<
  string,
  {
    courseCode: string
    courseName: string
    componentName: string
    presentClasses: number
    totalClasses: number
    percentage: number
  }
>()

/**
 * Checks if a string is a calendar date (DD/MM/YYYY etc.).
 */
function isDateString(str: string): boolean {
  return (
    /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(str) ||
    /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/.test(str)
  )
}

/**
 * Safely extracts text from an element without badge text pollution.
 */
function cleanElementText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove())
  return (clone.textContent || "").trim().replace(/\s+/g, " ")
}

/**
 * Strict 75% Attendance Formula
 */
function compute75Metrics(attended: number, total: number) {
  const percentage = Number(((attended / total) * 100).toFixed(1))
  let status: "deficit" | "surplus" | "boundary"
  let actionCount: number
  let message: string
  let badgeStyles: { bg: string; text: string; border: string; icon: string }

  if (4 * attended < 3 * total) {
    // Deficit (below 75%)
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
    // Surplus (at or above 75%)
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
 * Injects or updates a clean, modern chip badge into a table cell.
 */
function injectBadge(
  container: HTMLElement,
  message: string,
  styles: { bg: string; text: string; border: string; icon: string },
  tooltip?: string
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
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)"
    badge.style.cursor = "default"
    badge.style.transition = "all 0.15s ease"
    container.appendChild(badge)
  }

  badge.innerHTML = `<span style="font-size:10px">${styles.icon}</span><span>${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`
  if (tooltip) {
    badge.title = tooltip
  }
}

/**
 * Helper to retrieve CyberVidhya auth token from localStorage or sessionStorage.
 */
function getCyberVidhyaToken(): string {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || ""
      const val = localStorage.getItem(key) || ""

      if (
        key.toLowerCase() === "token" ||
        key.toLowerCase() === "auth_token" ||
        key.toLowerCase() === "access_token" ||
        key.toLowerCase() === "jwt"
      ) {
        return val.replace(/^["']|["']$/g, "")
      }

      if (val.startsWith("{") || val.startsWith("[")) {
        try {
          const parsed = JSON.parse(val)
          if (parsed.token) return parsed.token
          if (parsed.accessToken) return parsed.accessToken
          if (parsed.access_token) return parsed.access_token
          if (parsed.data?.token) return parsed.data.token
          if (parsed.user?.token) return parsed.user.token
        } catch {}
      }
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i) || ""
      const val = sessionStorage.getItem(key) || ""
      if (key.toLowerCase().includes("token")) {
        return val.replace(/^["']|["']$/g, "")
      }
    }
  } catch (e) {
    console.debug("[CyberVidhya Attendance] Token retrieval error:", e)
  }
  return ""
}

/**
 * Fetches attendance data directly from CyberVidhya API.
 */
async function fetchCyberVidhyaApiData(): Promise<boolean> {
  if (!window.location.hostname.includes("cybervidya.net")) {
    return false
  }

  const token = getCyberVidhyaToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers["Authorization"] = `GlobalEducation ${token}`
  }

  const endpoints = [
    "/api/attendance/course/component/student",
    "/api/student/dashboard/registered-courses"
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers,
        credentials: "include"
      })

      if (!res.ok) continue

      const json = await res.json()
      const list =
        json?.data?.attendanceCourseComponentInfoList ||
        json?.data?.registeredCourseList ||
        json?.data

      if (Array.isArray(list) && list.length > 0) {
        console.log(`[CyberVidhya Attendance] Received ${list.length} courses from ${endpoint}`)

        list.forEach((item: any) => {
          const courseCode = (item.courseCode || "").trim().toUpperCase()
          const courseName = (item.courseName || "").trim()
          const componentName = (item.componentName || item.component || "THEORY").trim().toUpperCase()

          let presentClasses = 0
          let totalClasses = 0

          if (Array.isArray(item.attendanceComponentInfoList)) {
            item.attendanceComponentInfoList.forEach((comp: any) => {
              presentClasses += comp.presentClasses || comp.attendedClasses || 0
              totalClasses += comp.totalClasses || comp.conductedClasses || 0
            })
          } else {
            presentClasses = item.presentClasses || item.attendedClasses || item.attended || 0
            totalClasses = item.totalClasses || item.conductedClasses || item.total || 0
          }

          const percentage =
            totalClasses > 0
              ? Number(((presentClasses / totalClasses) * 100).toFixed(1))
              : item.percentage || 0

          if (courseCode) {
            const entry = {
              courseCode,
              courseName,
              componentName,
              presentClasses,
              totalClasses,
              percentage
            }
            apiCourseCache.set(courseCode, entry)
            apiCourseCache.set(`${courseCode}_${componentName}`, entry)
          }
        })

        return true
      }
    } catch (err) {
      console.debug(`[CyberVidhya Attendance] Fetch failed for ${endpoint}:`, err)
    }
  }

  return false
}

/**
 * Scrapes the "Current Registered Courses" table directly on the General Dashboard.
 * Injects "Can miss X" or "Attend next Y" badges directly on the dashboard table!
 */
function processGeneralDashboardTable(): SubjectAttendance[] {
  const tables = document.querySelectorAll<HTMLTableElement>("table")
  const extracted: SubjectAttendance[] = []

  tables.forEach((table) => {
    const headerCells = Array.from(table.querySelectorAll("th, thead td"))
    const headerTexts = headerCells.map((c) => (c.textContent || "").toLowerCase().trim())
    const headerJoined = headerTexts.join(" ")

    // Strictly skip lecture-wise date tables
    if (
      headerJoined.includes("time slot") ||
      headerJoined.includes("lecture type") ||
      headerJoined.includes("date")
    ) {
      return
    }

    // Must be the courses table
    if (!headerJoined.includes("course") && !headerJoined.includes("attendance")) {
      return
    }

    // Map column indices
    let codeIdx = -1
    let nameIdx = -1
    let compIdx = -1
    let percentIdx = -1

    headerCells.forEach((cell, idx) => {
      const text = (cell.textContent || "").toLowerCase().trim()
      if (text.includes("course code") || text === "code") {
        codeIdx = idx
      } else if (text.includes("course name") || text.includes("subject")) {
        nameIdx = idx
      } else if (text.includes("component")) {
        compIdx = idx
      } else if (text.includes("attendance") || text.includes("%")) {
        percentIdx = idx
      }
    })

    // Fallbacks if headers couldn't be matched by name
    if (codeIdx === -1 && headerCells.length >= 8) codeIdx = 1
    if (nameIdx === -1 && headerCells.length >= 8) nameIdx = 2
    if (compIdx === -1 && headerCells.length >= 8) compIdx = 4
    if (percentIdx === -1 && headerCells.length >= 8) percentIdx = 8

    const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr, tr")

    rows.forEach((row) => {
      if (row.querySelector("th") && !row.querySelector("td")) return

      const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"))
      if (cells.length < 4) return

      const codeCell = codeIdx >= 0 ? cells[codeIdx] : null
      const nameCell = nameIdx >= 0 ? cells[nameIdx] : null
      const compCell = compIdx >= 0 ? cells[compIdx] : null
      const percentCell = percentIdx >= 0 ? cells[percentIdx] : null

      if (!nameCell || !percentCell) return

      const courseCode = codeCell ? cleanElementText(codeCell).toUpperCase() : ""
      const courseName = cleanElementText(nameCell)
      const component = compCell ? cleanElementText(compCell).toUpperCase() : "THEORY"
      const percentText = cleanElementText(percentCell)

      if (!courseName || isDateString(courseName)) return

      // Parse percentage from cell (e.g. "94 %")
      const parsedPercent = Number.parseFloat(
        percentText.replace(/[^\d.]/g, "")
      )

      // Check if we have exact (attended, total) data from the API cache
      const cached =
        apiCourseCache.get(`${courseCode}_${component}`) || apiCourseCache.get(courseCode)

      let attended = 0
      let total = 0
      let percentage = Number.isNaN(parsedPercent) ? 0 : parsedPercent
      let actionCount = 0
      let status: "deficit" | "surplus" | "boundary"
      let message: string
      let badgeStyles: { bg: string; text: string; border: string; icon: string }

      if (cached && cached.totalClasses > 0) {
        attended = cached.presentClasses
        total = cached.totalClasses
        const metrics = compute75Metrics(attended, total)
        percentage = metrics.percentage
        status = metrics.status
        actionCount = metrics.actionCount
        message = metrics.message
        badgeStyles = metrics.badgeStyles
      } else {
        // Fallback calculation directly from percentage column
        if (percentage < 75) {
          status = "deficit"
          message = `Below 75% (${percentage}%)`
          badgeStyles = { bg: "#fff1f2", text: "#be123c", border: "#fecdd3", icon: "🚨" }
        } else if (percentage === 75) {
          status = "boundary"
          message = "Don't miss!"
          badgeStyles = { bg: "#fffbeb", text: "#b45309", border: "#fde68a", icon: "⚠️" }
        } else {
          status = "surplus"
          message = `Safe (${percentage}%)`
          badgeStyles = { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", icon: "🛡️" }
        }
      }

      // INJECT BADGE DIRECTLY ON THE GENERAL DASHBOARD TABLE (in Attendance % column)
      const tooltip =
        total > 0
          ? `${attended} attended / ${total} total classes (${percentage}%)`
          : `Current attendance: ${percentage}%`
      injectBadge(percentCell, message, badgeStyles, tooltip)

      extracted.push({
        id: `${courseCode || courseName}-${component}`,
        courseCode,
        subjectName: courseName,
        component,
        attended,
        missed: Math.max(0, total - attended),
        total,
        percentage,
        status,
        actionCount,
        message
      })
    })
  })

  return extracted
}

/**
 * Scrapes the modal header if the user clicked into a specific course details view.
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

  const courseMatch = new RegExp(
    /Course Name\s*:\s*([^:\n\r]+?)(?=\s*(?:Component Name|Course Section|Present|Lecture|$))/i
  ).exec(modalText)
  const presentMatch = new RegExp(/Present\s*:\s*(\d+)/i).exec(modalText)
  const lectureMatch = new RegExp(/Lecture\s*:\s*(\d+)/i).exec(modalText)

  if (courseMatch && presentMatch && lectureMatch) {
    const subjectName = courseMatch[1].trim()
    const attended = Number.parseInt(presentMatch[1], 10)
    const total = Number.parseInt(lectureMatch[1], 10)

    if (total > 0 && attended <= total && subjectName && !isDateString(subjectName)) {
      const missed = Math.max(0, total - attended)
      const metrics = compute75Metrics(attended, total)

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
 * Main coordinator.
 */
export async function processAttendance(): Promise<number> {
  // 1. Fetch API data in background to populate exact class counts
  await fetchCyberVidhyaApiData()

  // 2. Process the General Dashboard Table
  const dashboardSubjects = processGeneralDashboardTable()

  // 3. Process modal if open
  const modalSubject = scrapeModalHeader()
  if (modalSubject) {
    const existingIdx = dashboardSubjects.findIndex((s) => s.subjectName === modalSubject.subjectName)
    if (existingIdx >= 0) {
      dashboardSubjects[existingIdx] = modalSubject
    } else {
      dashboardSubjects.push(modalSubject)
    }
  }

  console.log(`[CyberVidhya Attendance] Synced ${dashboardSubjects.length} subjects`)

  // 4. Save to chrome.storage.local
  if (dashboardSubjects.length > 0 && typeof chrome !== "undefined" && chrome.storage?.local) {
    const totalAttended = dashboardSubjects.reduce((acc, s) => acc + s.attended, 0)
    const totalMissed = dashboardSubjects.reduce((acc, s) => acc + s.missed, 0)
    const totalClasses = dashboardSubjects.reduce((acc, s) => acc + s.total, 0)
    const overallPercentage =
      totalClasses > 0
        ? Number(((totalAttended / totalClasses) * 100).toFixed(1))
        : Number(
            (
              dashboardSubjects.reduce((acc, s) => acc + s.percentage, 0) /
              dashboardSubjects.length
            ).toFixed(1)
          )
    const detentionCount = dashboardSubjects.filter((s) => s.status === "deficit").length

    const payload: AttendanceStore = {
      lastUpdated: Date.now(),
      url: window.location.href,
      subjects: dashboardSubjects,
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

  return dashboardSubjects.length
}

// Runtime message listener for on-demand scan
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "SCAN_NOW") {
      processAttendance().then((count) => {
        sendResponse({ success: true, count, url: window.location.href })
      })
      return true
    }
  })
}

// Debounce DOM observer
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedProcess(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processAttendance()
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

// Execution triggers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    processAttendance()
    initObserver()
  })
} else {
  processAttendance()
  initObserver()
}

window.addEventListener("load", () => {
  processAttendance()
})

setTimeout(processAttendance, 600)
setTimeout(processAttendance, 1500)
setTimeout(processAttendance, 3000)
