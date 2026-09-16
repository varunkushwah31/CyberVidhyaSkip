import { useEffect, useMemo, useState } from "react"
import { AttendanceOverview } from "~components/AttendanceOverview"
import { CourseList } from "~components/CourseList"
import { EyeTip } from "~components/EyeTip"
import { Header } from "~components/Header"
import { SearchAndFilter } from "~components/SearchAndFilter"
import { THEMES } from "~constants/theme"
import type { AttendanceStore, FilterType, ThemeMode } from "~types"
import { calculateAggregatePercentage } from "~utils/attendance-calculator"
import { getStoredAttendance, onStorageUpdated } from "~utils/storage"

function IndexPopup() {
  const [data, setData] = useState<AttendanceStore | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isCyberVidhya, setIsCyberVidhya] = useState(false)
  const [scriptConnected, setScriptConnected] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [showEyeTip, setShowEyeTip] = useState<boolean | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark")

  useEffect(() => {
    // Load persisted theme preference
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["cv_theme"], (result) => {
        if (result?.cv_theme === "light" || result?.cv_theme === "dark") {
          setThemeMode(result.cv_theme)
        }
      })
    } else if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("cv_theme") as ThemeMode | null
      if (saved === "light" || saved === "dark") {
        setThemeMode(saved)
      }
    }

    // Instant initial load from storage
    getStoredAttendance().then((res) => {
      if (res) setData(res)
    })

    // Listen for real-time storage updates
    const unsubscribe = onStorageUpdated((newStore) => {
      setData(newStore)
    })

    // Check active tab in background without blocking render
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab?.id && tab.url) {
          setActiveTabId(tab.id)
          const isCV = tab.url.includes("cybervidya.net")
          setIsCyberVidhya(isCV)

          if (isCV) {
            chrome.tabs.sendMessage(tab.id, { action: "SCAN_NOW" }, (response) => {
              if (chrome.runtime.lastError) {
                setScriptConnected(false)
              } else if (response?.success) {
                setScriptConnected(true)
              }
            })
          }
        }
      })
    }

    return () => unsubscribe()
  }, [])

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark"
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ cv_theme: next })
      } else if (typeof localStorage !== "undefined") {
        localStorage.setItem("cv_theme", next)
      }
      return next
    })
  }

  const currentTheme = THEMES[themeMode]

  const handleScanNow = () => {
    if (!activeTabId) return
    setScanning(true)
    chrome.tabs.sendMessage(activeTabId, { action: "SCAN_NOW" }, (response) => {
      setScanning(false)
      if (chrome.runtime.lastError) {
        setScriptConnected(false)
      } else if (response?.success) {
        setScriptConnected(true)
      }
    })
  }

  const handleReloadTab = () => {
    if (activeTabId && typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.reload(activeTabId, {}, () => {
        window.close()
      })
    }
  }

  // Filter out any legacy date logs
  const cleanSubjects = useMemo(() => {
    if (!data?.subjects) return []
    return data.subjects.filter(
      (s) =>
        !/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/.test(s.subjectName) &&
        s.subjectName.length > 2
    )
  }, [data?.subjects])

  // Active courses with conducted classes (excludes unconducted project courses)
  const activeSubjects = useMemo(() => {
    return cleanSubjects.filter(
      (s) => s.status !== "no_classes" && (s.total > 0 || s.percentage > 0)
    )
  }, [cleanSubjects])

  // Credit-weighted aggregate matching official CyberVidhya 91.0%
  const aggregatePercentage = useMemo(() => {
    if (data?.overall?.percentage && data.overall.percentage > 0) {
      return data.overall.percentage
    }
    return calculateAggregatePercentage(activeSubjects)
  }, [activeSubjects, data?.overall?.percentage])

  const filteredSubjects = useMemo(() => {
    return cleanSubjects.filter((sub) => {
      const matchesSearch =
        sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.courseCode?.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      if (activeFilter === "risk") return sub.status === "deficit"
      if (activeFilter === "safe") return sub.status === "surplus" || sub.status === "boundary"
      return true
    })
  }, [cleanSubjects, searchTerm, activeFilter])

  const counts = useMemo(() => {
    return {
      all: cleanSubjects.length,
      risk: cleanSubjects.filter((s) => s.status === "deficit").length,
      safe: cleanSubjects.filter((s) => s.status === "surplus" || s.status === "boundary").length
    }
  }, [cleanSubjects])

  return (
    <div
      style={{
        width: 385,
        maxHeight: 595,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: currentTheme.bg,
        color: currentTheme.textPrimary,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        transition: "background-color 0.2s ease, color 0.2s ease"
      }}>
      <style>{`
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${themeMode === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"};
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${themeMode === "dark" ? "rgba(255, 255, 255, 0.28)" : "rgba(0, 0, 0, 0.28)"};
        }
      `}</style>

      <div style={{ flexShrink: 0 }}>
        <Header
          scanning={scanning}
          onScan={handleScanNow}
          onToggleTip={() => setShowEyeTip((prev) => (prev === null ? true : !prev))}
          tipActive={showEyeTip === true}
          theme={currentTheme}
          onToggleTheme={handleToggleTheme}
        />
      </div>

      {/* Silky smooth unified scroll container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0
        }}>
        {cleanSubjects.length > 0 && (
          <EyeTip
            activeTabId={activeTabId}
            forceVisible={showEyeTip === true}
            onClose={() => setShowEyeTip(false)}
            theme={currentTheme}
          />
        )}

        {cleanSubjects.length > 0 && (
          <>
            <AttendanceOverview
              aggregatePercentage={aggregatePercentage}
              activeSubjects={activeSubjects}
              detentionCount={counts.risk}
              theme={currentTheme}
            />

            {/* Sticky Search & Filter with backdrop blur */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                backgroundColor: currentTheme.stickyBg,
                borderBottom: `1px solid ${currentTheme.cardBorder}`,
                marginBottom: 8
              }}>
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
                theme={currentTheme}
              />
            </div>
          </>
        )}

        <CourseList
          subjects={filteredSubjects}
          searchTerm={searchTerm}
          isCyberVidhya={isCyberVidhya}
          scriptConnected={scriptConnected}
          onReloadTab={handleReloadTab}
          theme={currentTheme}
        />
      </div>
    </div>
  )
}

export default IndexPopup

