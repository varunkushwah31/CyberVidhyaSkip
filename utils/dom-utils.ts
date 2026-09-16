import { BADGE_CLASS_NAME, EYE_TIP_CLASS_NAME } from "~constants/theme";

/**
 * Strips injected badges and cleans whitespace from an element's text.
 */
export function cleanElementText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll(`.${BADGE_CLASS_NAME}, .${EYE_TIP_CLASS_NAME}`).forEach((b) => b.remove())
  return (clone.textContent || "").trim().replace(/\s+/g, " ")
}

/**
 * Parses numeric percentage from raw text string (e.g. "94.0%", "94 %", "94").
 */
export function parsePercentage(text: string): number {
  const match = new RegExp(/(\d+(?:\.\d+)?)/).exec(text)
  if (!match) return 0
  const val = Number.parseFloat(match[1])
  return Number.isNaN(val) ? 0 : val
}

/**
 * Safely parses integer number from string.
 */
export function parseInteger(text: string, defaultValue = 0): number {
  const clean = text.replace(/\D/g, "")
  if (!clean) return defaultValue
  const parsed = Number.parseInt(clean, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}
