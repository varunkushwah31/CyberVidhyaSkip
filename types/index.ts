export type AttendanceStatus = "deficit" | "surplus" | "boundary" | "no_classes"

export interface SubjectAttendance {
  id: string
  courseCode?: string
  subjectName: string
  component?: string // THEORY, PRACTICAL, BLENDED, etc.
  credit?: number
  attended: number
  missed: number
  total: number
  percentage: number
  status: AttendanceStatus
  actionCount: number
  message: string
  adjusted?: number
}

export interface AttendanceMetrics {
  attended: number
  total: number
  percentage: number
  status: AttendanceStatus
  actionCount: number
  message: string
  badgeStyles: BadgeTheme
}

export interface BadgeTheme {
  bg: string
  text: string
  border: string
  svgIcon: string
}

export interface AttendanceStore {
  lastUpdated: number
  url: string
  subjects: SubjectAttendance[]
  overall: {
    totalAttended: number
    totalMissed: number
    totalClasses: number
    percentage: number
    detentionCount: number
  }
}

export type FilterType = "all" | "risk" | "safe"
export type ThemeMode = "dark" | "light"

export interface CourseSimulation {
  extraAttended: number
  extraMissed: number
  pendingOD: number
}

export interface SemesterBudget {
  expectedTotal: number
  maxAllowedSkips: number
  skipsUsed: number
  skipsRemaining: number
  isExceeded: boolean
}

export interface SimulatedSubjectAttendance extends SubjectAttendance {
  simulation?: CourseSimulation
  originalPercentage?: number
  originalStatus?: AttendanceStatus
  originalMessage?: string
  simulatedPercentage?: number
  simulatedStatus?: AttendanceStatus
  simulatedMessage?: string
  percentageDelta?: number
  budget?: SemesterBudget
}

export interface CachedCourse {
  courseCode: string
  courseName: string
  componentName: string
  presentClasses: number
  totalClasses: number
  percentage: number
  adjustedClasses?: number
}


