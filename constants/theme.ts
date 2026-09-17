import type { AttendanceStatus, BadgeTheme, ThemeMode } from "~types"

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
    text: "#065f46",
    border: "#a7f3d0",
    svgIcon: BADGE_SVGS.surplus
  },
  boundary: {
    bg: "#fffbeb",
    text: "#92400e",
    border: "#fde68a",
    svgIcon: BADGE_SVGS.boundary
  },
  deficit: {
    bg: "#fff1f2",
    text: "#9f1239",
    border: "#fecdd3",
    svgIcon: BADGE_SVGS.deficit
  },
  no_classes: {
    bg: "#f8fafc",
    text: "#475569",
    border: "#cbd5e1",
    svgIcon: BADGE_SVGS.no_classes
  }
}

export const BADGE_CLASS_NAME = "cv-attendance-badge"
export const EYE_TIP_CLASS_NAME = "cv-eye-tip"

export interface AppTheme {
  name: ThemeMode
  bg: string
  cardBg: string
  cardBorder: string
  cardHoverBorder: string
  cardShadow: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  metricBg: string
  metricBorder: string
  inputBg: string
  inputBorder: string
  inputFocusBorder: string
  inputFocusRing: string
  inputText: string
  segmentBg: string
  segmentBorder: string
  segmentActiveBg: string
  segmentActiveText: string
  segmentActiveShadow: string
  segmentInactiveText: string
  accent: string
  accentGradient: string
  headerBg: string
  headerBorder: string
  stickyBg: string
  divider: string
  progressBarBg: string
  statusColors: {
    surplus: {
      bg: string
      text: string
      border: string
      gradient: string
      solid: string
    }
    boundary: {
      bg: string
      text: string
      border: string
      gradient: string
      solid: string
    }
    deficit: {
      bg: string
      text: string
      border: string
      gradient: string
      solid: string
    }
    no_classes: {
      bg: string
      text: string
      border: string
      gradient: string
      solid: string
    }
  }
}

export const THEMES: Record<ThemeMode, AppTheme> = {
  dark: {
    name: "dark",
    bg: "#0c1017",
    cardBg: "#141a24",
    cardBorder: "rgba(255, 255, 255, 0.07)",
    cardHoverBorder: "rgba(99, 102, 241, 0.4)",
    cardShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    metricBg: "rgba(255, 255, 255, 0.03)",
    metricBorder: "rgba(255, 255, 255, 0.06)",
    inputBg: "rgba(255, 255, 255, 0.04)",
    inputBorder: "rgba(255, 255, 255, 0.08)",
    inputFocusBorder: "#6366f1",
    inputFocusRing: "rgba(99, 102, 241, 0.2)",
    inputText: "#f1f5f9",
    segmentBg: "rgba(255, 255, 255, 0.04)",
    segmentBorder: "rgba(255, 255, 255, 0.07)",
    segmentActiveBg: "#1e293b",
    segmentActiveText: "#f8fafc",
    segmentActiveShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
    segmentInactiveText: "#94a3b8",
    accent: "#6366f1",
    accentGradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    headerBg: "rgba(12, 16, 23, 0.96)",
    headerBorder: "rgba(255, 255, 255, 0.07)",
    stickyBg: "rgba(12, 16, 23, 0.94)",
    divider: "rgba(255, 255, 255, 0.07)",
    progressBarBg: "rgba(255, 255, 255, 0.07)",
    statusColors: {
      surplus: {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#34d399",
        border: "rgba(52, 211, 153, 0.2)",
        gradient: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
        solid: "#10b981"
      },
      boundary: {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#fbbf24",
        border: "rgba(251, 191, 36, 0.2)",
        gradient: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
        solid: "#f59e0b"
      },
      deficit: {
        bg: "rgba(244, 63, 94, 0.1)",
        text: "#fb7185",
        border: "rgba(251, 113, 133, 0.2)",
        gradient: "linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)",
        solid: "#f43f5e"
      },
      no_classes: {
        bg: "rgba(148, 163, 184, 0.08)",
        text: "#94a3b8",
        border: "rgba(148, 163, 184, 0.15)",
        gradient: "linear-gradient(90deg, #64748b 0%, #475569 100%)",
        solid: "#64748b"
      }
    }
  },
  light: {
    name: "light",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    cardHoverBorder: "#cbd5e1",
    cardShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    metricBg: "#f8fafc",
    metricBorder: "#e2e8f0",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    inputFocusBorder: "#4f46e5",
    inputFocusRing: "rgba(79, 70, 229, 0.12)",
    inputText: "#0f172a",
    segmentBg: "#f1f5f9",
    segmentBorder: "#e2e8f0",
    segmentActiveBg: "#ffffff",
    segmentActiveText: "#0f172a",
    segmentActiveShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
    segmentInactiveText: "#64748b",
    accent: "#4f46e5",
    accentGradient: "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
    headerBg: "rgba(255, 255, 255, 0.96)",
    headerBorder: "#e2e8f0",
    stickyBg: "rgba(248, 250, 252, 0.94)",
    divider: "#e2e8f0",
    progressBarBg: "#e2e8f0",
    statusColors: {
      surplus: {
        bg: "#ecfdf5",
        text: "#065f46",
        border: "#a7f3d0",
        gradient: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
        solid: "#059669"
      },
      boundary: {
        bg: "#fffbeb",
        text: "#92400e",
        border: "#fde68a",
        gradient: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
        solid: "#d97706"
      },
      deficit: {
        bg: "#fff1f2",
        text: "#9f1239",
        border: "#fecdd3",
        gradient: "linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)",
        solid: "#e11d48"
      },
      no_classes: {
        bg: "#f1f5f9",
        text: "#475569",
        border: "#cbd5e1",
        gradient: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
        solid: "#64748b"
      }
    }
  }
}


