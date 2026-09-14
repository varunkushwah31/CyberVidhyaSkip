export interface SubjectAttendance {
  id: string
  courseCode?: string
  subjectName: string
  component?: string // THEORY, PRACTICAL, BLENDED, etc.
  attended: number
  missed: number
  total: number
  percentage: number
  status: "deficit" | "surplus" | "boundary"
  actionCount: number
  message: string
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
