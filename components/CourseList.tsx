import { BookOpenIcon, InfoIcon } from "@phosphor-icons/react"
import type { SubjectAttendance } from "~types"
import { CourseCard } from "./CourseCard"

interface CourseListProps {
  readonly subjects: readonly SubjectAttendance[]
  readonly searchTerm: string
  readonly isCyberVidhya: boolean
  readonly scriptConnected: boolean | null
  readonly onReloadTab: () => void
}

export function CourseList({
  subjects,
  searchTerm,
  isCyberVidhya,
  scriptConnected,
  onReloadTab
}: Readonly<CourseListProps>) {
  if (subjects.length > 0) {
    return (
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 12px 16px"
        }}>
        {subjects.map((subject) => (
          <CourseCard key={subject.id} subject={subject} />
        ))}
      </div>
    )
  }

  // If search term gave no results
  if (searchTerm) {
    return (
      <div
        style={{
          padding: "36px 20px",
          textAlign: "center",
          color: "#64748b"
        }}>
        <InfoIcon size={24} weight="regular" style={{ margin: "0 auto 8px auto", display: "block" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>No matching subjects</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Try searching with a different course code or keyword</div>
      </div>
    )
  }

  // Not on CyberVidhya or disconnected
  return (
    <div
      style={{
        padding: "24px 20px",
        textAlign: "center",
        backgroundColor: "#ffffff",
        margin: "8px 16px 16px 16px",
        borderRadius: 12,
        border: "1px dashed #cbd5e1"
      }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 10px auto",
          color: "#6366f1"
        }}>
        <BookOpenIcon size={20} weight="bold" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
        {isCyberVidhya ? "Ready to Scan Attendance" : "Open College ERP Dashboard"}
      </div>

      <p style={{ fontSize: 11, color: "#64748b", margin: "6px 0 14px 0", lineHeight: 1.4 }}>
        {isCyberVidhya
          ? "Log into your CyberVidhya dashboard. The extension will automatically read your courses and calculate your skip quotas."
          : "Navigate to your CyberVidhya student dashboard to enable automatic tracking and attendance protection."}
      </p>

      {isCyberVidhya && scriptConnected === false && (
        <button
          onClick={onReloadTab}
          style={{
            padding: "6px 12px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer"
          }}>
          Reload Portal Tab
        </button>
      )}
    </div>
  )
}
