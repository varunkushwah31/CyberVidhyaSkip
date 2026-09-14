import { useEffect, useMemo, useState } from "react";



import { AttendanceOverview } from "~components/AttendanceOverview";
import { CourseList } from "~components/CourseList";
import { Header } from "~components/Header";
import { SearchAndFilter } from "~components/SearchAndFilter";
import type { AttendanceStore, FilterType } from "~types";
import { calculateAggregatePercentage } from "~utils/attendance-calculator";
import { getStoredAttendance, onStorageUpdated } from "~utils/storage";





function IndexPopup() {
  const [data, setData] = useState<AttendanceStore | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isCyberVidhya, setIsCyberVidhya] = useState(false)
  const [scriptConnected, setScriptConnected] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const checkActiveTab = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab?.id && tab.url) {
          setActiveTabId(tab.id)
          const isCV = tab.url.includes("cybervidya.net")
          setIsCyberVidhya(isCV)

          chrome.tabs.sendMessage(tab.id, { action: "SCAN_NOW" }, (response) => {
            if (chrome.runtime.lastError) {
              setScriptConnected(false)
            } else if (response?.success) {
              setScriptConnected(true)
              getStoredAttendance().then((res) => {
                if (res) setData(res)
              })
            }
          })
        }
      })
    }
  }

  useEffect(() => {
    getStoredAttendance().then((res) => {
      if (res) setData(res)
    })
    checkActiveTab()

    const unsubscribe = onStorageUpdated((newStore) => {
      setData(newStore)
    })

    return () => unsubscribe()
  }, [])

  const handleScanNow = () => {
    if (!activeTabId) return
    setScanning(true)
    chrome.tabs.sendMessage(activeTabId, { action: "SCAN_NOW" }, () => {
      setScanning(false)
      if (chrome.runtime.lastError) {
        setScriptConnected(false)
      } else {
        setScriptConnected(true)
        getStoredAttendance().then((res) => {
          if (res) setData(res)
        })
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
        !/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(s.subjectName) &&
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
        width: 395,
        maxHeight: 595,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
      <style>{`
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <Header scanning={scanning} onScan={handleScanNow} />

      {cleanSubjects.length > 0 && (
        <>
          <AttendanceOverview
            aggregatePercentage={aggregatePercentage}
            activeSubjects={activeSubjects}
            detentionCount={counts.risk}
          />

          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        </>
      )}

      <CourseList
        subjects={filteredSubjects}
        searchTerm={searchTerm}
        isCyberVidhya={isCyberVidhya}
        scriptConnected={scriptConnected}
        onReloadTab={handleReloadTab}
      />
    </div>
  )
}

export default IndexPopup
