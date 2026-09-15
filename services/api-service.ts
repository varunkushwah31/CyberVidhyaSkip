import type { CachedCourse } from "~types";



import { cacheCourseData } from "./modal-scraper";


let lastFetchTimestamp = 0
const CACHE_TTL_MS = 120_000 // 2 minutes in-memory cache
let activeFetchPromise: Promise<boolean> | null = null

/**
 * Discovers authentication tokens stored in cookies, localStorage, or sessionStorage.
 */
export function findAuthToken(): string {
  // 1. Check document.cookie for auth_token
  const cookieMatch = new RegExp(/(?:auth_token|token|jwt|session)=([^;]+)/i).exec(
    document.cookie
  )
  if (cookieMatch) {
    const val = decodeURIComponent(cookieMatch[1].trim())
    if (val.length > 15) return val
  }

  // 2. Check localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || ""
      const val = localStorage.getItem(key) || ""

      // JWT direct token
      if (val.startsWith("eyJ")) {
        return val.replace(/^["']|["']$/g, "")
      }

      // JSON object containing token
      if (val.startsWith("{") || val.startsWith("[")) {
        try {
          const obj = JSON.parse(val)
          if (typeof obj.token === "string" && obj.token.length > 15) return obj.token
          if (typeof obj.accessToken === "string" && obj.accessToken.length > 15) return obj.accessToken
          if (typeof obj.access_token === "string" && obj.access_token.length > 15) return obj.access_token
          if (typeof obj.authToken === "string" && obj.authToken.length > 15) return obj.authToken
          if (typeof obj.data?.token === "string" && obj.data.token.length > 15) return obj.data.token
        } catch {
          // Ignore JSON parse errors
        }
      }

      if (key.toLowerCase().includes("token") || key.toLowerCase().includes("auth")) {
        const clean = val.replace(/^["']|["']$/g, "")
        if (clean.length > 15) return clean
      }
    }
  } catch {
    // Ignore storage errors
  }

  // 3. Check sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i) || ""
      const val = sessionStorage.getItem(key) || ""
      if (val.startsWith("eyJ")) {
        return val.replace(/^["']|["']$/g, "")
      }
      if (key.toLowerCase().includes("token")) {
        const clean = val.replace(/^["']|["']$/g, "")
        if (clean.length > 15) return clean
      }
    }
  } catch {
    // Ignore storage errors
  }

  return ""
}

/**
 * Fetches exact attendance data from CyberVidya API.
 * Uses promise deduplication, 2-minute cache TTL, and fast abort timeouts for optimal speed.
 */
export async function fetchCyberVidhyaAttendance(force = false): Promise<boolean> {
  if (!window.location.hostname.includes("cybervidya.net")) {
    return false
  }

  // Use cached response if available within TTL to avoid network overhead
  const now = Date.now()
  if (!force && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return true
  }

  // Reuse in-flight request if already pending
  if (activeFetchPromise) {
    return activeFetchPromise
  }

  activeFetchPromise = (async () => {
    try {
      const token = findAuthToken()
      const authHeader = token ? `GlobalEducation ${token}` : null

      const headers: Record<string, string> = {
        Accept: "application/json, text/plain, */*"
      }
      if (authHeader) {
        headers["Authorization"] = authHeader
      }

      // Fast abort controller with 2500ms timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)

      try {
        const res = await fetch("/api/attendance/course/component/student", {
          headers,
          credentials: "include",
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (res.ok) {
          const json = await res.json()
          const rawList =
            json?.data?.attendanceCourseComponentInfoList ||
            json?.data?.attendanceCourseComponentNameInfoList ||
            json?.data?.registeredCourseList ||
            json?.data

          if (Array.isArray(rawList) && rawList.length > 0) {
            lastFetchTimestamp = Date.now()

            rawList.forEach((item: any) => {
              const courseCode = (item.courseCode || "").trim().toUpperCase()
              const courseName = (item.courseName || "").trim()

              const compList =
                item.attendanceCourseComponentNameInfoList ||
                item.attendanceComponentInfoList ||
                item.componentList ||
                []

              if (Array.isArray(compList) && compList.length > 0) {
                compList.forEach((comp: any) => {
                  const componentName = (comp.componentName || "THEORY").trim().toUpperCase()
                  const presentClasses =
                    comp.numberOfPresent ?? comp.presentClasses ?? comp.attendedClasses ?? 0
                  const totalClasses =
                    comp.numberOfPeriods ?? comp.totalClasses ?? comp.conductedClasses ?? 0
                  const percentage =
                    comp.presentPercentage ??
                    (totalClasses > 0
                      ? Number(((presentClasses / totalClasses) * 100).toFixed(1))
                      : 0)

                  const entry: CachedCourse = {
                    courseCode,
                    courseName,
                    componentName,
                    presentClasses,
                    totalClasses,
                    percentage
                  }

                  cacheCourseData(entry)
                })
              } else {
                const componentName = (
                  item.componentName ||
                  item.component ||
                  "THEORY"
                ).trim().toUpperCase()
                const presentClasses =
                  item.numberOfPresent ?? item.presentClasses ?? item.attendedClasses ?? 0
                const totalClasses =
                  item.numberOfPeriods ?? item.totalClasses ?? item.conductedClasses ?? 0
                const percentage =
                  item.presentPercentage ??
                  item.percentage ??
                  (totalClasses > 0
                    ? Number(((presentClasses / totalClasses) * 100).toFixed(1))
                    : 0)

                const entry: CachedCourse = {
                  courseCode,
                  courseName,
                  componentName,
                  presentClasses,
                  totalClasses,
                  percentage
                }

                cacheCourseData(entry)
              }
            })

            return true
          }
        }
      } catch {
        clearTimeout(timeoutId)
      }

      return false
    } finally {
      activeFetchPromise = null
    }
  })()

  return activeFetchPromise
}
