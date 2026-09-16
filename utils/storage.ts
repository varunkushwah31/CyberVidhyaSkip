import type { AttendanceStore } from "~types"

const STORAGE_KEY = "attendanceData"
const EYE_TIP_STORAGE_KEY = "eyeTipDismissed"

/**
 * Loads cached attendance data from chrome.storage.local.
 */
export function getStoredAttendance(): Promise<AttendanceStore | null> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(null)
      return
    }

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || null)
    })
  })
}

/**
 * Persists attendance data to chrome.storage.local.
 */
export function saveStoredAttendance(store: AttendanceStore): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve()
      return
    }

    chrome.storage.local.set({ [STORAGE_KEY]: store }, () => {
      resolve()
    })
  })
}

/**
 * Checks whether the eye-icon accuracy tip has been dismissed.
 */
export function getEyeTipDismissed(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve(false)
      return
    }

    chrome.storage.local.get([EYE_TIP_STORAGE_KEY], (result) => {
      resolve(result[EYE_TIP_STORAGE_KEY] === true)
    })
  })
}

/**
 * Persists the eye-icon accuracy tip dismissal state.
 */
export function setEyeTipDismissed(dismissed: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      resolve()
      return
    }

    chrome.storage.local.set({ [EYE_TIP_STORAGE_KEY]: dismissed }, () => {
      resolve()
    })
  })
}

/**
 * Persists the eye-icon accuracy tip dismissal so it stays dismissed.
 */
export function dismissEyeTip(): Promise<void> {
  return setEyeTipDismissed(true)
}

/**
 * Subscribes to storage changes for real-time synchronization between tabs and popup.
 */
export function onStorageUpdated(callback: (newStore: AttendanceStore) => void): () => void {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => {}
  }

  const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[STORAGE_KEY]?.newValue) {
      callback(changes[STORAGE_KEY].newValue as AttendanceStore)
    }
  }

  chrome.storage.onChanged.addListener(listener)
  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
