import type { PlasmoCSConfig } from "plasmo";



import { BADGE_CLASS_NAME } from "~constants/theme";
import { fetchCyberVidhyaAttendance } from "~services/api-service";
import { scrapeModalHeader } from "~services/modal-scraper";
import { scrapeGeneralDashboardTable } from "~services/table-scraper";
import type { AttendanceStore } from "~types";
import { calculateAggregatePercentage } from "~utils/attendance-calculator";
import { saveStoredAttendance } from "~utils/storage";





// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["https://*.cybervidya.net/*", "http://*.cybervidya.net/*", "<all_urls>"],
  all_frames: true,
  run_at: "document_idle"
}

/**
 * Coordinates attendance scraping, DOM badge injection, and storage persistence.
 * Instant UI: Renders immediately from cached/estimated data, and updates asynchronously if API returns new counts.
 */
export function processAttendance(triggerApi = false): number {
  // 1. Scrape table & inject badges synchronously (executes in <2ms)
  const dashboardSubjects = scrapeGeneralDashboardTable()

  // 2. Check if lecture modal is currently open and update corresponding course
  const modalSubject = scrapeModalHeader()
  if (modalSubject) {
    const idx = dashboardSubjects.findIndex(
      (s) =>
        s.courseCode === modalSubject.courseCode ||
        s.subjectName === modalSubject.subjectName ||
        modalSubject.subjectName.toLowerCase().startsWith(s.subjectName.toLowerCase().slice(0, 8))
    )
    if (idx >= 0) {
      dashboardSubjects[idx] = modalSubject
    } else {
      dashboardSubjects.push(modalSubject)
    }
    // Re-run table badges with modal's exact counts
    scrapeGeneralDashboardTable()
  }

  const overallPercentage = calculateAggregatePercentage(dashboardSubjects)
  const activeSubjects = dashboardSubjects.filter((s) => s.status !== "no_classes")
  const totalAttended = activeSubjects.reduce((acc, s) => acc + s.attended, 0)
  const totalMissed = activeSubjects.reduce((acc, s) => acc + s.missed, 0)
  const totalClasses = activeSubjects.reduce((acc, s) => acc + s.total, 0)
  const detentionCount = dashboardSubjects.filter((s) => s.status === "deficit").length

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

  // 3. Asynchronously fetch latest API counts in background without blocking UI
  if (triggerApi) {
    fetchCyberVidhyaAttendance().then((updated) => {
      if (updated) {
        scrapeGeneralDashboardTable()
      }
    })
  }

  return dashboardSubjects.length
}

// Check modal header when user clicks on eye icon or table row
window.addEventListener("CV_CHECK_MODAL", () => {
  ;[100, 300, 600, 1200].forEach((delay) => {
    setTimeout(() => {
      const modalSubject = scrapeModalHeader()
      if (modalSubject) {
        processAttendance(false)
      }
    }, delay)
  })
})

// Listen for global clicks on eye icons or table buttons
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement | null
  if (target && (target.closest("table") || target.closest(".modal") || target.classList?.contains("fa-eye"))) {
    ;[150, 400, 900].forEach((delay) => {
      setTimeout(() => {
        const modalSubject = scrapeModalHeader()
        if (modalSubject) {
          processAttendance(false)
        }
      }, delay)
    })
  }
})

// Runtime message listener for on-demand scans from popup
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "SCAN_NOW") {
      const count = processAttendance(true)
      sendResponse({ success: true, count, url: window.location.href })
      return true
    }
  })
}

// Debounce DOM observer to avoid rapid layout recalculations
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedProcess(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processAttendance(false)
  }, 200)
}

function initObserver(): void {
  const targetNode = document.body || document.documentElement

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false

    for (const mutation of mutations) {
      // 1. Check attribute changes on modals (e.g. class="modal show", style="display: block")
      if (mutation.type === "attributes") {
        const target = mutation.target as HTMLElement
        if (
          target.classList?.contains("modal") ||
          target.querySelector?.(".modal") ||
          target.id?.toLowerCase().includes("modal")
        ) {
          shouldProcess = true
          break
        }
      }

      // 2. Check added nodes
      if (mutation.addedNodes.length > 0) {
        for (const element of mutation.addedNodes) {
          const node = element as HTMLElement
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.classList?.contains(BADGE_CLASS_NAME) ||
              node.querySelector?.(`.${BADGE_CLASS_NAME}`)
            ) {
              continue
            }

            const tag = node.tagName?.toLowerCase()
            if (
              tag === "tr" ||
              tag === "table" ||
              tag === "tbody" ||
              node.classList?.contains("modal") ||
              node.querySelector?.("table, tr, .modal")
            ) {
              shouldProcess = true
              break
            }
          }
        }
      }

      if (shouldProcess) break
    }

    if (shouldProcess) {
      debouncedProcess()
    }
  })

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "aria-hidden"]
  })
}

// Execution lifecycle triggers
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    processAttendance(true)
    initObserver()
  })
} else {
  processAttendance(true)
  initObserver()
}

window.addEventListener("load", () => {
  processAttendance(false)
})
