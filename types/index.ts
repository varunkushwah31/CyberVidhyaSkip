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

export interface CachedCourse {
  courseCode: string
  courseName: string
  componentName: string
  presentClasses: number
  totalClasses: number
  percentage: number
}
