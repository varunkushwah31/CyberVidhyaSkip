import { BookOpenIcon, EyeIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"
import type { SubjectAttendance } from "~types"
import { CourseCard } from "./CourseCard"

interface CourseListProps {
  readonly subjects: readonly SubjectAttendance[]
  readonly searchTerm: string
  readonly isCyberVidhya: boolean
  readonly scriptConnected: boolean | null
  readonly onReloadTab: () => void
  readonly theme: AppTheme
}

export function CourseList({
  subjects,
  searchTerm,
  isCyberVidhya,
  scriptConnected,
  onReloadTab,
  theme
}: Readonly<CourseListProps>) {
  if (subjects.length > 0) {
    return (
      <div
        style={{
          padding: "0 14px 14px 14px"
        }}>
        {subjects.map((subject) => (
          <CourseCard key={subject.id} subject={subject} theme={theme} />
        ))}

        {/* Sleek Guidance Callout */}
        <div
          style={{
            marginTop: 6,
            marginBottom: 6,
            padding: "9px 12px",
            borderRadius: 10,
            backgroundColor: theme.metricBg,
            border: `1px solid ${theme.metricBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 11,
            color: theme.textSecondary,
            lineHeight: 1.4
          }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor:
                theme.name === "dark"
                  ? "rgba(99, 102, 241, 0.18)"
                  : "#e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.accent,
              flexShrink: 0
            }}>
            <EyeIcon size={14} weight="bold" />
          </div>
          <span>
            Click any course's <strong style={{ color: theme.textPrimary }}>eye icon</strong> or open{" "}
            <strong style={{ color: theme.accent }}>My Attendance</strong> to sync exact lecture breakdown.
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
          padding: "42px 20px",
          textAlign: "center",
          color: theme.textMuted
        }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: theme.metricBg,
            border: `1px solid ${theme.metricBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            color: theme.textMuted
          }}>
          <MagnifyingGlassIcon size={20} weight="bold" />
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: theme.textPrimary,
            letterSpacing: "-0.01em"
          }}>
          No matching courses
        </div>
        <div style={{ fontSize: 11, marginTop: 4, color: theme.textMuted }}>
          Try checking for typos or searching by course code
        </div>
      </div>
    )
  }

  // Not on CyberVidhya or disconnected
  return (
    <div
      style={{
        padding: "26px 18px",
        textAlign: "center",
        backgroundColor: theme.cardBg,
        margin: "10px 14px 14px 14px",
        borderRadius: 14,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow
      }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: theme.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px auto",
          color: "#ffffff"
        }}>
        <BookOpenIcon size={22} weight="bold" />
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: theme.textPrimary,
          letterSpacing: "-0.01em"
        }}>
        {isCyberVidhya ? "Ready to Track Attendance" : "Open CyberVidhya Dashboard"}
      </div>

      <p
        style={{
          fontSize: 11.5,
          color: theme.textSecondary,
          margin: "8px 0 16px 0",
          lineHeight: 1.45
        }}>
        {isCyberVidhya
          ? "Log into your student portal or navigate to My Attendance. The extension will automatically compute exact skip margins."
          : "Navigate to your CyberVidhya student dashboard or attendance view to unlock real-time attendance protection."}
      </p>

      {isCyberVidhya && scriptConnected === false && (
        <button
          onClick={onReloadTab}
          style={{
            padding: "8px 18px",
            backgroundColor: theme.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            transition: "opacity 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1"
          }}>
          Reload Portal Tab
        </button>
      )}
    </div>
  )
}

