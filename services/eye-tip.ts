import { EYE_TIP_CLASS_NAME } from "~constants/theme"
import type { SubjectAttendance } from "~types"
import { getStoredAttendance } from "~utils/storage"

const GRADUATION_CAP_SVG = `<svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216s78.84-24.47,91.94-39.06A15.91,15.91,0,0,0,224,166.29V117.87l27.76-14.81a8,8,0,0,0,0-14.12ZM128,41.49l98.46,52.51L128,146.51,29.54,94ZM208,166.29c-11.23,12.51-36.56,33.71-80,33.71s-68.77-21.2-80-33.71V126.4l76.24,40.66a8,8,0,0,0,7.52,0L208,126.4Z"/></svg>`
const EYE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`
const SYNC_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
const SHIELD_CHECK_SVG = `<svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor"><path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.54,15.54,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm-34.34,77.66-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L119,147.69l42.34-42.35a8,8,0,0,1,11.32,11.32Z"/></svg>`

export interface EyeTipOptions {
  targetTable?: HTMLTableElement | null
  exactCount?: number
  totalCount?: number
  force?: boolean
  subjects?: SubjectAttendance[]
  overallPercentage?: number
}

// In-session minimized state
let isSessionMinimized = false

/**
 * Finds the "Recent Published Results" widget or card on CyberVidhya dashboard.
 * This element usually shows "No Record found" and takes up prime dashboard space.
 */
export function findRecentResultsContainer(): HTMLElement | null {
  // Method 1: Search by title / heading containing "Recent Published Results" or "Published Results"
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      "legend, h1, h2, h3, h4, h5, h6, .card-title, .box-title, .panel-title, [class*='title'], span, div, strong, b, a, p, label"
    )
  )

  for (const el of elements) {
    const text = (el.textContent || "").trim().toLowerCase()
    if (
      text.includes("recent published results") ||
      text === "recent published results" ||
      text === "published results"
    ) {
      const fieldset = el.closest<HTMLElement>("fieldset")
      if (fieldset) return fieldset

      const card = el.closest<HTMLElement>(
        ".card, .box, .panel, [class*='widget'], .table-responsive, [class*='col-']"
      )
      if (card) return card

      return el.parentElement?.parentElement || el.parentElement
    }
  }

  // Method 2: Search for tables with Exam Results headers (Grade, Result, Exam Type)
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>("table"))
  for (const table of tables) {
    const headerText = Array.from(table.querySelectorAll("th, thead td, tr:first-child td"))
      .map((cell) => (cell.textContent || "").toLowerCase().trim())
      .join(" ")

    if (
      (headerText.includes("grade") && (headerText.includes("exam type") || headerText.includes("result"))) ||
      (headerText.includes("grade") && headerText.includes("component"))
    ) {
      const fieldset = table.closest<HTMLElement>("fieldset")
      if (fieldset) return fieldset

      const card = table.closest<HTMLElement>(
        ".card, .box, .panel, [class*='widget'], .table-responsive, [class*='col-']"
      )
      if (card) return card

      return table.parentElement
    }
  }

  // Method 3: Search for "No Record found" inside a container that has results context
  for (const el of elements) {
    const text = (el.textContent || "").trim().toLowerCase()
    if (text === "no record found" || text.includes("no record found")) {
      const fieldset = el.closest<HTMLElement>("fieldset")
      if (fieldset) return fieldset

      const card = el.closest<HTMLElement>(
        ".card, .box, .panel, [class*='widget'], [class*='col-']"
      )
      if (card && (card.querySelector("table") || card.textContent?.toLowerCase().includes("result"))) {
        return card
      }
    }
  }

  return null
}

/**
 * Finds the courses / attendance table on CyberVidhya dashboard or attendance view.
 * Explicitly excludes results tables to avoid false matches.
 */
export function findCourseTable(): HTMLTableElement | null {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>("table"))

  for (const table of tables) {
    const headers = Array.from(
      table.querySelectorAll("th, thead td, tbody tr:first-child td, tr:first-child td")
    )
    const text = headers
      .map((c) => (c.textContent || "").toLowerCase().trim())
      .join(" ")

    // Skip results tables
    if (text.includes("grade") && (text.includes("exam type") || text.includes("result"))) {
      continue
    }

    // Skip lecture-wise date history tables
    if (
      text.includes("time slot") ||
      text.includes("lecture type") ||
      text.includes("date")
    ) {
      continue
    }

    // Must be the courses / attendance table
    if (
      text.includes("course") ||
      text.includes("attendance") ||
      text.includes("subject") ||
      text.includes("lectures") ||
      text.includes("presents")
    ) {
      return table
    }
  }

  return null
}

/**
 * Removes any injected eye-icon hint elements from the page.
 */
export function hideEyeTip(): void {
  document
    .querySelectorAll(`.${EYE_TIP_CLASS_NAME}`)
    .forEach((el) => el.remove())

  // Unhide any previously hidden elements
  document
    .querySelectorAll<HTMLElement>("[data-cv-results-hidden='true']")
    .forEach((el) => {
      el.style.display = el.dataset.cvOriginalDisplay || ""
      delete el.dataset.cvResultsHidden
      delete el.dataset.cvOriginalDisplay
    })
}

/**
 * Injects a classy, executive Attendance Accuracy Guard widget.
 * If "Recent Published Results" (which usually shows "No Record found") is on screen,
 * it mounts directly over/inside it, replacing dead space with high-value attendance tools!
 * Otherwise, cleanly mounts right above the attendance courses table.
 */
export async function injectEyeTip(
  targetTableOrOptions?: HTMLTableElement | null | EyeTipOptions,
  exactCountArg = 0,
  totalCountArg = 0,
  forceArg = false
): Promise<void> {
  // Normalize arguments
  let targetTable: HTMLTableElement | null = null
  let exactCount = exactCountArg
  let totalCount = totalCountArg
  let force = forceArg
  let subjects: SubjectAttendance[] | undefined
  let overallPercentage: number | undefined

  if (targetTableOrOptions && !(targetTableOrOptions instanceof HTMLTableElement)) {
    targetTable = targetTableOrOptions.targetTable ?? null
    exactCount = targetTableOrOptions.exactCount ?? exactCountArg
    totalCount = targetTableOrOptions.totalCount ?? totalCountArg
    force = targetTableOrOptions.force ?? forceArg
    subjects = targetTableOrOptions.subjects
    overallPercentage = targetTableOrOptions.overallPercentage
  } else if (targetTableOrOptions instanceof HTMLTableElement) {
    targetTable = targetTableOrOptions
  }

  // Don't inject on /attendance/my-attendance since that page already has full exact counts
  if (window.location.href.includes("my-attendance")) {
    return
  }

  // If stats not provided, load from stored attendance cache
  if (!subjects || subjects.length === 0) {
    const cached = await getStoredAttendance()
    if (cached?.subjects && cached.subjects.length > 0) {
      subjects = cached.subjects
      if (totalCount === 0) totalCount = cached.subjects.length
      if (exactCount === 0) exactCount = cached.subjects.filter((s) => s.actionCount > 0 || (s as any).isExact).length
      if (!overallPercentage) overallPercentage = cached.overall?.percentage
    }
  }

  // Find target mount: Prioritize covering the "Recent Published Results" dead widget
  const resultsContainer = findRecentResultsContainer()
  const courseTable = targetTable || findCourseTable()

  if (!resultsContainer && !courseTable) return

  let banner = document.querySelector<HTMLElement>(`.${EYE_TIP_CLASS_NAME}`)

  // If "Recent Published Results" container is found, cover it seamlessly
  if (resultsContainer) {
    // Clean container styling to remove scrollbars, fixed heights, or ugly fieldset borders
    resultsContainer.style.overflow = "visible"
    resultsContainer.style.height = "auto"
    resultsContainer.style.minHeight = "auto"
    resultsContainer.style.maxHeight = "none"

    if (resultsContainer.tagName.toLowerCase() === "fieldset") {
      resultsContainer.style.border = "none"
      resultsContainer.style.padding = "0"
      resultsContainer.style.margin = "0 0 16px 0"
    }

    // Hide all other children inside resultsContainer except our banner
    Array.from(resultsContainer.children).forEach((child) => {
      if (child !== banner) {
        const htmlChild = child as HTMLElement
        if (!htmlChild.dataset.cvResultsHidden) {
          htmlChild.dataset.cvResultsHidden = "true"
          htmlChild.dataset.cvOriginalDisplay = htmlChild.style.display || ""
        }
        htmlChild.style.display = "none"
      }
    })

    if (!banner) {
      banner = document.createElement("div")
      banner.className = EYE_TIP_CLASS_NAME
      resultsContainer.prepend(banner)
    } else if (banner.parentElement !== resultsContainer) {
      resultsContainer.prepend(banner)
    }
  } else if (courseTable) {
    // Fallback: inject right above course table
    const wrapper =
      courseTable.closest<HTMLElement>(
        ".table-responsive, [class*='table-container'], .card, .panel, .box"
      ) || courseTable
    const parent = wrapper.parentElement
    if (!parent) return

    if (!banner) {
      banner = document.createElement("div")
      banner.className = EYE_TIP_CLASS_NAME
      wrapper.before(banner)
    } else if (banner.nextElementSibling !== wrapper) {
      wrapper.before(banner)
    }
  }

  if (!banner) return

  // Handle Minimized State
  if (isSessionMinimized && !force) {
    banner.style.cssText = `
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 8px 14px;
      margin: 0 0 14px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      font-size: 11.5px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
    `
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:7px;font-weight:600;color:#475569;">
        <span style="color:#4f46e5;">⚡</span>
        <span>Attendance Accuracy Guard (Minimized)</span>
      </div>
      <span style="color:#4f46e5;font-weight:600;text-decoration:underline;">Click to expand &rarr;</span>
    `
    banner.onclick = () => {
      isSessionMinimized = false
      injectEyeTip(targetTableOrOptions, exactCountArg, totalCountArg, true)
    }
    return
  }

  // Executive Card Styling
  banner.style.cssText = `
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 14px;
    padding: 16px 18px;
    margin: 0 0 16px 0;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
    color: #0f172a;
    box-sizing: border-box;
    position: relative;
    transition: all 0.2s ease;
    width: 100%;
  `

  // Status Badge Logic
  const statusBadgeHtml =
    totalCount > 0
      ? exactCount >= totalCount
        ? `<span style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-radius:9999px;font-size:10.5px;font-weight:700;padding:3px 10px;display:inline-flex;align-items:center;gap:4px;">✓ All ${totalCount} Courses Verified</span>`
        : `<span style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:9999px;font-size:10.5px;font-weight:700;padding:3px 10px;display:inline-flex;align-items:center;gap:4px;">${exactCount}/${totalCount} Verified</span>`
      : `<span style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;border-radius:9999px;font-size:10.5px;font-weight:700;padding:3px 10px;display:inline-flex;align-items:center;gap:4px;">● 75% Rule Protected</span>`

  // Quick stats row if attendance data exists
  let quickStatsHtml = ""
  if (overallPercentage != null && overallPercentage > 0) {
    const isSafe = overallPercentage >= 75
    const statusColor = isSafe ? "#059669" : "#e11d48"
    const statusBg = isSafe ? "#ecfdf5" : "#fff1f2"
    const statusBorder = isSafe ? "#a7f3d0" : "#fecdd3"
    const statusLabel = isSafe ? "SAFE ZONE" : "AT RISK"

    quickStatsHtml = `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Overall Attendance:</span>
          <span style="font-size:16px;font-weight:800;color:#0f172a;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;">${overallPercentage.toFixed(1)}%</span>
          <span style="background:${statusBg};color:${statusColor};border:1px solid ${statusBorder};border-radius:9999px;font-size:9.5px;font-weight:800;padding:2px 7px;letter-spacing:0.04em;">${statusLabel}</span>
        </div>
        <div style="width:1px;height:14px;background:#cbd5e1;display:inline-block;"></div>
        <div style="font-size:11px;color:#475569;display:flex;align-items:center;gap:5px;">
          ${SHIELD_CHECK_SVG}
          <span>Protected threshold: <strong>75.0%</strong></span>
        </div>
      </div>
    `
  }

  banner.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #3b82f6 100%);color:#ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(79,70,229,0.3);flex-shrink:0;">
          ${GRADUATION_CAP_SVG}
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;letter-spacing:-0.015em;line-height:1.2;">
            Attendance Accuracy Guard
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;font-weight:500;">
            Real-time 75% attendance protection & verified skip planner
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;">
        ${statusBadgeHtml}
        <a href="/attendance/my-attendance"
           style="background:linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);color:#ffffff;border-radius:8px;padding:6px 14px;font-size:11.5px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(79,70,229,0.25);transition:all 0.15s ease;">
          <span>Open My Attendance</span>
          <span>&rarr;</span>
        </a>
        <button type="button"
                id="cv-dismiss-tip-btn"
                title="Minimize Guard"
                style="border:none;background:transparent;color:#94a3b8;width:26px;height:26px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;padding:0;transition:all 0.15s ease;">
          &times;
        </button>
      </div>
    </div>

    ${quickStatsHtml}

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;margin-bottom:10px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;">
        <div style="color:#4f46e5;margin-top:1px;flex-shrink:0;">
          ${EYE_ICON_SVG}
        </div>
        <div style="font-size:11.5px;line-height:1.45;color:#334155;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;">Course Verification:</strong>
          Click each course's <strong style="color:#0f172a;">eye icon (👁️)</strong> in the table below to pull exact lecture-by-lecture and Duty Leave (OD) logs.
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:9px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;">
        <div style="color:#059669;margin-top:1px;flex-shrink:0;">
          ${SYNC_ICON_SVG}
        </div>
        <div style="font-size:11.5px;line-height:1.45;color:#334155;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;">One-Click Full Sync:</strong>
          Open <a href="/attendance/my-attendance" style="color:#4f46e5;font-weight:600;text-decoration:underline;">My Attendance</a> once to automatically sync all enrolled courses & credits simultaneously.
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid #f1f5f9;font-size:10.5px;color:#94a3b8;">
      <span>Strict 75% attendance policy monitoring • Duty leaves (OD) accounted for</span>
      ${
        resultsContainer
          ? `<button type="button" id="cv-toggle-results-btn" style="border:none;background:transparent;color:#64748b;font-size:10.5px;cursor:pointer;text-decoration:underline;padding:0;">View Original Results</button>`
          : ""
      }
    </div>
  `

  // Handle dismiss (minimize) button
  banner.querySelector("#cv-dismiss-tip-btn")?.addEventListener("click", () => {
    isSessionMinimized = true
    injectEyeTip(targetTableOrOptions, exactCountArg, totalCountArg, false)
  })

  // Handle toggle original results widget
  if (resultsContainer) {
    banner.querySelector("#cv-toggle-results-btn")?.addEventListener("click", () => {
      const isHidden = banner?.dataset.cvSelfHidden === "true"
      const hiddenChildren = resultsContainer.querySelectorAll<HTMLElement>("[data-cv-results-hidden='true']")

      if (!isHidden) {
        hiddenChildren.forEach((el) => {
          el.style.display = el.dataset.cvOriginalDisplay || ""
        })
        if (banner) {
          banner.dataset.cvSelfHidden = "true"
          banner.style.padding = "8px 14px"
          banner.style.marginBottom = "10px"
          banner.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#475569;">
              <span>Showing original results widget.</span>
              <button type="button" id="cv-restore-guard-btn" style="border:none;background:transparent;color:#4f46e5;font-weight:600;cursor:pointer;text-decoration:underline;">Restore Attendance Accuracy Guard</button>
            </div>
          `
          banner.querySelector("#cv-restore-guard-btn")?.addEventListener("click", () => {
            if (banner) delete banner.dataset.cvSelfHidden
            injectEyeTip(targetTableOrOptions, exactCountArg, totalCountArg, true)
          })
        }
      }
    })
  }
}


