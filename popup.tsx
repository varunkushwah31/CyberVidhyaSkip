import { useEffect, useMemo, useState } from "react"
import type { AttendanceStore, SubjectAttendance } from "~types"

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

  const checkActiveTab = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab?.id && tab.url) {
          setActiveTabId(tab.id)
          setActiveTabUrl(tab.url)
          const isCV = tab.url.includes("cybervidya.net")
          setIsCyberVidhya(isCV)

          chrome.tabs.sendMessage(tab.id, { action: "SCAN_NOW" }, (response) => {
            if (chrome.runtime.lastError) {
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

  const handleScanNow = () => {
    if (!activeTabId) return
    setScanning(true)
    chrome.tabs.sendMessage(activeTabId, { action: "SCAN_NOW" }, () => {
      setScanning(false)
      if (chrome.runtime.lastError) {
        setScriptConnected(false)
      } else {
        setScriptConnected(true)
        loadStoredData()
      }
    })
  }

  const handleReloadTab = () => {
    if (activeTabId) {
      chrome.tabs.reload(activeTabId, {}, () => {
        window.close()
      })
    }
  }

  // Filter out any anomalous date-like entries (ensures 100% subject-wise display)
  const cleanSubjects = useMemo(() => {
    if (!data?.subjects) return []
    return data.subjects.filter(
      (s) =>
        !/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/.test(s.subjectName) &&
        s.subjectName.length > 2
    )
  }, [data?.subjects])

  const filteredSubjects = useMemo(() => {
    return cleanSubjects.filter((sub) => {
      const matchesSearch = sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false
      if (activeFilter === "risk") return sub.status === "deficit"
      if (activeFilter === "safe") return sub.status === "surplus" || sub.status === "boundary"
      return true
    })
  }, [cleanSubjects, searchTerm, activeFilter])

  const detentionCount = useMemo(() => {
    return cleanSubjects.filter((s) => s.status === "deficit").length
  }, [cleanSubjects])

  const aggregatePercentage = useMemo(() => {
    const totalAttended = cleanSubjects.reduce((acc, s) => acc + s.attended, 0)
    const totalClasses = cleanSubjects.reduce((acc, s) => acc + s.total, 0)
    return totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 0
  }, [cleanSubjects])

  return (
    <div
      style={{
        width: 390,
        maxHeight: 590,
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
      {/* Sleek Custom Scrollbar Style */}
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

      {/* Top Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #171c28 50%, #1e1b4b 100%)",
          color: "#ffffff",
          padding: "16px 20px 14px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
              }}>
              ⚡
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#f8fafc"
                }}>
                Bunk Planner
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 500
                }}>
                Strict 75% Attendance Guard
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={handleScanNow}
              disabled={scanning}
              title="Rescan Attendance"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e2e8f0",
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.15s ease"
              }}>
              {scanning ? "…" : "🔄"}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Connection Alert */}
      {isCyberVidhya && scriptConnected === false && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            borderBottom: "1px solid #fef3c7",
            padding: "10px 16px",
            fontSize: 11,
            color: "#92400e",
            display: "flex",
            flexDirection: "column",
            gap: 6
          }}>
          <div style={{ fontWeight: 600 }}>⚠️ Connection needed to this tab</div>
          <button
            onClick={handleReloadTab}
            style={{
              backgroundColor: "#d97706",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              padding: "5px 10px",
              fontWeight: 600,
              fontSize: 11,
              cursor: "pointer"
            }}>
            🔄 Refresh CyberVidhya Tab
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 13 }}>
          Loading your courses...
        </div>
      ) : cleanSubjects.length === 0 ? (
        /* Empty State */
        <div style={{ padding: 36, textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "#e0e7ff",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px auto",
              fontSize: 24,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.12)"
            }}>
            📚
          </div>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: 16,
              fontWeight: 700,
              color: "#1e293b",
              letterSpacing: "-0.01em"
            }}>
            No Subjects Detected
          </h3>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.5
            }}>
            Log into your CyberVidhya portal and open your Attendance dashboard. Your subject-wise classes will sync automatically!
          </p>
          <button
            onClick={handleScanNow}
            disabled={scanning}
            style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: 10,
              padding: "9px 18px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)"
            }}>
            {scanning ? "Scanning..." : "🔍 Scan Now"}
          </button>
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
          {/* Hero Aggregate Card */}
          <div
            style={{
              background: "linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)",
              borderRadius: 16,
              padding: "16px 18px",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
              border: "1px solid #e2e8f0"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    color: "#64748b",
                    fontWeight: 700,
                    letterSpacing: "0.08em"
                  }}>
                  Overall Attendance
                </span>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: aggregatePercentage >= 75 ? "#059669" : "#dc2626",
                    lineHeight: 1.1,
                    marginTop: 2
                  }}>
                  {aggregatePercentage}%
                </div>
              </div>

              {detentionCount > 0 ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecdd3",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20
                  }}>
                  <span>⚠️</span>
                  <span>{detentionCount} at risk</span>
                </div>
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20
                  }}>
                  <span>🛡️</span>
                  <span>All Safe (≥75%)</span>
                </div>
              )}
            </div>

            {/* Visual 75% Goal Line */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div
                style={{
                  position: "relative",
                  height: 8,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 9999,
                  overflow: "hidden"
                }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, aggregatePercentage)}%`,
                    background:
                      aggregatePercentage >= 75
                        ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(90deg, #f87171 0%, #ef4444 100%)",
                    borderRadius: 9999,
                    transition: "width 0.4s ease"
                  }}
                />
                {/* 75% Target Marker */}
                <div
                  style={{
                    position: "absolute",
                    left: "75%",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    backgroundColor: "#0f172a",
                    opacity: 0.5
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 9,
                  color: "#94a3b8",
                  fontWeight: 600,
                  marginTop: 3
                }}>
                <span>0%</span>
                <span style={{ color: "#475569", fontWeight: 700 }}>Strict 75% Goal</span>
                <span>100%</span>
              </div>
            </div>

            {/* Attendance Counts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                paddingTop: 8,
                borderTop: "1px solid #e2e8f0",
                textAlign: "center"
              }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Attended</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  {cleanSubjects.reduce((acc, s) => acc + s.attended, 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Missed</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  {cleanSubjects.reduce((acc, s) => acc + s.missed, 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Total Held</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  {cleanSubjects.reduce((acc, s) => acc + s.total, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Segments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search course name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px 8px 30px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: 12,
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  color: "#94a3b8"
                }}>
                🔍
              </span>
            </div>

            {/* Filter Pills */}
            <div
              style={{
                display: "flex",
                background: "#e2e8f0",
                padding: 3,
                borderRadius: 10,
                gap: 2
              }}>
              {(
                [
                  { key: "all", label: `All (${cleanSubjects.length})` },
                  { key: "risk", label: `Below 75% (${detentionCount})` },
                  { key: "safe", label: `Safe (${cleanSubjects.length - detentionCount})` }
                ] as const
              ).map((f) => {
                const isActive = activeFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#0f172a" : "#64748b",
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease"
                    }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredSubjects.map((sub: SubjectAttendance) => {
              const isDeficit = sub.status === "deficit"
              const isBoundary = sub.status === "boundary"

              const badgeBg = isDeficit ? "#fff1f2" : isBoundary ? "#fffbeb" : "#ecfdf5"
              const badgeColor = isDeficit ? "#be123c" : isBoundary ? "#b45309" : "#047857"
              const badgeBorder = isDeficit ? "#fecdd3" : isBoundary ? "#fde68a" : "#a7f3d0"
              const icon = isDeficit ? "🚨" : isBoundary ? "⚠️" : "🛡️"

              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 14,
                    padding: "14px 16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 6px -1px rgba(0, 0, 0, 0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}>
                  {/* Title & Percentage */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.3
                        }}>
                        {sub.subjectName}
                      </h4>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: isDeficit ? "#dc2626" : "#059669",
                        whiteSpace: "nowrap"
                      }}>
                      {sub.percentage}%
                    </div>
                  </div>

                  {/* Progress Bar with 75% target tick */}
                  <div
                    style={{
                      position: "relative",
                      height: 6,
                      backgroundColor: "#f1f5f9",
                      borderRadius: 9999,
                      overflow: "hidden"
                    }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, sub.percentage)}%`,
                        backgroundColor: isDeficit ? "#ef4444" : "#10b981",
                        borderRadius: 9999
                      }}
                    />
                    {/* Target line */}
                    <div
                      style={{
                        position: "absolute",
                        left: "75%",
                        top: 0,
                        bottom: 0,
                        width: 2,
                        backgroundColor: "#64748b",
                        opacity: 0.4
                      }}
                    />
                  </div>

                  {/* Action & Stats Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                      <strong style={{ color: "#334155" }}>{sub.attended}</strong>/{sub.total} attended
                      {sub.missed > 0 ? ` (${sub.missed} missed)` : ""}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        padding: "3px 9px",
                        borderRadius: 9999,
                        letterSpacing: "-0.01em"
                      }}>
                      <span>{icon}</span>
                      <span>{sub.message}</span>
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
