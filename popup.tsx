import { useEffect, useMemo, useState } from "react";



import { AttendanceOverview } from "~components/AttendanceOverview";
import { CourseList } from "~components/CourseList";
import { ErrorBoundary } from "~components/ErrorBoundary";
import { EyeTip } from "~components/EyeTip";
import { Header } from "~components/Header";
import { SearchAndFilter } from "~components/SearchAndFilter";
import { THEMES } from "~constants/theme";
import type { AttendanceStore, CourseSimulation, FilterType, SimulatedSubjectAttendance, ThemeMode } from "~types";
import { calculateAggregatePercentage, computeSimulatedMetrics } from "~utils/attendance-calculator";
import { getPortalAttendanceUrl } from "~utils/portal-utils";
import { getStoredAttendance, onStorageUpdated } from "~utils/storage";





function IndexPopup() {
  const [data, setData] = useState<AttendanceStore | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null)
  const [isCyberVidhya, setIsCyberVidhya] = useState(false)
  const [scriptConnected, setScriptConnected] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [showEyeTip, setShowEyeTip] = useState<boolean | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark")
  const [simulations, setSimulations] = useState<Record<string, CourseSimulation>>({})
  const [isTomorrowLeaveSimulated, setIsTomorrowLeaveSimulated] = useState(false)

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
          setActiveTabUrl(tab.url)
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

  // Dynamic portal attendance URL
  const portalAttendanceUrl = useMemo(() => {
    return getPortalAttendanceUrl(activeTabUrl || data?.url)
  }, [activeTabUrl, data?.url])

  const handleOpenPortal = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ url: "*://*.cybervidya.net/*" }, (tabs) => {
        const myAttendanceTab = tabs?.find((t) => t.url?.includes("my-attendance"))
        if (myAttendanceTab?.id) {
          chrome.tabs.update(myAttendanceTab.id, { active: true })
          if (myAttendanceTab.windowId) {
            chrome.windows.update(myAttendanceTab.windowId, { focused: true })
          }
          window.close()
        } else if (tabs && tabs.length > 0 && tabs[0].id) {
          chrome.tabs.update(tabs[0].id, { active: true, url: portalAttendanceUrl })
          if (tabs[0].windowId) {
            chrome.windows.update(tabs[0].windowId, { focused: true })
          }
          window.close()
        } else {
          chrome.tabs.create({ url: portalAttendanceUrl }, () => {
            window.close()
          })
        }
      })
    } else {
      window.open(portalAttendanceUrl, "_blank")
    }
  }

  // Filter out any legacy date logs
  const cleanSubjects = useMemo(() => {
    if (!Array.isArray(data?.subjects)) return []
    return data.subjects.filter(
      (s) =>
        s &&
        typeof s.subjectName === "string" &&
        !/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/.test(s.subjectName) &&
        s.subjectName.trim().length > 2
    )
  }, [data?.subjects])

  // Simulation Handlers
  const handleSimulateChange = (subjectId: string, sim: CourseSimulation) => {
    setSimulations((prev) => {
      const next = { ...prev, [subjectId]: sim }
      if (sim.extraAttended === 0 && sim.extraMissed === 0 && sim.pendingOD === 0) {
        delete next[subjectId]
      }
      return next
    })
  }

  const handleResetSimulation = (subjectId: string) => {
    setSimulations((prev) => {
      const next = { ...prev }
      delete next[subjectId]
      return next
    })
    setIsTomorrowLeaveSimulated(false)
  }

  const handleResetAllSimulations = () => {
    setSimulations({})
    setIsTomorrowLeaveSimulated(false)
  }

  // Active courses with conducted classes (original)
  const activeSubjects = useMemo(() => {
    return cleanSubjects.filter(
      (s) => s && s.status !== "no_classes" && ((s.total || 0) > 0 || (s.percentage || 0) > 0)
    )
  }, [cleanSubjects])

  const handleSimulateTomorrowLeave = () => {
    setIsTomorrowLeaveSimulated(true)
    setSimulations((prev) => {
      const next = { ...prev }
      activeSubjects.forEach((sub, idx) => {
        const id = sub.id || `${sub.courseCode || ""}-${sub.subjectName || idx}`
        const existing = next[id] || { extraAttended: 0, extraMissed: 0, pendingOD: 0 }
        next[id] = {
          ...existing,
          extraMissed: (existing.extraMissed || 0) + 1
        }
      })
      return next
    })
  }

  const handleRevertTomorrowLeave = () => {
    setIsTomorrowLeaveSimulated(false)
    setSimulations((prev) => {
      const next = { ...prev }
      activeSubjects.forEach((sub, idx) => {
        const id = sub.id || `${sub.courseCode || ""}-${sub.subjectName || idx}`
        if (next[id]) {
          const newMissed = Math.max(0, (next[id].extraMissed || 0) - 1)
          if (
            newMissed === 0 &&
            (next[id].extraAttended || 0) === 0 &&
            (next[id].pendingOD || 0) === 0
          ) {
            delete next[id]
          } else {
            next[id] = { ...next[id], extraMissed: newMissed }
          }
        }
      })
      return next
    })
  }

  // Real-time simulated course states
  const simulatedCleanSubjects: SimulatedSubjectAttendance[] = useMemo(() => {
    return cleanSubjects.map((sub, idx) => {
      const subjectId = sub.id || `${sub.courseCode || ""}-${sub.subjectName || idx}`
      const sim = simulations[subjectId]
      const subAttended = typeof sub.attended === "number" ? sub.attended : 0
      const subTotal = typeof sub.total === "number" ? sub.total : 0
      const subMissed =
        typeof sub.missed === "number"
          ? sub.missed
          : Math.max(0, subTotal - subAttended)
      const subPercentage =
        typeof sub.percentage === "number" && !Number.isNaN(sub.percentage)
          ? sub.percentage
          : subTotal > 0
            ? Number(((subAttended / subTotal) * 100).toFixed(1))
            : 0

      if (!sim) {
        return {
          ...sub,
          id: subjectId,
          attended: subAttended,
          total: subTotal,
          missed: subMissed,
          percentage: subPercentage,
          originalPercentage: subPercentage,
          originalStatus: sub.status,
          originalMessage: sub.message
        }
      }

      const extraAtt = sim.extraAttended || 0
      const extraMis = sim.extraMissed || 0
      const pendOD = sim.pendingOD || 0
      const hasSim = extraAtt !== 0 || extraMis !== 0 || pendOD !== 0

      if (!hasSim) {
        return {
          ...sub,
          id: subjectId,
          simulation: sim,
          attended: subAttended,
          total: subTotal,
          missed: subMissed,
          percentage: subPercentage,
          originalPercentage: subPercentage,
          originalStatus: sub.status,
          originalMessage: sub.message
        }
      }

      const m = computeSimulatedMetrics(
        subAttended,
        subTotal,
        extraAtt,
        extraMis,
        pendOD
      )
      const effectiveAttended = Math.min(
        subTotal + extraAtt + extraMis,
        subAttended + extraAtt + pendOD
      )
      const effectiveTotal = subTotal + extraAtt + extraMis
      const effectiveMissed = Math.max(0, effectiveTotal - effectiveAttended)

      return {
        ...sub,
        id: subjectId,
        simulation: sim,
        originalPercentage: subPercentage,
        originalStatus: sub.status,
        originalMessage: sub.message,
        simulatedPercentage: m.percentage,
        simulatedStatus: m.status,
        simulatedMessage: m.message,
        percentageDelta: Number((m.percentage - subPercentage).toFixed(1)),
        attended: effectiveAttended,
        missed: effectiveMissed,
        total: effectiveTotal,
        percentage: m.percentage,
        status: m.status,
        actionCount: m.actionCount,
        message: m.message
      }
    })
  }, [cleanSubjects, simulations])

  const isSimulationActive = useMemo(() => {
    return Object.values(simulations).some(
      (s) => s.extraAttended !== 0 || s.extraMissed !== 0 || s.pendingOD !== 0
    )
  }, [simulations])

  // Original aggregate percentage
  const originalAggregate = useMemo(() => {
    if (data?.overall?.percentage && data.overall.percentage > 0) {
      return data.overall.percentage
    }
    return calculateAggregatePercentage(activeSubjects)
  }, [activeSubjects, data?.overall?.percentage])

  // Effective simulated aggregate percentage
  const activeSimulatedSubjects = useMemo(() => {
    return simulatedCleanSubjects.filter(
      (s) => s.status !== "no_classes" && (s.total > 0 || s.percentage > 0)
    )
  }, [simulatedCleanSubjects])

  const aggregatePercentage = useMemo(() => {
    if (!isSimulationActive) {
      return originalAggregate
    }
    return calculateAggregatePercentage(activeSimulatedSubjects)
  }, [isSimulationActive, originalAggregate, activeSimulatedSubjects])

  const filteredSubjects = useMemo(() => {
    const term = (searchTerm || "").toLowerCase().trim()
    return simulatedCleanSubjects.filter((sub) => {
      const name = (sub.subjectName || "").toLowerCase()
      const code = (sub.courseCode || "").toLowerCase()
      const matchesSearch = !term || name.includes(term) || code.includes(term)
      if (!matchesSearch) return false
      if (activeFilter === "risk") return sub.status === "deficit"
      if (activeFilter === "safe") return sub.status === "surplus" || sub.status === "boundary"
      return true
    })
  }, [simulatedCleanSubjects, searchTerm, activeFilter])

  const counts = useMemo(() => {
    return {
      all: simulatedCleanSubjects.length,
      risk: simulatedCleanSubjects.filter((s) => s.status === "deficit").length,
      safe: simulatedCleanSubjects.filter((s) => s.status === "surplus" || s.status === "boundary").length
    }
  }, [simulatedCleanSubjects])

  return (
    <ErrorBoundary theme={currentTheme}>
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
            lastUpdated={data?.lastUpdated}
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
          {(showEyeTip === true || cleanSubjects.length > 0) && (
            <EyeTip
              activeTabId={activeTabId}
              forceVisible={showEyeTip === true}
              onClose={() => setShowEyeTip(false)}
              onOpenAttendance={handleOpenPortal}
              portalUrl={portalAttendanceUrl}
              theme={currentTheme}
            />
          )}

          {cleanSubjects.length > 0 && (
            <>
              <AttendanceOverview
                aggregatePercentage={aggregatePercentage}
                activeSubjects={activeSimulatedSubjects}
                detentionCount={counts.risk}
                theme={currentTheme}
                isSimulated={isSimulationActive}
                originalAggregate={originalAggregate}
                onResetAllSimulations={handleResetAllSimulations}
                onSimulateTomorrowLeave={handleSimulateTomorrowLeave}
                onRevertTomorrowLeave={handleRevertTomorrowLeave}
                isTomorrowLeaveSimulated={isTomorrowLeaveSimulated}
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
            onOpenPortal={handleOpenPortal}
            portalUrl={portalAttendanceUrl}
            theme={currentTheme}
            simulations={simulations}
            onSimulateChange={handleSimulateChange}
            onResetSimulation={handleResetSimulation}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default IndexPopup
