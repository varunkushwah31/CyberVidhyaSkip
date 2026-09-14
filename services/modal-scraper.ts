import type { CachedCourse, SubjectAttendance } from "~types";
import { compute75Metrics } from "~utils/attendance-calculator";
import { cleanElementText } from "~utils/dom-utils";



import { injectBadge } from "./badge-renderer";


// In-memory cache of exact course attendance
const courseDataCache = new Map<string, CachedCourse>()

/**
 * Saves a course's exact class metrics into the cache.
 */
export function cacheCourseData(entry: CachedCourse): void {
  const normName = entry.courseName.toUpperCase().trim()
  const normComp = entry.componentName.toUpperCase().trim()
  const normCode = entry.courseCode.toUpperCase().trim()

  if (normCode) {
    courseDataCache.set(normCode, entry)
    courseDataCache.set(`${normCode}_${normComp}`, entry)
  }

  if (normName) {
    courseDataCache.set(normName, entry)
    courseDataCache.set(`${normName}_${normComp}`, entry)
  }
}

/**
 * Looks up cached course metrics by code, name, and component.
 */
export function findCachedCourse(
  courseCode: string,
  courseName: string,
  component: string
): CachedCourse | undefined {
  const normCode = courseCode.toUpperCase().trim()
  const normName = courseName.toUpperCase().trim()
  const normComp = component.toUpperCase().trim()

  let cached =
    courseDataCache.get(`${normCode}_${normComp}`) ||
    courseDataCache.get(normCode) ||
    courseDataCache.get(`${normName}_${normComp}`) ||
    courseDataCache.get(normName)

  if (!cached) {
    for (const [key, val] of courseDataCache.entries()) {
      if (
        (normName.length > 5 && key.includes(normName.slice(0, 8))) ||
        (normCode && key.startsWith(normCode))
      ) {
        cached = val
        break
      }
    }
  }

  return cached
}

/**
 * Passively scrapes the modal header when a user opens "Lecture Wise Attendance Details".
 * Captures exact counts (Present & Lecture) and injects a clean status badge into the header.
 */
export function scrapeModalHeader(): SubjectAttendance | null {
  const modal = document.querySelector(".modal, [class*='modal'], [class*='dialog'], [class*='popup']")
  if (!modal) return null

  const modalText = cleanElementText(modal as HTMLElement)
  const lowerText = modalText.toLowerCase()

  if (!lowerText.includes("course name") && !lowerText.includes("lecture wise")) {
    return null
  }

  const courseMatch = modalText.match(
    /Course Name\s*:\s*([^:\n\r]+?)(?=\s*(?:Component Name|Course Section|Present|Lecture|$))/i
  )
  const compMatch = modalText.match(
    /Component Name\s*:\s*([^:\n\r]+?)(?=\s*(?:Course Section|Present|Lecture|$))/i
  )
  const presentMatch = modalText.match(/Present\s*:\s*(\d+)/i)
  const lectureMatch = modalText.match(/Lecture\s*:\s*(\d+)/i)

  if (courseMatch && presentMatch && lectureMatch) {
    const subjectName = courseMatch[1].trim()
    const component = compMatch ? compMatch[1].trim().toUpperCase() : "THEORY"
    const attended = Number.parseInt(presentMatch[1], 10)
    const total = Number.parseInt(lectureMatch[1], 10)

    if (total > 0 && attended <= total && subjectName) {
      const missed = Math.max(0, total - attended)
      const metrics = compute75Metrics(attended, total)

      // Cache this exact course data
      const entry: CachedCourse = {
        courseCode: "",
        courseName: subjectName,
        componentName: component,
        presentClasses: attended,
        totalClasses: total,
        percentage: metrics.percentage
      }
      cacheCourseData(entry)

      // Inject badge into modal title header
      const headerBlock = modal.querySelector(".modal-body, [class*='body'], [class*='header'], table")?.parentElement
      const targetHeader = modal.querySelector("h1, h2, h3, h4, h5, [class*='title']") || headerBlock
      if (targetHeader) {
        injectBadge(targetHeader as HTMLElement, metrics.message, metrics.badgeStyles)
      }

      return {
        id: `${subjectName}-${total}`,
        subjectName,
        component,
        attended,
        missed,
        total,
        percentage: metrics.percentage,
        status: metrics.status,
        actionCount: metrics.actionCount,
        message: metrics.message
      }
    }
  }

  return null
}
