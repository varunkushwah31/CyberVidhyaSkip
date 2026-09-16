import { BookOpenIcon, EyeIcon, InfoIcon } from "@phosphor-icons/react"
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
          padding: "0 14px 12px 14px"
        }}>
        {subjects.map((subject) => (
          <CourseCard key={subject.id} subject={subject} />
        ))}

        <div
          style={{
            marginTop: 4,
            marginBottom: 4,
            padding: "8px 12px",
            borderRadius: 4,
            backgroundColor: "#ffffff",
            border: "1px dashed #ced4da",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "#495057"
          }}>
          <EyeIcon size={16} weight="bold" style={{ color: "#007bff", flexShrink: 0 }} />
          <span>
            Click any course's <strong style={{ color: "#212529" }}>eye icon (👁️)</strong> or open{" "}
            <strong style={{ color: "#007bff" }}>My Attendance</strong> on CyberVidhya to verify exact counts.
          </span>
        </div>
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
          color: "#6c757d"
        }}>
        <InfoIcon size={24} weight="regular" style={{ margin: "0 auto 8px auto", display: "block" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#212529" }}>No matching subjects</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Try searching with a different course code or keyword</div>
      </div>
    )
  }

  // Not on CyberVidhya or disconnected
  return (
    <div
      style={{
        padding: "24px 16px",
        textAlign: "center",
        backgroundColor: "#ffffff",
        margin: "8px 14px 14px 14px",
        borderRadius: 4,
        border: "1px dashed #ced4da"
      }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 4,
          backgroundColor: "#e7f1ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 10px auto",
          color: "#007bff"
        }}>
        <BookOpenIcon size={20} weight="bold" />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#212529" }}>
        {isCyberVidhya ? "Ready to Scan Attendance" : "Open College ERP Dashboard"}
      </div>

      <p style={{ fontSize: 11, color: "#6c757d", margin: "6px 0 14px 0", lineHeight: 1.45 }}>
        {isCyberVidhya
          ? "Log into your CyberVidhya dashboard or open My Attendance. The extension will automatically calculate exact skip or attend counts."
          : "Navigate to your CyberVidhya student dashboard or My Attendance page to enable automatic tracking and attendance protection."}
      </p>

      {isCyberVidhya && scriptConnected === false && (
        <button
          onClick={onReloadTab}
          style={{
            padding: "6px 14px",
            backgroundColor: "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: 4,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer"
          }}>
          Reload Portal Tab
        </button>
      )}
    </div>
  )
}
