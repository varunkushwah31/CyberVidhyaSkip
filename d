warning: in the working copy of 'services/api-service.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'services/modal-scraper.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'services/table-scraper.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'types/index.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/services/api-service.ts b/services/api-service.ts[m
[1mindex 45ffc46..39071b5 100644[m
[1m--- a/services/api-service.ts[m
[1m+++ b/services/api-service.ts[m
[36m@@ -76,6 +76,54 @@[m [mexport function findAuthToken(): string {[m
   return ""[m
 }[m
 [m
[32m+[m[32m/**[m
[32m+[m[32m * Extracts class counts from API response item, ensuring students marked "ADJUSTED"[m
[32m+[m[32m * are counted as present.[m
[32m+[m[32m */[m
[32m+[m[32mfunction extractClassCounts(item: any): {[m
[32m+[m[32m  presentClasses: number[m
[32m+[m[32m  totalClasses: number[m
[32m+[m[32m  percentage: number[m
[32m+[m[32m  adjustedClasses: number[m
[32m+[m[32m} {[m
[32m+[m[32m  const rawPresent = item.numberOfPresent ?? item.presentClasses ?? item.attendedClasses ?? 0[m
[32m+[m[32m  const totalClasses = item.numberOfPeriods ?? item.totalClasses ?? item.conductedClasses ?? 0[m
[32m+[m[32m  const rawAbsent = item.numberOfAbsent ?? item.absentClasses ?? item.missedClasses ?? 0[m
[32m+[m[32m  const adjusted =[m
[32m+[m[32m    item.numberOfAdjusted ??[m
[32m+[m[32m    item.numberOfAdjustment ??[m
[32m+[m[32m    item.numberOfAdjust ??[m
[32m+[m[32m    item.adjustedClasses ??[m
[32m+[m[32m    item.adjustedPeriods ??[m
[32m+[m[32m    item.adjusted ??[m
[32m+[m[32m    item.adjustment ??[m
[32m+[m[32m    item.totalAdjusted ??[m
[32m+[m[32m    item.onDuty ??[m
[32m+[m[32m    item.od ??[m
[32m+[m[32m    0[m
[32m+[m
[32m+[m[32m  // Students marked ADJUSTED are counted as present[m
[32m+[m[32m  let presentClasses = rawPresent + adjusted[m
[32m+[m
[32m+[m[32m  if (adjusted === 0 && totalClasses > 0 && rawAbsent > 0 && totalClasses > rawPresent + rawAbsent) {[m
[32m+[m[32m    presentClasses = totalClasses - rawAbsent[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  const rawPercent = item.presentPercentage ?? item.percentage[m
[32m+[m[32m  if (typeof rawPercent === "number" && totalClasses > 0) {[m
[32m+[m[32m    const percentAttended = Math.round((rawPercent / 100) * totalClasses)[m
[32m+[m[32m    if (percentAttended > presentClasses) {[m
[32m+[m[32m      presentClasses = percentAttended[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  const percentage =[m
[32m+[m[32m    rawPercent ??[m
[32m+[m[32m    (totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(1)) : 0)[m
[32m+[m
[32m+[m[32m  return { presentClasses, totalClasses, percentage, adjustedClasses: adjusted }[m
[32m+[m[32m}[m
[32m+[m
 /**[m
  * Fetches exact attendance data from CyberVidya API.[m
  * Uses promise deduplication, 2-minute cache TTL, and fast abort timeouts for optimal speed.[m
[36m@@ -145,15 +193,7 @@[m [mexport async function fetchCyberVidhyaAttendance(force = false): Promise<boolean[m
               if (Array.isArray(compList) && compList.length > 0) {[m
                 compList.forEach((comp: any) => {[m
                   const componentName = (comp.componentName || "THEORY").trim().toUpperCase()[m
[31m-                  const presentClasses =[m
[31m-                    comp.numberOfPresent ?? comp.presentClasses ?? comp.attendedClasses ?? 0[m
[31m-                  const totalClasses =[m
[31m-                    comp.numberOfPeriods ?? comp.totalClasses ?? comp.conductedClasses ?? 0[m
[31m-                  const percentage =[m
[31m-                    comp.presentPercentage ??[m
[31m-                    (totalClasses > 0[m
[31m-                      ? Number(((presentClasses / totalClasses) * 100).toFixed(1))[m
[31m-                      : 0)[m
[32m+[m[32m                  const { presentClasses, totalClasses, percentage, adjustedClasses } = extractClassCounts(comp)[m
 [m
                   const entry: CachedCourse = {[m
                     courseCode,[m
[36m@@ -161,7 +201,8 @@[m [mexport async function fetchCyberVidhyaAttendance(force = false): Promise<boolean[m
                     componentName,[m
                     presentClasses,[m
                     totalClasses,[m
[31m-                    percentage[m
[32m+[m[32m                    percentage,[m
[32m+[m[32m                    adjustedClasses[m
                   }[m
 [m
                   cacheCourseData(entry)[m
[36m@@ -172,16 +213,7 @@[m [mexport async function fetchCyberVidhyaAttendance(force = false): Promise<boolean[m
                   item.component ||[m
                   "THEORY"[m
                 ).trim().toUpperCase()[m
[31m-                const presentClasses =[m
[31m-                  item.numberOfPresent ?? item.presentClasses ?? item.attendedClasses ?? 0[m
[31m-                const totalClasses =[m
[31m-                  item.numberOfPeriods ?? item.totalClasses ?? item.conductedClasses ?? 0[m
[31m-                const percentage =[m
[31m-                  item.presentPercentage ??[m
[31m-                  item.percentage ??[m
[31m-                  (totalClasses > 0[m
[31m-                    ? Number(((presentClasses / totalClasses) * 100).toFixed(1))[m
[31m-                    : 0)[m
[32m+[m[32m                const { presentClasses, totalClasses, percentage, adjustedClasses } = extractClassCounts(item)[m
 [m
                 const entry: CachedCourse = {[m
                   courseCode,[m
[36m@@ -189,7 +221,8 @@[m [mexport async function fetchCyberVidhyaAttendance(force = false): Promise<boolean[m
                   componentName,[m
                   presentClasses,[m
                   totalClasses,[m
[31m-                  percentage[m
[32m+[m[32m                  percentage,[m
[32m+[m[32m                  adjustedClasses[m
                 }[m
 [m
                 cacheCourseData(entry)[m
[1mdiff --git a/services/modal-scraper.ts b/services/modal-scraper.ts[m
[1mindex 9c98f9d..f463237 100644[m
[1m--- a/services/modal-scraper.ts[m
[1m+++ b/services/modal-scraper.ts[m
[36m@@ -244,10 +244,12 @@[m [minterface ModalAttendanceData {[m
   component: string[m
   attended: number[m
   total: number[m
[32m+[m[32m  adjusted?: number[m
 }[m
 [m
 /**[m
  * Parses attendance values from modal text without backtracking regular expressions.[m
[32m+[m[32m * Ensures students marked "ADJUSTED" are counted as present.[m
  */[m
 function parseModalAttendanceDetails(modalText: string): ModalAttendanceData | null {[m
   const lowerText = modalText.toLowerCase()[m
[36m@@ -255,30 +257,85 @@[m [mfunction parseModalAttendanceDetails(modalText: string): ModalAttendanceData | n[m
     return null[m
   }[m
 [m
[31m-  const subjectName = extractModalField(modalText, "Course Name", [[m
[32m+[m[32m  const delimiters = [[m
     "Component Name",[m
     "Course Section",[m
[32m+[m[32m    "Section",[m
     "Present",[m
[31m-    "Lecture"[m
[31m-  ])[m
[31m-  const rawComp = extractModalField(modalText, "Component Name", [[m
[31m-    "Course Section",[m
[31m-    "Present",[m
[31m-    "Lecture"[m
[31m-  ])[m
[32m+[m[32m    "Absent",[m
[32m+[m[32m    "Adjusted",[m
[32m+[m[32m    "Adjustment",[m
[32m+[m[32m    "Adjust",[m
[32m+[m[32m    "Lecture",[m
[32m+[m[32m    "Total"[m
[32m+[m[32m  ][m
[32m+[m
[32m+[m[32m  const subjectName = extractModalField(modalText, "Course Name", delimiters)[m
[32m+[m[32m  const rawComp = extractModalField(modalText, "Component Name", delimiters)[m
   const component = rawComp ? rawComp.toUpperCase() : "THEORY"[m
[31m-  const attended = extractModalNumber(modalText, "Present")[m
[31m-  const total = extractModalNumber(modalText, "Lecture")[m
 [m
[31m-  if (!subjectName || attended === null || total === null) {[m
[32m+[m[32m  const present = extractModalNumber(modalText, "Present")[m
[32m+[m[32m  const absent = extractModalNumber(modalText, "Absent")[m
[32m+[m[32m  const adjusted =[m
[32m+[m[32m    extractModalNumber(modalText, "Adjusted") ??[m
[32m+[m[32m    extractModalNumber(modalText, "Adjustment") ??[m
[32m+[m[32m    extractModalNumber(modalText, "Adjust") ??[m
[32m+[m[32m    0[m
[32m+[m
[32m+[m[32m  const total =[m
[32m+[m[32m    extractModalNumber(modalText, "Lecture") ??[m
[32m+[m[32m    extractModalNumber(modalText, "Total Lecture") ??[m
[32m+[m[32m    extractModalNumber(modalText, "Total") ??[m
[32m+[m[32m    extractModalNumber(modalText, "Conducted")[m
[32m+[m
[32m+[m[32m  if (!subjectName || present === null || total === null) {[m
     return null[m
   }[m
 [m
[32m+[m[32m  // Students marked ADJUSTED are counted as present[m
[32m+[m[32m  let attended = present + adjusted[m
[32m+[m[32m  if (adjusted === 0 && absent !== null && total > present + absent) {[m
[32m+[m[32m    attended = total - absent[m
[32m+[m[32m  }[m
[32m+[m
   if (total <= 0 || attended > total) {[m
     return null[m
   }[m
 [m
[31m-  return { subjectName, component, attended, total }[m
[32m+[m[32m  return { subjectName, component, attended, total, adjusted }[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/**[m
[32m+[m[32m * Parses lecture-wise date table rows inside the modal to tally Present, Absent, and Adjusted counts.[m
[32m+[m[32m */[m
[32m+[m[32mfunction parseModalLectureTable([m
[32m+[m[32m  modal: HTMLElement[m
[32m+[m[32m): { present: number; adjusted: number; absent: number; total: number } | null {[m
[32m+[m[32m  const rows = modal.querySelectorAll<HTMLTableRowElement>("tbody tr, table tr")[m
[32m+[m[32m  if (rows.length === 0) return null[m
[32m+[m
[32m+[m[32m  let present = 0[m
[32m+[m[32m  let adjusted = 0[m
[32m+[m[32m  let absent = 0[m
[32m+[m
[32m+[m[32m  rows.forEach((row) => {[m
[32m+[m[32m    if (row.querySelector("th") && !row.querySelector("td")) return[m
[32m+[m[32m    const text = cleanElementText(row).toUpperCase()[m
[32m+[m[32m    if (!text) return[m
[32m+[m
[32m+[m[32m    if (text.includes("ADJUSTED") || text.includes("ON DUTY") || text.includes(" OD ")) {[m
[32m+[m[32m      adjusted++[m
[32m+[m[32m    } else if (text.includes("PRESENT")) {[m
[32m+[m[32m      present++[m
[32m+[m[32m    } else if (text.includes("ABSENT")) {[m
[32m+[m[32m      absent++[m
[32m+[m[32m    }[m
[32m+[m[32m  })[m
[32m+[m
[32m+[m[32m  const total = present + adjusted + absent[m
[32m+[m[32m  if (total === 0) return null[m
[32m+[m
[32m+[m[32m  return { present, adjusted, absent, total }[m
 }[m
 [m
 /**[m
[36m@@ -300,7 +357,7 @@[m [mfunction injectModalHeaderBadge([m
  * Creates SubjectAttendance record and persists exact metrics into cache.[m
  */[m
 function createAttendanceRecord(data: ModalAttendanceData): SubjectAttendance {[m
[31m-  const { subjectName, component, attended, total } = data[m
[32m+[m[32m  const { subjectName, component, attended, total, adjusted } = data[m
   const missed = Math.max(0, total - attended)[m
   const metrics = compute75Metrics(attended, total)[m
 [m
[36m@@ -315,7 +372,8 @@[m [mfunction createAttendanceRecord(data: ModalAttendanceData): SubjectAttendance {[m
     componentName: component,[m
     presentClasses: attended,[m
     totalClasses: total,[m
[31m-    percentage: metrics.percentage[m
[32m+[m[32m    percentage: metrics.percentage,[m
[32m+[m[32m    adjustedClasses: adjusted[m
   }[m
   cacheCourseData(entry)[m
 [m
[36m@@ -330,13 +388,14 @@[m [mfunction createAttendanceRecord(data: ModalAttendanceData): SubjectAttendance {[m
     percentage: metrics.percentage,[m
     status: metrics.status,[m
     actionCount: metrics.actionCount,[m
[31m-    message: metrics.message[m
[32m+[m[32m    message: metrics.message,[m
[32m+[m[32m    adjusted[m
   }[m
 }[m
 [m
 /**[m
  * Passively scrapes the modal header when a user opens "Lecture Wise Attendance Details".[m
[31m- * Captures exact counts (Present & Lecture) and injects a clean status badge into the header.[m
[32m+[m[32m * Captures exact counts (Present, Adjusted, & Lecture) and injects a clean status badge into the header.[m
  */[m
 export function scrapeModalHeader(): SubjectAttendance | null {[m
   const modal = getVisibleAttendanceModal()[m
[36m@@ -346,9 +405,21 @@[m [mexport function scrapeModalHeader(): SubjectAttendance | null {[m
   const data = parseModalAttendanceDetails(modalText)[m
   if (!data) return null[m
 [m
[32m+[m[32m  // If modal has a lecture table with rows, verify/enhance attended with exact counts[m
[32m+[m[32m  const tableCounts = parseModalLectureTable(modal)[m
[32m+[m[32m  if (tableCounts && tableCounts.total >= data.total) {[m
[32m+[m[32m    const tableAttended = tableCounts.present + tableCounts.adjusted[m
[32m+[m[32m    if (tableAttended > data.attended) {[m
[32m+[m[32m      data.attended = tableAttended[m
[32m+[m[32m      data.total = tableCounts.total[m
[32m+[m[32m      data.adjusted = tableCounts.adjusted[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
   const metrics = compute75Metrics(data.attended, data.total)[m
   injectModalHeaderBadge(modal, metrics.message, metrics.badgeStyles)[m
 [m
   return createAttendanceRecord(data)[m
 }[m
 [m
[41m+[m
[1mdiff --git a/services/table-scraper.ts b/services/table-scraper.ts[m
[1mindex 25b7d34..a81e894 100644[m
[1m--- a/services/table-scraper.ts[m
[1m+++ b/services/table-scraper.ts[m
[36m@@ -1,16 +1,204 @@[m
 import type { AttendanceMetrics, SubjectAttendance } from "~types";[m
 import { compute75Metrics, estimateAttendance } from "~utils/attendance-calculator";[m
[31m-import { cleanElementText, parsePercentage } from "~utils/dom-utils";[m
[32m+[m[32mimport { cleanElementText, parseInteger, parsePercentage } from "~utils/dom-utils";[m
 [m
[32m+[m[32mimport { injectBadge } from "./badge-renderer";[m
[32m+[m[32mimport { cacheCourseData, findCachedCourse, setLastClickedCourse } from "./modal-scraper";[m
[32m+[m
[32m+[m[32minterface TableColumnIndices {[m
[32m+[m[32m  codeIdx: number[m
[32m+[m[32m  nameIdx: number[m
[32m+[m[32m  compIdx: number[m
[32m+[m[32m  creditIdx: number[m
[32m+[m[32m  percentIdx: number[m
[32m+[m[32m  presentIdx: number[m
[32m+[m[32m  absentIdx: number[m
[32m+[m[32m  totalIdx: number[m
[32m+[m[32m  adjustedIdx: number[m
[32m+[m[32m}[m
 [m
[32m+[m[32mfunction findTableColumnIndices(headerCells: Element[]): TableColumnIndices {[m
[32m+[m[32m  let codeIdx = -1[m
[32m+[m[32m  let nameIdx = -1[m
[32m+[m[32m  let compIdx = -1[m
[32m+[m[32m  let creditIdx = -1[m
[32m+[m[32m  let percentIdx = -1[m
[32m+[m[32m  let presentIdx = -1[m
[32m+[m[32m  let absentIdx = -1[m
[32m+[m[32m  let totalIdx = -1[m
[32m+[m[32m  let adjustedIdx = -1[m
 [m
[31m-import { injectBadge } from "./badge-renderer";[m
[31m-import { findCachedCourse, setLastClickedCourse } from "./modal-scraper";[m
[32m+[m[32m  headerCells.forEach((cell, idx) => {[m
[32m+[m[32m    const text = (cell.textContent || "").toLowerCase().trim()[m
[32m+[m[32m    if (text.includes("course code") || text === "code") {[m
[32m+[m[32m      codeIdx = idx[m
[32m+[m[32m    } else if (text.includes("course name") || text.includes("subject")) {[m
[32m+[m[32m      nameIdx = idx[m
[32m+[m[32m    } else if (text.includes("component")) {[m
[32m+[m[32m      compIdx = idx[m
[32m+[m[32m    } else if (text.includes("credit")) {[m
[32m+[m[32m      creditIdx = idx[m
[32m+[m[32m    } else if (text.includes("attendance") || text.includes("%")) {[m
[32m+[m[32m      percentIdx = idx[m
[32m+[m[32m    } else if ([m
[32m+[m[32m      text === "present" ||[m
[32m+[m[32m      text === "attended" ||[m
[32m+[m[