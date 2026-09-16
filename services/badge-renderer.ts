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
    badge.style.gap = "4.5px"
    badge.style.marginLeft = "8px"
    badge.style.padding = "2.5px 8px"
    badge.style.borderRadius = "9999px"
    badge.style.fontSize = "10.5px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1.2"
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
 * Preserves Angular's DOM tree by NEVER wiping or wrapping cell.innerHTML.
 * Uses CSS absolute positioning within the relative cell to ensure:
 * 1. The badge and percentage text are centered on the exact same vertical horizontal line.
 * 2. All badges start at the exact same horizontal X offset (aligned vertically across all rows).
 * 3. Zero interference with Angular change detection or template bindings.
 */
export function injectTableBadge(
  cell: HTMLElement,
  _percentDisplay: string,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
  // Ensure the table cell has relative positioning and vertical centering
  cell.style.position = "relative"
  cell.style.verticalAlign = "middle"
  cell.style.minWidth = "160px"

  if (tooltip && cell.title !== tooltip) {
    cell.title = tooltip
  }

  let badge = cell.querySelector<HTMLSpanElement>(`.${BADGE_CLASS_NAME}`)

  // Fast path: If badge already exists with identical message and style, avoid DOM mutations!
  if (badge?.dataset.message === message && badge.dataset.bg === styles.bg) {
    if (tooltip && badge.title !== tooltip) {
      badge.title = tooltip
    }
    return
  }

  if (!badge) {
    badge = document.createElement("span")
    badge.className = BADGE_CLASS_NAME
    badge.style.position = "absolute"
    badge.style.left = "54px"
    badge.style.top = "50%"
    badge.style.transform = "translateY(-50%)"
    badge.style.display = "inline-flex"
    badge.style.alignItems = "center"
    badge.style.gap = "4.5px"
    badge.style.padding = "2.5px 8px"
    badge.style.borderRadius = "9999px"
    badge.style.fontSize = "10.5px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1.2"
    badge.style.whiteSpace = "nowrap"
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)"
    badge.style.pointerEvents = "none" // Allow clicks to pass straight through to cell/row!
    badge.style.userSelect = "none"
    badge.style.transition = "all 0.15s ease"

    // Safe: appendChild does NOT remove or break Angular's existing children/bindings!
    cell.appendChild(badge)
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


