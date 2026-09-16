import { BADGE_CLASS_NAME } from "~constants/theme"
import type { BadgeTheme } from "~types"

/**
 * Injects or updates a clean chip badge into a DOM container element.
 * Applies pointer-events: none so all user clicks pass freely to table cells and buttons!
 * Performance optimized: short-circuits if identical badge is already rendered to avoid repaints.
 */
export function injectBadge(
  container: HTMLElement,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
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
    badge.style.marginLeft = "6px"
    badge.style.padding = "2px 6px"
    badge.style.borderRadius = "3px"
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
  badge.innerHTML = `<span style="display:inline-flex;align-items:center;color:${styles.text}">${styles.svgIcon}</span><span>${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`

  if (tooltip) {
    badge.title = tooltip
  }
}
