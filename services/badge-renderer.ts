import { BADGE_CLASS_NAME } from "~constants/theme"
import type { BadgeTheme } from "~types"

/**
 * Injects or updates a clean chip badge into a DOM container element.
 * Applies pointer-events: none so all user clicks pass freely to table cells and buttons!
 * Uses pure SVG icons with ZERO emojis.
 */
export function injectBadge(
  container: HTMLElement,
  message: string,
  styles: BadgeTheme,
  tooltip?: string
): void {
  let badge = container.querySelector<HTMLSpanElement>(`.${BADGE_CLASS_NAME}`)

  if (!badge) {
    badge = document.createElement("span")
    badge.className = BADGE_CLASS_NAME
    badge.style.display = "inline-flex"
    badge.style.alignItems = "center"
    badge.style.gap = "5px"
    badge.style.marginLeft = "8px"
    badge.style.padding = "2px 8px"
    badge.style.borderRadius = "9999px"
    badge.style.fontSize = "11px"
    badge.style.fontWeight = "600"
    badge.style.lineHeight = "1.3"
    badge.style.whiteSpace = "nowrap"
    badge.style.verticalAlign = "middle"
    badge.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.04)"
    badge.style.pointerEvents = "none" // CRITICAL: Never block user clicks!
    badge.style.userSelect = "none"
    badge.style.transition = "all 0.15s ease"
    container.appendChild(badge)
  }

  badge.innerHTML = `<span style="display:inline-flex;align-items:center;color:${styles.text}">${styles.svgIcon}</span><span>${message}</span>`
  badge.style.backgroundColor = styles.bg
  badge.style.color = styles.text
  badge.style.border = `1px solid ${styles.border}`
  
  if (tooltip) {
    badge.title = tooltip
  }
}
