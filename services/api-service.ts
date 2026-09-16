import type { CachedCourse } from "~types";
import { cleanElementText, parseInteger, parsePercentage } from "~utils/dom-utils";
import { cacheCourseData } from "./modal-scraper";
import { findTableColumnIndices, isCourseTable } from "./table-scraper";


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
 * Extracts class counts from API response item, ensuring students marked "ADJUSTED"
 * are counted as present.
 */
function extractClassCounts(item: any): {
  presentClasses: number
  totalClasses: number
  percentage: number
  adjustedClasses: number
} {
  const rawPresent = item.numberOfPresent ?? item.presentClasses ?? item.attendedClasses ?? 0
  const rawAbsent = item.numberOfAbsent ?? item.absentClasses ?? item.missedClasses ?? 0
  const totalClasses =
    item.conductedClasses ??
    item.totalClasses ??
    item.numberOfConducted ??
    (rawPresent > 0 || rawAbsent > 0 ? rawPresent + rawAbsent : 0)
  const adjusted =
    item.numberOfAdjusted ??
    item.numberOfAdjustment ??
    item.numberOfAdjust ??
    item.adjustedClasses ??
    item.adjustedPeriods ??
    item.adjusted ??
    item.adjustment ??
    item.totalAdjusted ??
    item.onDuty ??
    item.od ??
    0

  // Students marked ADJUSTED are counted as present
  let presentClasses = rawPresent + adjusted

  if (adjusted === 0 && totalClasses > 0 && rawAbsent > 0 && totalClasses > rawPresent + rawAbsent) {
    presentClasses = totalClasses - rawAbsent
  }

  const rawPercent = item.presentPercentage ?? item.percentage
  if (typeof rawPercent === "number" && totalClasses > 0) {
    const percentAttended = Math.round((rawPercent / 100) * totalClasses)
    if (percentAttended > presentClasses) {
      presentClasses = percentAttended
    }
  }

  const percentage =
    rawPercent ??
    (totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 0)

  return { presentClasses, totalClasses, percentage, adjustedClasses: adjusted }
}

/**
 * Fetches exact attendance data from CyberVidya API.
 * Uses promise deduplication, 2-minute cache TTL, and fast abort timeouts for optimal speed.
 */
let apiEndpointDisabled = false

export async function fetchCyberVidhyaAttendance(force = false): Promise<boolean> {
  if (!window.location.hostname.includes("cybervidya.net")) {
    return false
  }

  // Use cached response if available within TTL to avoid network overhead
  const now = Date.now()
  if (!force && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return true
  }

  // If the internal API is known to return 500/404 on this portal, fall back directly to page scraping
  if (apiEndpointDisabled) {
    return fetchMyAttendancePage()
  }

  // Reuse in-flight request if already pending
  if (activeFetchPromise) {
    return activeFetchPromise
  }

  activeFetchPromise = (async () => {
    try {
      const token = findAuthToken()
      if (!token) {
        return false
      }
      const authHeader = `GlobalEducation ${token}`

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

        if (!res.ok) {
          if (res.status >= 500 || res.status === 404) {
            apiEndpointDisabled = true
          }
        } else {
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
                  const { presentClasses, totalClasses, percentage, adjustedClasses } = extractClassCounts(comp)

                  const entry: CachedCourse = {
                    courseCode,
                    courseName,
                    componentName,
                    presentClasses,
                    totalClasses,
                    percentage,
                    adjustedClasses
                  }

                  cacheCourseData(entry)
                })
              } else {
                const componentName = (
                  item.componentName ||
                  item.component ||
                  "THEORY"
                ).trim().toUpperCase()
                const { presentClasses, totalClasses, percentage, adjustedClasses } = extractClassCounts(item)

                const entry: CachedCourse = {
                  courseCode,
                  courseName,
                  componentName,
                  presentClasses,
                  totalClasses,
                  percentage,
                  adjustedClasses
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

      // Also try fetching /attendance/my-attendance directly
      const pageResult = await fetchMyAttendancePage()
      if (pageResult) {
        lastFetchTimestamp = Date.now()
        return true
      }

      return false
    } finally {
      activeFetchPromise = null
    }
  })()

  return activeFetchPromise
}

/**
 * Fetches and parses the /attendance/my-attendance page to extract exact course metrics.
 */
export async function fetchMyAttendancePage(): Promise<boolean> {
  if (typeof window === "undefined" || !window.location.hostname.includes("cybervidya.net")) {
    return false
  }

  try {
    const res = await fetch("/attendance/my-attendance", {
      credentials: "include",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    })

    if (!res.ok) return false
    const html = await res.text()

    if (!html.includes("Lectures") && !html.includes("Presents") && !html.includes("Course")) {
      return false
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const tables = doc.querySelectorAll<HTMLTableElement>("table")
    let foundAny = false

    tables.forEach((table) => {
      const headerCells = Array.from(table.querySelectorAll("th, thead td"))
      const headerTexts = headerCells.map((c) => (c.textContent || "").toLowerCase().trim())
      const headerJoined = headerTexts.join(" ")

      if (!isCourseTable(headerJoined)) return

      const indices = findTableColumnIndices(headerCells)
      const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr, tr")

      rows.forEach((row) => {
        if (row.querySelector("th") && !row.querySelector("td")) return
        const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"))
        if (cells.length < 4) return

        const codeCell = indices.codeIdx >= 0 ? cells[indices.codeIdx] : null
        const nameCell = indices.nameIdx >= 0 ? cells[indices.nameIdx] : null
        const compCell = indices.compIdx >= 0 ? cells[indices.compIdx] : null
        const percentCell = indices.percentIdx >= 0 ? cells[indices.percentIdx] : null

        if (!nameCell || !percentCell) return

        let courseCode = codeCell ? cleanElementText(codeCell).toUpperCase() : ""
        const variantMatch = /^([A-Z0-9]+)/i.exec(courseCode)
        if (courseCode.includes("-") && variantMatch) {
          courseCode = variantMatch[1].toUpperCase()
        }

        const courseName = cleanElementText(nameCell)
        const component = compCell ? cleanElementText(compCell).toUpperCase() : "THEORY"
        const percentage = parsePercentage(cleanElementText(percentCell))

        const present =
          indices.presentIdx >= 0 && cells[indices.presentIdx]
            ? parseInteger(cleanElementText(cells[indices.presentIdx]), -1)
            : -1
        const adjusted =
          indices.adjustedIdx >= 0 && cells[indices.adjustedIdx]
            ? parseInteger(cleanElementText(cells[indices.adjustedIdx]), 0)
            : 0
        const total =
          indices.totalIdx >= 0 && cells[indices.totalIdx]
            ? parseInteger(cleanElementText(cells[indices.totalIdx]), -1)
            : -1

        if (present >= 0 && total > 0) {
          const attended = present + adjusted
          cacheCourseData({
            courseCode,
            courseName,
            componentName: component,
            presentClasses: attended,
            totalClasses: total,
            percentage,
            adjustedClasses: adjusted
          })
          foundAny = true
        }
      })
    })

    return foundAny
  } catch {
    return false
  }
}

