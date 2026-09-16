import { BADGE_CLASS_NAME, PERCENT_TEXT_CLASS, TABLE_CELL_WRAPPER_CLASS } from "~constants/theme"
import type { BadgeTheme } from "~types"
import { cleanElementText, parsePercentage } from "~utils/dom-utils"

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
    const rawText = cleanElementText(container)
    const percentDisplay = rawText.includes("%") ? rawText : `${parsePercentage(rawText)}%`
    injectTableBadge(container, percentDisplay, message, styles, tooltip)
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
    badge.style.gap = "4px"
    badge.style.marginLeft = "8px"
    badge.style.padding = "2px 7px"
    badge.style.borderRadius = "4px"
    badge.style.fontSize = "11px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1"
    badge.style.whiteSpace = "nowrap"
    badge.style.verticalAlign = "middle"
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)"
    badge.style.pointerEvents = "none" // CRITICAL: Never block user clicks!
    badge.style.userSelect = "none"
    badge.style.transition = "all 0.15s ease"
    container.appendChild(badge)
  }

  badge.dataset.message = message
  badge.dataset.bg = styles.bg
  badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;color:${styles.text}">${styles.svgIcon}</span><span style="line-height:1;display:inline-block;">${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`

  if (tooltip) {
    badge.title = tooltip
  }
}

/**
 * Injects or updates an attendance percentage cell in the dashboard table.
 * Uses a flexbox layout to ensure:
 * 1. The percentage value and badge are centered on the exact same vertical horizontal line.
 * 2. All badges start at the exact same horizontal X offset (aligned vertically across all rows).
 * 3. The entire cell contents are vertically centered in the row height (even if course variant wraps).
 * 4. User clicks pass through seamlessly to the underlying row/cell.
 */
export function injectTableBadge(
  cell: HTMLElement,
  percentDisplay: string,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
  // Ensure the table cell itself vertically centers its contents within the table row
  cell.style.verticalAlign = "middle"

  if (tooltip && cell.title !== tooltip) {
    cell.title = tooltip
  }

  let wrapper = cell.querySelector<HTMLDivElement>(`.${TABLE_CELL_WRAPPER_CLASS}`)
  let percentSpan = cell.querySelector<HTMLSpanElement>(`.${PERCENT_TEXT_CLASS}`)
  let badge = cell.querySelector<HTMLSpanElement>(`.${BADGE_CLASS_NAME}`)

  // Fast path: If wrapper, percent value, and badge already exist and match, avoid DOM mutations!
  if (
    wrapper &&
    percentSpan &&
    badge &&
    percentSpan.textContent === percentDisplay &&
    badge.dataset.message === message &&
    badge.dataset.bg === styles.bg
  ) {
    if (tooltip && badge.title !== tooltip) {
      badge.title = tooltip
    }
    return
  }

  // If wrapper already exists, update elements in place without replacing the wrapper
  if (wrapper && percentSpan && badge) {
    if (percentSpan.textContent !== percentDisplay) {
      percentSpan.textContent = percentDisplay
    }
    badge.dataset.message = message
    badge.dataset.bg = styles.bg
    badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;color:${styles.text}">${styles.svgIcon}</span><span style="line-height:1;display:inline-block;">${message}</span>`
    badge.style.backgroundColor = styles.bg
    badge.style.color = styles.text
    badge.style.border = `1px solid ${styles.border}`
    if (tooltip) {
      badge.title = tooltip
    }
    return
  }

  // First time rendering: build the wrapper with perfect flex alignment
  wrapper = document.createElement("div")
  wrapper.className = TABLE_CELL_WRAPPER_CLASS
  wrapper.style.display = "inline-flex"
  wrapper.style.alignItems = "center"
  wrapper.style.verticalAlign = "middle"
  wrapper.style.gap = "8px"
  wrapper.style.whiteSpace = "nowrap"
  wrapper.style.pointerEvents = "none" // Allow clicks to pass straight through to cell/row!
  wrapper.style.userSelect = "none"

  percentSpan = document.createElement("span")
  percentSpan.className = PERCENT_TEXT_CLASS
  percentSpan.style.display = "inline-block"
  percentSpan.style.minWidth = "46px"
  percentSpan.style.fontVariantNumeric = "tabular-nums"
  percentSpan.style.fontWeight = "600"
  percentSpan.style.fontSize = "13px"
  percentSpan.style.color = "inherit"
  percentSpan.style.textAlign = "left"
  percentSpan.style.flexShrink = "0"
  percentSpan.style.lineHeight = "1.2"
  percentSpan.textContent = percentDisplay

  badge = document.createElement("span")
  badge.className = BADGE_CLASS_NAME
  badge.dataset.message = message
  badge.dataset.bg = styles.bg
  badge.style.display = "inline-flex"
  badge.style.alignItems = "center"
  badge.style.gap = "4px"
  badge.style.padding = "2px 7px"
  badge.style.borderRadius = "4px"
  badge.style.fontSize = "11px"
  badge.style.fontWeight = "600"
  badge.style.lineHeight = "1"
  badge.style.whiteSpace = "nowrap"
  badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)"
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`
  badge.style.pointerEvents = "none"
  badge.style.userSelect = "none"
  badge.style.transition = "all 0.15s ease"
  badge.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;color:${styles.text}">${styles.svgIcon}</span><span style="line-height:1;display:inline-block;">${message}</span>`

  if (tooltip) {
    badge.title = tooltip
  }

  wrapper.appendChild(percentSpan)
  wrapper.appendChild(badge)

  // Replace cell content with wrapper
  cell.innerHTML = ""
  cell.appendChild(wrapper)
}
