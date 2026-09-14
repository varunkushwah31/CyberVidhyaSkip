import type { PlasmoCSConfig } from "plasmo"
import { scrapeModalHeader } from "~services/modal-scraper"
import { scrapeGeneralDashboardTable } from "~services/table-scraper"
import type { AttendanceStore } from "~types"
import { calculateAggregatePercentage } from "~utils/attendance-calculator"
import { saveStoredAttendance } from "~utils/storage"

// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["https://*.cybervidya.net/*", "http://*.cybervidya.net/*", "<all_urls>"],
  all_frames: true,
  run_at: "document_idle"
}

/**
 * Coordinates attendance scraping, DOM badge injection, and storage persistence.
 */
export function processAttendance(): number {
  const dashboardSubjects = scrapeGeneralDashboardTable()

  // Check if lecture modal is currently open and update corresponding course
  const modalSubject = scrapeModalHeader()
  if (modalSubject) {
    const idx = dashboardSubjects.findIndex((s) => s.subjectName === modalSubject.subjectName)
    if (idx >= 0) {
      dashboardSubjects[idx] = modalSubject
    } else {
      dashboardSubjects.push(modalSubject)
    }
    scrapeGeneralDashboardTable()
  }

  const overallPercentage = calculateAggregatePercentage(dashboardSubjects)
  const activeSubjects = dashboardSubjects.filter((s) => s.status !== "no_classes")
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)
  const detentionCount = dashboardSubjects.filter((s) => s.status === "deficit").length

  console.log(
    `[CyberVidhya Attendance] Synced ${dashboardSubjects.length} courses | Aggregate: ${overallPercentage}%`
  )

  // Persist to chrome.storage.local
  if (dashboardSubjects.length > 0) {
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

    saveStoredAttendance(payload)
  }

  return dashboardSubjects.length
}

// Runtime message listener for on-demand scans from popup
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "SCAN_NOW") {
      const count = processAttendance()
      sendResponse({ success: true, count, url: window.location.href })
    }
  })
}

// Debounce DOM observer to handle dynamic Angular rendering without unnecessary reflows
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedProcess(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processAttendance()
  }, 150)
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

// Execution lifecycle triggers
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

setTimeout(processAttendance, 300)
setTimeout(processAttendance, 1000)
