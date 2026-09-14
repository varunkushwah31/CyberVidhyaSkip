export interface SubjectAttendance {
  id: string
  subjectName: string
  attended: number
  missed: number
  total: number
  percentage: number
  status: "deficit" | "surplus" | "boundary"
  actionCount: number // required to attend (if deficit) or safe to miss (if surplus)
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
