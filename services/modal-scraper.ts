import type { CachedCourse, SubjectAttendance } from "~types";
import { compute75Metrics } from "~utils/attendance-calculator";
import { cleanElementText } from "~utils/dom-utils";



import { injectBadge } from "./badge-renderer";


// In-memory cache of exact course attendance
const courseDataCache = new Map<string, CachedCourse>()

export interface ClickedCourseContext {
  courseCode: string
  courseName: string
  component: string
  percentage: number
}

let lastClickedCourse: ClickedCourseContext | null = null

export function setLastClickedCourse(ctx: ClickedCourseContext): void {
  lastClickedCourse = ctx
}

// Load persisted cache on startup
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get(["courseDataCache"], (res) => {
    if (res.courseDataCache && typeof res.courseDataCache === "object") {
      Object.entries(res.courseDataCache).forEach(([key, val]) => {
        courseDataCache.set(key, val as CachedCourse)
      })
    }
  })
}

function persistCache(): void {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const serialized: Record<string, CachedCourse> = {}
    courseDataCache.forEach((v, k) => {
      serialized[k] = v
    })
    chrome.storage.local.set({ courseDataCache: serialized })
  }
}

/**
 * Normalizes course name by removing trailing dots, ellipsis, punctuation, and excess whitespace.
 */
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\.{2,}/g, "")
    .replaceAll('…', "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Saves a course's exact class metrics into the cache.
 */
export function cacheCourseData(entry: CachedCourse): void {
  const normName = normalizeName(entry.courseName)
  const normComp = entry.componentName.toUpperCase().trim()
  const normCode = entry.courseCode.toUpperCase().trim()

  if (normCode) {
    courseDataCache.set(normCode, entry)
    if (normComp) {
      courseDataCache.set(`${normCode}_${normComp}`, entry)
    }
  }

  if (normName) {
    courseDataCache.set(normName, entry)
    if (normComp) {
      courseDataCache.set(`${normName}_${normComp}`, entry)
    }
    // Also index first 10-14 characters for truncated table names
    if (normName.length >= 8) {
      courseDataCache.set(normName.slice(0, 10), entry)
      courseDataCache.set(normName.slice(0, 14), entry)
    }
  }

  persistCache()
}

function findDirectCacheMatch(
  normCode: string,
  cleanName: string,
  normComp: string
): CachedCourse | undefined {
  const candidateKeys: string[] = []

  if (normCode && normComp) candidateKeys.push(`${normCode}_${normComp}`)
  if (normCode) candidateKeys.push(normCode)
  if (cleanName && normComp) candidateKeys.push(`${cleanName}_${normComp}`)
  if (cleanName) candidateKeys.push(cleanName)

  for (const key of candidateKeys) {
    const cached = courseDataCache.get(key)
    if (cached) return cached
  }

  return undefined
}

function isFuzzyNameMatch(cleanKey: string, cleanName: string): boolean {
  if (cleanName.length < 6) return false
  const prefix = cleanName.slice(0, 8)
  const keyPrefix = cleanKey.slice(0, 8)
  return (
    cleanKey.startsWith(cleanName) ||
    cleanName.startsWith(cleanKey) ||
    cleanKey.includes(prefix) ||
    cleanName.includes(keyPrefix)
  )
}

function isComponentCompatible(valComp: string | undefined, normComp: string): boolean {
  return !normComp || !valComp || valComp === normComp
}

function findFuzzyCacheMatch(
  normCode: string,
  cleanName: string,
  normComp: string
): CachedCourse | undefined {
  for (const [key, val] of courseDataCache.entries()) {
    if (normCode && key.startsWith(normCode)) {
      return val
    }

    const cleanKey = normalizeName(key)
    if (isFuzzyNameMatch(cleanKey, cleanName) && isComponentCompatible(val.componentName, normComp)) {
      return val
    }
  }

  return undefined
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
  const normComp = component.toUpperCase().trim()
  const cleanName = normalizeName(courseName)

  return (
    findDirectCacheMatch(normCode, cleanName, normComp) ??
    findFuzzyCacheMatch(normCode, cleanName, normComp)
  )
}

/**
 * Checks and returns the modal element if visible.
 */
function getVisibleAttendanceModal(): HTMLElement | null {
  const modal = document.querySelector<HTMLElement>(
    ".modal, [class*='modal'], [class*='dialog'], [class*='popup']"
  )
  if (!modal) return null

  const style = window.getComputedStyle(modal)
  if (style.display === "none" || style.visibility === "hidden" || modal.classList.contains("hidden")) {
    return null
  }

  return modal
}

/**
 * Finds colon index immediately associated with a field label.
 * Anchored match prevents backtracking over unrelated text.
 */
function findFieldColonIndex(text: string, fieldName: string): number {
  const lowerText = text.toLowerCase()
  const lowerField = fieldName.toLowerCase()
  let fromIndex = 0

  while (fromIndex < text.length) {
    const startIdx = lowerText.indexOf(lowerField, fromIndex)
    if (startIdx === -1) return -1

    const remainder = text.slice(startIdx + lowerField.length)
    const match = /^[ \t]{0,5}:/.exec(remainder)
    if (match) {
      return startIdx + lowerField.length + match[0].length - 1
    }

    fromIndex = startIdx + lowerField.length
  }

  return -1
}

/**
 * Extracts field text following a label and colon up to the next delimiter keyword.
 * Uses linear index search to prevent catastrophic backtracking (ReDoS).
 */
function extractModalField(text: string, fieldName: string, delimiters: string[]): string {
  const colonIdx = findFieldColonIndex(text, fieldName)
  if (colonIdx === -1) return ""

  const valueStart = colonIdx + 1
  let valueEnd = text.length
  const lowerText = text.toLowerCase()

  for (const delim of delimiters) {
    const dIdx = lowerText.indexOf(delim.toLowerCase(), valueStart)
    if (dIdx !== -1 && dIdx < valueEnd) {
      valueEnd = dIdx
    }
  }

  return text.slice(valueStart, valueEnd).trim()
}

/**
 * Extracts integer value following a field label and colon.
 * Uses start anchor ^ and bounded quantifier {1,10} to guarantee linear time.
 */
function extractModalNumber(text: string, fieldName: string): number | null {
  const colonIdx = findFieldColonIndex(text, fieldName)
  if (colonIdx === -1) return null

  const afterColon = text.slice(colonIdx + 1).trimStart()
  const match = /^(\d{1,10})/.exec(afterColon)
  if (!match) return null

  return Number.parseInt(match[1], 10)
}

interface ModalAttendanceData {
  subjectName: string
  component: string
  attended: number
  total: number
}

/**
 * Parses attendance values from modal text without backtracking regular expressions.
 */
function parseModalAttendanceDetails(modalText: string): ModalAttendanceData | null {
  const lowerText = modalText.toLowerCase()
  if (!lowerText.includes("course name") && !lowerText.includes("lecture wise")) {
    return null
  }

  const subjectName = extractModalField(modalText, "Course Name", [
    "Component Name",
    "Course Section",
    "Present",
    "Lecture"
  ])
  const rawComp = extractModalField(modalText, "Component Name", [
    "Course Section",
    "Present",
    "Lecture"
  ])
  const component = rawComp ? rawComp.toUpperCase() : "THEORY"
  const attended = extractModalNumber(modalText, "Present")
  const total = extractModalNumber(modalText, "Lecture")

  if (!subjectName || attended === null || total === null) {
    return null
  }

  if (total <= 0 || attended > total) {
    return null
  }

  return { subjectName, component, attended, total }
}

/**
 * Injects status badge into modal title header element.
 */
function injectModalHeaderBadge(
  modal: HTMLElement,
  message: string,
  badgeStyles: ReturnType<typeof compute75Metrics>["badgeStyles"]
): void {
  const headerBlock = modal.querySelector(".modal-body, [class*='body'], [class*='header'], table")?.parentElement
  const targetHeader = modal.querySelector("h1, h2, h3, h4, h5, [class*='title']") || headerBlock
  if (targetHeader) {
    injectBadge(targetHeader as HTMLElement, message, badgeStyles)
  }
}

/**
 * Creates SubjectAttendance record and persists exact metrics into cache.
 */
function createAttendanceRecord(data: ModalAttendanceData): SubjectAttendance {
  const { subjectName, component, attended, total } = data
  const missed = Math.max(0, total - attended)
  const metrics = compute75Metrics(attended, total)

  let matchedCode = ""
  if (lastClickedCourse) {
    matchedCode = lastClickedCourse.courseCode
  }

  const entry: CachedCourse = {
    courseCode: matchedCode,
    courseName: subjectName,
    componentName: component,
    presentClasses: attended,
    totalClasses: total,
    percentage: metrics.percentage
  }
  cacheCourseData(entry)

  return {
    id: `${matchedCode || subjectName}-${total}`,
    courseCode: matchedCode,
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

/**
 * Passively scrapes the modal header when a user opens "Lecture Wise Attendance Details".
 * Captures exact counts (Present & Lecture) and injects a clean status badge into the header.
 */
export function scrapeModalHeader(): SubjectAttendance | null {
  const modal = getVisibleAttendanceModal()
  if (!modal) return null

  const modalText = cleanElementText(modal)
  const data = parseModalAttendanceDetails(modalText)
  if (!data) return null

  const metrics = compute75Metrics(data.attended, data.total)
  injectModalHeaderBadge(modal, metrics.message, metrics.badgeStyles)

  return createAttendanceRecord(data)
}

