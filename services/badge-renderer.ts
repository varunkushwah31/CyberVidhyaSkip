import { BADGE_CLASS_NAME } from "~constants/theme"
import type { BadgeTheme } from "~types"

/**
 * Injects or updates a clean chip badge into a generic DOM container (like modal headers).
 * If passed a table cell (TD/TH), delegates to injectTableBadge to ensure perfect table layout.
 * Applies pointer-events: none so all user clicks pass freely!
 * Performance optimized: short-circuits if identical badge is already rendered to avoid repaints.
 */
export function injectBadge(
  container: HTMLElement,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
  // If the container is a table cell, redirect to the specialized table cell aligner
  if (container.tagName === "TD" || container.tagName === "TH") {
    injectTableBadge(container, "", message, styles, tooltip)
    return
  }

  let badge = container.querySelector<HTMLSpanElement>(`.${BADGE_CLASS_NAME}`)

  // Fast path: If badge already exists with identical message and style, avoid expensive DOM mutations!
  if (badge?.dataset.message === message && badge.dataset.bg === styles.bg) {
    if (tooltip && badge.title !== tooltip) {
      badge.title = tooltip
    }
    return
  }

  if (!badge) {
    badge = document.createElement("span")
    badge.className = BADGE_CLASS_NAME
    badge.style.display = "inline-flex"
    badge.style.alignItems = "center"
    badge.style.justifyContent = "center"
    badge.style.gap = "4px"
    badge.style.marginLeft = "8px"
    badge.style.height = "22px"
    badge.style.width = "96px"
    badge.style.minWidth = "96px"
    badge.style.maxWidth = "96px"
    badge.style.boxSizing = "border-box"
    badge.style.padding = "0 6px"
    badge.style.borderRadius = "9999px"
    badge.style.fontSize = "10px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1"
    badge.style.letterSpacing = "0.01em"
    badge.style.whiteSpace = "nowrap"
    badge.style.verticalAlign = "middle"
    badge.style.pointerEvents = "none" // CRITICAL: Never block user clicks!
    badge.style.userSelect = "none"
    container.appendChild(badge)
  }

  badge.dataset.message = message
  badge.dataset.bg = styles.bg
  badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;color:${styles.text}">${styles.svgIcon}</span><span style="line-height:1;display:inline-block;font-variant-numeric:tabular-nums;">${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`

  if (tooltip) {
    badge.title = tooltip
  }
}

/**
 * Injects or updates an attendance percentage cell in the dashboard table.
 * Uses a dedicated flex wrapper inside the table cell to ensure:
 * 1. Uniform tabular right-aligned percentage slot (42px) so all "%" symbols line up in a vertical line.
 * 2. Strict 8px gap between percentage and badge on every row.
 * 3. Uniform height (22px) and uniform width (96px) for all action badges.
 * 4. Zero interference with user clicks or text scraping.
 */
export function injectTableBadge(
  cell: HTMLElement,
  percentDisplay: string,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
  cell.style.verticalAlign = "middle"
  cell.style.minWidth = "170px"

  if (tooltip && cell.title !== tooltip) {
    cell.title = tooltip
  }

  // Extract cleaned percentage display string
  let displayVal = (percentDisplay || "").trim()
  if (!displayVal) {
    const raw = cell.textContent || ""
    const match = /\b\d{1,3}%\b/.exec(raw)
    displayVal = match ? match[0] : raw.trim() || "0%"
  }
  if (!displayVal.includes("%") && /^\d+$/.test(displayVal)) {
    displayVal = `${displayVal}%`
  }

  let wrapper = cell.querySelector<HTMLDivElement>(".cv-attendance-wrapper")
  let percentSpan = cell.querySelector<HTMLSpanElement>(".cv-percent-text")
  let badge = cell.querySelector<HTMLSpanElement>(`.${BADGE_CLASS_NAME}`)

  // Initialize uniform structure if not yet present
  if (!wrapper || !percentSpan || !badge) {
    cell.innerHTML = ""

    wrapper = document.createElement("div")
    wrapper.className = "cv-attendance-wrapper"

    percentSpan = document.createElement("span")
    percentSpan.className = "cv-percent-text"

    badge = document.createElement("span")
    badge.className = BADGE_CLASS_NAME

    wrapper.appendChild(percentSpan)
    wrapper.appendChild(badge)
    cell.appendChild(wrapper)
  }

  // Strictly enforce uniform dimensions and tabular layout across all updates
  wrapper.style.display = "inline-flex"
  wrapper.style.alignItems = "center"
  wrapper.style.gap = "8px"
  wrapper.style.verticalAlign = "middle"

  percentSpan.style.display = "inline-block"
  percentSpan.style.width = "42px"
  percentSpan.style.minWidth = "42px"
  percentSpan.style.maxWidth = "42px"
  percentSpan.style.flexShrink = "0"
  percentSpan.style.textAlign = "right"
  percentSpan.style.fontVariantNumeric = "tabular-nums"
  percentSpan.style.fontSize = "12px"
  percentSpan.style.fontWeight = "600"
  percentSpan.style.color = "inherit"
  percentSpan.style.lineHeight = "1"

  badge.style.display = "inline-flex"
  badge.style.alignItems = "center"
  badge.style.justifyContent = "center"
  badge.style.gap = "4px"
  badge.style.height = "22px"
  badge.style.width = "96px"
  badge.style.minWidth = "96px"
  badge.style.maxWidth = "96px"
  badge.style.boxSizing = "border-box"
  badge.style.padding = "0 6px"
  badge.style.borderRadius = "9999px"
  badge.style.fontSize = "10px"
  badge.style.fontWeight = "600"
  badge.style.lineHeight = "1"
  badge.style.letterSpacing = "0.01em"
  badge.style.whiteSpace = "nowrap"
  badge.style.pointerEvents = "none"
  badge.style.userSelect = "none"

  // Keep percentage text synchronized
  if (percentSpan.textContent !== displayVal) {
    percentSpan.textContent = displayVal
  }

  // Fast path: Only update badge DOM when content or styles change
  if (badge.dataset.message !== message || badge.dataset.bg !== styles.bg) {
    badge.dataset.message = message
    badge.dataset.bg = styles.bg
    badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;color:${styles.text}">${styles.svgIcon}</span><span style="line-height:1;display:inline-block;font-variant-numeric:tabular-nums;">${message}</span>`
    badge.style.backgroundColor = styles.bg
    badge.style.color = styles.text
    badge.style.border = `1px solid ${styles.border}`
  }
}



