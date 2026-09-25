import { ArrowSquareOutIcon, BookOpenIcon, EyeIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import type { AppTheme } from "~constants/theme"
import type { SubjectAttendance } from "~types"
import { CourseCard } from "./CourseCard"

interface CourseListProps {
  readonly subjects: readonly SubjectAttendance[]
  readonly searchTerm: string
  readonly isCyberVidhya: boolean
  readonly scriptConnected: boolean | null
  readonly onReloadTab: () => void
  readonly onOpenPortal?: () => void
  readonly portalUrl?: string
  readonly theme: AppTheme
  readonly simulations?: Record<string, import("~types").CourseSimulation>
  readonly onSimulateChange?: (subjectId: string, sim: import("~types").CourseSimulation) => void
  readonly onResetSimulation?: (subjectId: string) => void
}

export function CourseList({
  subjects,
  searchTerm,
  isCyberVidhya,
  scriptConnected,
  onReloadTab,
  onOpenPortal,
  portalUrl = "https://kiet.cybervidya.net/attendance/my-attendance",
  theme,
  simulations,
  onSimulateChange,
  onResetSimulation
}: Readonly<CourseListProps>) {
  const displayPortalUrl = (portalUrl || "https://kiet.cybervidya.net/attendance/my-attendance").replace(/^https?:\/\//, "")

  if (subjects.length > 0) {
    return (
      <div
        style={{
          padding: "0 14px 14px 14px"
        }}>
        {subjects.map((subject) => (
          <CourseCard
            key={subject.id}
            subject={subject}
            theme={theme}
            simulation={simulations?.[subject.id]}
            onSimulateChange={onSimulateChange}
            onResetSimulation={onResetSimulation}
          />
        ))}

        {/* Sleek Guidance Callout */}
        <div
          style={{
            marginTop: 4,
            marginBottom: 4,
            padding: "7px 10px",
            borderRadius: 9,
            backgroundColor: theme.metricBg,
            border: `1px solid ${theme.metricBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 10.5,
            color: theme.textSecondary,
            lineHeight: 1.4
          }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
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
            <EyeIcon size={11} weight="bold" />
          </div>
          <span>
            Go to{" "}
            <a
              href={portalUrl}
              onClick={(e) => {
                if (onOpenPortal) {
                  e.preventDefault()
                  onOpenPortal()
                }
              }}
              target="_blank"
              rel="noreferrer"
              style={{
                color: theme.accent,
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer"
              }}>
              {displayPortalUrl}
            </a>{" "}
            for getting one-time accurate data, or click any course's <strong style={{ color: theme.textPrimary }}>eye icon</strong>.
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
          color: theme.textMuted
        }}>
        <MagnifyingGlassIcon
          size={32}
          weight="duotone"
          style={{ color: theme.textMuted, margin: "0 auto 10px auto", display: "block" }}
        />
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
        padding: "28px 18px 22px 18px",
        textAlign: "center",
        backgroundColor: theme.cardBg,
        margin: "10px 14px 14px 14px",
        borderRadius: 14,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow
      }}>
      {/* Gradient accent icon circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 9999,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentGradient})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px auto",
          boxShadow: theme.accentGlow
        }}>
        <BookOpenIcon
          size={22}
          weight="fill"
          style={{ color: "#ffffff" }}
        />
      </div>

      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: theme.textPrimary,
          letterSpacing: "-0.01em"
        }}>
        {isCyberVidhya ? "Ready to Track Attendance" : "CyberVidya Attendance Tracker"}
      </div>

      <p
        style={{
          fontSize: 11,
          color: theme.textSecondary,
          margin: "6px 0 16px 0",
          lineHeight: 1.45
        }}>
        Open your attendance portal to sync verified lecture records, duty leaves, and exact skip margins.
      </p>

      {isCyberVidhya && scriptConnected === false && (
        <button
          onClick={onReloadTab}
          style={{
            width: "100%",
            padding: "9px 18px",
            backgroundColor: theme.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            transition: "opacity 0.15s ease, transform 0.1s ease",
            marginBottom: onOpenPortal ? 8 : 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.92"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1"
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)"
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)"
          }}>
          Reload Portal Tab
        </button>
      )}

      {onOpenPortal && (
        <button
          onClick={onOpenPortal}
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 18px",
            backgroundColor: theme.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
            transition: "opacity 0.15s ease, transform 0.1s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.92"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1"
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)"
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)"
          }}>
          <ArrowSquareOutIcon size={14} weight="bold" />
          Go to My Attendance
        </button>
      )}
    </div>
  )
}

