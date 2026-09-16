import type { PlasmoCSConfig } from "plasmo";



import { BADGE_CLASS_NAME } from "~constants/theme";
import { fetchCyberVidhyaAttendance } from "~services/api-service";
import { scrapeModalHeader } from "~services/modal-scraper";
import { injectEyeTip, hideEyeTip } from "~services/eye-tip";
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
    const exactCount = dashboardSubjects.filter((s) => s.actionCount > 0 || (s as any).isExact).length
    injectEyeTip({
      subjects: dashboardSubjects,
      exactCount,
      totalCount: dashboardSubjects.length,
      overallPercentage
    })
  } else {
    injectEyeTip()
  }

  // 3. Asynchronously fetch latest API counts in background without blocking UI
  if (triggerApi) {
    fetchCyberVidhyaAttendance().then((updated) => {
      if (updated) {
        scrapeGeneralDashboardTable()
        injectEyeTip()
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
  const isEyeOrAction =
    target &&
    (target.classList?.contains("fa-eye") ||
      Boolean(target.closest(".fa-eye, [class*='eye'], [title*='Lecture'], [title*='Attendance'], a.btn, button.btn, .modal")))

  if (target && (isEyeOrAction || target.closest(".modal"))) {
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
      injectEyeTip()
      sendResponse({ success: true, count, url: window.location.href })
      return true
    }

    if (request.action === "HIDE_EYE_TIP") {
      hideEyeTip()
      sendResponse({ success: true })
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
    injectEyeTip()
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
              tag === "fieldset" ||
              node.classList?.contains("modal") ||
              node.querySelector?.("table, tr, .modal, fieldset, [class*='card'], [class*='box'], [class*='panel']")
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
function runLifecycle(): void {
  processAttendance(true)
  injectEyeTip()
  initObserver()

  // Staggered retries to catch late AJAX data hydration on CyberVidhya dashboards
  ;[300, 700, 1400, 2500, 4500].forEach((delay) => {
    setTimeout(() => {
      processAttendance(false)
      injectEyeTip()
    }, delay)
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runLifecycle)
} else {
  runLifecycle()
}

window.addEventListener("load", () => {
  processAttendance(false)
  injectEyeTip()
})
