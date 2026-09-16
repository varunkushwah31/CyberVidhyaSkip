import { EYE_TIP_CLASS_NAME } from "~constants/theme";
import { dismissEyeTip, getEyeTipDismissed } from "~utils/storage";





const CYBERVIDHYA_EYE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`

function findCourseTable(): HTMLTableElement | null {
  const tables = document.querySelectorAll<HTMLTableElement>("table")

  for (const table of tables) {
    const headers = Array.from(
      table.querySelectorAll("th, thead td, tbody tr:first-child td, tr:first-child td")
    )
    const text = headers
      .map((c) => (c.textContent || "").toLowerCase().trim())
      .join(" ")

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
}

/**
 * Injects a clean, native CyberVidhya-styled informational card above the courses table.
 * Blends seamlessly with AdminLTE/Bootstrap cards and provides a link to My Attendance.
 */
export function injectEyeTip(
  targetTable?: HTMLTableElement | null,
  exactCount = 0,
  totalCount = 0
): void {
  const courseTable = targetTable || findCourseTable()
  if (!courseTable) return

  // Don't inject on /attendance/my-attendance since that page already has full exact counts
  if (window.location.pathname.includes("/attendance/my-attendance")) {
    return
  }

  getEyeTipDismissed().then((dismissed) => {
    if (dismissed) return

    const wrapper =
      courseTable.closest<HTMLElement>(
        ".table-responsive, [class*='table-container'], .card, .panel, .box"
      ) || courseTable
    const parent = wrapper.parentElement
    if (!parent) return

    let banner = document.querySelector<HTMLElement>(`.${EYE_TIP_CLASS_NAME}`)
    if (!banner) {
      banner = document.createElement("div")
      banner.className = EYE_TIP_CLASS_NAME
      wrapper.before(banner)
    }

    banner.style.cssText =
      "background:#ffffff;border:1px solid #dee2e6;border-left:4px solid #007bff;border-radius:4px;padding:10px 14px;margin:0 0 14px 0;box-shadow:0 1px 2px rgba(0,0,0,0.04);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#212529;"

    const statusBadge =
      totalCount > 0
        ? exactCount >= totalCount
          ? `<span style="background:#e6f4ea;color:#137333;border:1px solid #ceead6;border-radius:3px;font-size:11px;font-weight:600;padding:2px 8px;white-space:nowrap;">✓ All ${totalCount} Verified</span>`
          : `<span style="background:#e8f0fe;color:#1a73e8;border:1px solid #d2e3fc;border-radius:3px;font-size:11px;font-weight:600;padding:2px 8px;white-space:nowrap;">${exactCount}/${totalCount} Verified</span>`
        : ""

    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${CYBERVIDHYA_EYE_SVG}
          <span style="font-size:13px;font-weight:600;color:#212529;">
            Attendance Accuracy Guard
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${statusBadge}
          <a href="/attendance/my-attendance"
             style="background:#007bff;color:#ffffff;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
            Open My Attendance &rarr;
          </a>
          <button type="button"
                  id="cv-dismiss-tip-btn"
                  title="Dismiss"
                  style="border:none;background:transparent;color:#94a3b8;font-size:16px;line-height:1;cursor:pointer;padding:0 4px;">
            &times;
          </button>
        </div>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:6px;line-height:1.45;">
        Calculates exact classes you can skip or must attend to maintain 75%. Exact lecture counts and duty leaves (OD) are automatically captured from <a href="/attendance/my-attendance" style="color:#007bff;font-weight:600;text-decoration:underline;">My Attendance</a> or by clicking any course's eye icon (👁️).
      </div>
    `

    banner.querySelector("#cv-dismiss-tip-btn")?.addEventListener("click", () => {
      hideEyeTip()
      dismissEyeTip()
    })
  })
}
