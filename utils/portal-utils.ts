/**
 * Utility functions for dynamic CyberVidhya institute portal resolution.
 * Supports any institution running CyberVidhya (e.g. KIET, ABES, AKGEC, etc.)
 */

export const DEFAULT_FALLBACK_PORTAL = "https://kiet.cybervidya.net"
export const ATTENDANCE_PATH = "/attendance/my-attendance"

/**
 * Extracts the base origin URL (e.g. https://kiet.cybervidya.net) from a given URL or hostname.
 */
export function getPortalOrigin(candidateUrl?: string | null): string {
  if (!candidateUrl) return DEFAULT_FALLBACK_PORTAL

  try {
    const parsed = new URL(candidateUrl)
    if (parsed.hostname.includes("cybervidya.net")) {
      return parsed.origin
    }
  } catch {
    // If not a full URL, check if candidate is a hostname
    if (candidateUrl.includes("cybervidya.net")) {
      return `https://${candidateUrl.replace(/^https?:\/\//, "").split("/")[0]}`
    }
  }

  return DEFAULT_FALLBACK_PORTAL
}

/**
 * Returns the full /attendance/my-attendance URL for the active portal.
 */
export function getPortalAttendanceUrl(candidateUrl?: string | null): string {
  const origin = getPortalOrigin(candidateUrl)
  return `${origin}${ATTENDANCE_PATH}`
}

/**
 * Extracts the readable institute subdomain name (e.g. "kiet", "abes", "akgec")
 */
export function getInstituteName(candidateUrl?: string | null): string {
  try {
    const origin = getPortalOrigin(candidateUrl)
    const hostname = new URL(origin).hostname
    const parts = hostname.split(".")
    if (parts.length >= 3 && parts[parts.length - 2] === "cybervidya") {
      return parts[0].toUpperCase()
    }
  } catch {
    // Fallback
  }
  return "PORTAL"
}
