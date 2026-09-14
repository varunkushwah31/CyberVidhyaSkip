import { useEffect, useMemo, useState } from "react"
import type { AttendanceStore, SubjectAttendance } from "./types"

function IndexPopup() {
  const [data, setData] = useState<AttendanceStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTabUrl, setActiveTabUrl] = useState("")
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [isCyberVidhya, setIsCyberVidhya] = useState(false)
  const [scriptConnected, setScriptConnected] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "risk" | "safe">("all")
  const [showDiag, setShowDiag] = useState(false)
  const [diagInfo, setDiagInfo] = useState<any>(null)

  // 1. Load cached data from chrome.storage.local
  const loadStoredData = () => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["attendanceData"], (result) => {
        if (result.attendanceData) {
          setData(result.attendanceData)
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }

  // 2. Query active tab and attempt communication with content script
  const checkActiveTab = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab?.id && tab.url) {
          setActiveTabId(tab.id)
          setActiveTabUrl(tab.url)
          const isCV = tab.url.includes("cybervidya.net")
          setIsCyberVidhya(isCV)

          // Try pinging content script
          chrome.tabs.sendMessage(tab.id, { action: "SCAN_NOW" }, (response) => {
            if (chrome.runtime.lastError) {
              // Script is not yet injected into this tab (tab needs refresh)
              setScriptConnected(false)
            } else if (response?.success) {
              setScriptConnected(true)
              loadStoredData()
            }
          })
        }
      })
    }
  }

  useEffect(() => {
    loadStoredData()
    checkActiveTab()

    // Listen for storage changes in real time
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.attendanceData?.newValue) {
        setData(changes.attendanceData.newValue)
      }
    }

    chrome.storage?.onChanged?.addListener(listener)
    return () => {
      chrome.storage?.onChanged?.removeListener(listener)
    }
  }, [])

  // Manual Trigger: Scan Active Tab
  const handleScanNow = () => {
    if (!activeTabId) return
    setScanning(true)
    chrome.tabs.sendMessage(activeTabId, { action: "SCAN_NOW" }, (res) => {
      setScanning(false)
      if (chrome.runtime.lastError) {
        setScriptConnected(false)
      } else {
        setScriptConnected(true)
        loadStoredData()
      }
    })
  }

  // Manual Trigger: Reload Active Tab
  const handleReloadTab = () => {
    if (activeTabId) {
      chrome.tabs.reload(activeTabId, {}, () => {
        window.close()
      })
    }
  }

  // Manual Trigger: Diagnostics
  const handleRunDiagnostics = () => {
    if (!activeTabId) return
    chrome.tabs.sendMessage(activeTabId, { action: "DIAGNOSE" }, (res) => {
      if (chrome.runtime.lastError) {
        setDiagInfo({
          error: "Content script is not connected to this tab. Please refresh the page."
        })
      } else {
        setDiagInfo(res?.report)
      }
      setShowDiag(true)
    })
  }

  const filteredSubjects = useMemo(() => {
    if (!data?.subjects) return []
    return data.subjects.filter((sub) => {
      const matchesSearch = sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      if (activeFilter === "risk") return sub.status === "deficit"
      if (activeFilter === "safe") return sub.status === "surplus" || sub.status === "boundary"
      return true
    })
  }, [data, searchTerm, activeFilter])

  return (
    <div
      style={{
        width: 380,
        maxHeight: 580,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          padding: "14px 18px",
          borderBottom: "1px solid #334155"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Attendance & Bunk Planner
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94a3b8" }}>
              Strict 75% Rule Enforcer
            </p>
          </div>
          {data?.lastUpdated && (
            <span
              style={{
                fontSize: 10,
                color: "#cbd5e1",
                background: "rgba(255, 255, 255, 0.1)",
                padding: "3px 8px",
                borderRadius: 10
              }}>
              Synced{" "}
              {new Date(data.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          )}
        </div>
      </div>

      {/* CyberVidhya Tab Connection Notice */}
      {isCyberVidhya && scriptConnected === false && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            borderBottom: "1px solid #fde68a",
            padding: "10px 16px",
            fontSize: 11,
            color: "#92400e"
          }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Tab Not Connected Yet</div>
          <div>
            Chrome requires you to refresh tabs opened before installing the extension. Click below to reload your CyberVidhya tab:
          </div>
          <button
            onClick={handleReloadTab}
            style={{
              marginTop: 8,
              width: "100%",
              backgroundColor: "#d97706",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer"
            }}>
            🔄 Refresh CyberVidhya Tab
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 13 }}>
          Loading attendance data...
        </div>
      ) : !data || data.subjects.length === 0 ? (
        /* Empty State */
        <div style={{ padding: 24, textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
              fontSize: 22
            }}>
            🎓
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 700 }}>
            No Scraped Data Found
          </h3>
          <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            {isCyberVidhya
              ? "You are on CyberVidhya! Ensure your attendance table or widget is visible on this page, then click Scan below."
              : "Open your college CyberVidhya ERP portal (e.g. kiet.cybervidya.net) and navigate to your attendance page."}
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleScanNow}
              disabled={scanning}
              style={{
                flex: 1,
                backgroundColor: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer"
              }}>
              {scanning ? "Scanning..." : "🔍 Scan Current Page"}
            </button>
            {isCyberVidhya && (
              <button
                onClick={handleReloadTab}
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer"
                }}>
                🔄 Reload
              </button>
            )}
          </div>

          <button
            onClick={handleRunDiagnostics}
            style={{
              marginTop: 10,
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: 11,
              textDecoration: "underline",
              cursor: "pointer"
            }}>
            🛠️ Diagnose Page Layout
          </button>

          {showDiag && (
            <div
              style={{
                marginTop: 12,
                textAlign: "left",
                backgroundColor: "#0f172a",
                color: "#cbd5e1",
                padding: 10,
                borderRadius: 8,
                fontSize: 10,
                maxHeight: 140,
                overflowY: "auto",
                whiteSpace: "pre-wrap"
              }}>
              {JSON.stringify(diagInfo, null, 2)}
            </div>
          )}
        </div>
      ) : (
        /* Main Dashboard */
        <div
          style={{
            padding: "14px 16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
          {/* Overall Stats Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: "14px 16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: "#64748b",
                    fontWeight: 700,
                    letterSpacing: "0.05em"
                  }}>
                  Aggregate Attendance
                </span>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: data.overall.percentage >= 75 ? "#10b981" : "#ef4444"
                  }}>
                  {data.overall.percentage}%
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {data.overall.detentionCount > 0 ? (
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 16
                    }}>
                    ⚠️ {data.overall.detentionCount} below 75%
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#d1fae5",
                      color: "#059669",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 16
                    }}>
                    ✅ Safe in all subjects
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #f1f5f9",
                textAlign: "center"
              }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Attended</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {data.overall.totalAttended}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Missed</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {data.overall.totalMissed}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Total</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {data.overall.totalClasses}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Action */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="Search subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                boxSizing: "border-box",
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 11,
                outline: "none"
              }}
            />
            <button
              onClick={handleScanNow}
              disabled={scanning}
              title="Rescan current page"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "0 10px",
                fontSize: 12,
                cursor: "pointer"
              }}>
              {scanning ? "..." : "🔄"}
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { key: "all", label: `All (${data.subjects.length})` },
                { key: "risk", label: `At Risk (${data.overall.detentionCount})` },
                { key: "safe", label: `Safe (${data.subjects.length - data.overall.detentionCount})` }
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeFilter === f.key ? "#0f172a" : "#e2e8f0",
                  color: activeFilter === f.key ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease"
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Subject Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredSubjects.map((sub: SubjectAttendance) => {
              const isDeficit = sub.status === "deficit"
              const isBoundary = sub.status === "boundary"

              const badgeBg = isDeficit ? "#fee2e2" : isBoundary ? "#fef3c7" : "#d1fae5"
              const badgeColor = isDeficit ? "#dc2626" : isBoundary ? "#b45309" : "#059669"

              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 6
                    }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1e293b",
                        lineHeight: 1.3
                      }}>
                      {sub.subjectName}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: isDeficit ? "#dc2626" : "#059669",
                        whiteSpace: "nowrap"
                      }}>
                      {sub.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar with 75% target marker */}
                  <div
                    style={{
                      position: "relative",
                      height: 5,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 8
                    }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, sub.percentage)}%`,
                        backgroundColor: isDeficit ? "#ef4444" : "#10b981",
                        borderRadius: 3
                      }}
                    />
                  </div>

                  {/* Footer details: counts + action badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      {sub.attended}/{sub.total} classes attended
                      {sub.missed > 0 ? ` (${sub.missed} missed)` : ""}
                    </span>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        padding: "2px 8px",
                        borderRadius: 10
                      }}>
                      {sub.message}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
