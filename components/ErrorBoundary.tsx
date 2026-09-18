import React, { Component, type ErrorInfo, type ReactNode } from "react"
import type { AppTheme } from "~constants/theme"
import { THEMES } from "~constants/theme"

interface Props {
  children: ReactNode
  theme?: AppTheme
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CyberVidhya Extension Error:", error, errorInfo)
  }

  private handleReset = () => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove(["cv_attendance_data", "cv_simulations"], () => {
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }

  public override render() {
    if (this.state.hasError) {
      const theme = this.props.theme || THEMES.dark
      return (
        <div
          style={{
            width: 385,
            padding: 24,
            boxSizing: "border-box",
            backgroundColor: theme.bg,
            color: theme.textPrimary,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textAlign: "center"
          }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "rgba(244, 63, 94, 0.15)",
              color: "#fb7185",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "12px auto 16px auto",
              fontSize: 20
            }}>
            ⚠️
          </div>

          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 8px 0",
              color: theme.textPrimary
            }}>
            Something went wrong
          </h3>

          <p
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              lineHeight: 1.5,
              margin: "0 0 18px 0"
            }}>
            An unexpected error occurred while rendering attendance data. You can reload or reset stored attendance cache.
          </p>

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 16px",
                backgroundColor: theme.accent,
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}>
              Reload
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: "8px 16px",
                backgroundColor: theme.metricBg,
                color: theme.textSecondary,
                border: `1px solid ${theme.metricBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}>
              Reset Cache
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
