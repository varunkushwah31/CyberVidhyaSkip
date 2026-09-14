import type { AttendanceStatus, BadgeTheme } from "~types"

// Clean inline SVG icons (Zero Emojis)
export const BADGE_SVGS = {
  // Shield with checkmark for surplus
  surplus: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  
  // Warning triangle for boundary
  boundary: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  
  // Alert circle for deficit
  deficit: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  
  // Info circle for no classes
  no_classes: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
}

export const STATUS_THEMES: Record<AttendanceStatus, BadgeTheme> = {
  surplus: {
    bg: "#ecfdf5",
    text: "#047857",
    border: "#a7f3d0",
    svgIcon: BADGE_SVGS.surplus
  },
  boundary: {
    bg: "#fffbeb",
    text: "#b45309",
    border: "#fde68a",
    svgIcon: BADGE_SVGS.boundary
  },
  deficit: {
    bg: "#fff1f2",
    text: "#be123c",
    border: "#fecdd3",
    svgIcon: BADGE_SVGS.deficit
  },
  no_classes: {
    bg: "#f1f5f9",
    text: "#475569",
    border: "#cbd5e1",
    svgIcon: BADGE_SVGS.no_classes
  }
}

export const BADGE_CLASS_NAME = "cv-attendance-badge"
