import { EYE_TIP_CLASS_NAME } from "~constants/theme"
import type { SubjectAttendance } from "~types"

export interface EyeTipOptions {
  targetTable?: HTMLTableElement | null
  exactCount?: number
  totalCount?: number
  force?: boolean
  subjects?: SubjectAttendance[]
  overallPercentage?: number
}

/**
 * Removes any injected eye-icon hint elements from the page and restores any hidden DOM elements.
 */
export function hideEyeTip(): void {
  document
    .querySelectorAll(`.${EYE_TIP_CLASS_NAME}`)
    .forEach((el) => el.remove())

  // Unhide any previously hidden elements
  document
    .querySelectorAll<HTMLElement>("[data-cv-results-hidden='true']")
    .forEach((el) => {
      el.style.display = el.dataset.cvOriginalDisplay || ""
      delete el.dataset.cvResultsHidden
      delete el.dataset.cvOriginalDisplay
    })

  document
    .querySelectorAll<HTMLElement>("[data-cv-results-table]")
    .forEach((el) => {
      el.style.display = ""
      delete el.dataset.cvResultsTable
    })
}

/**
 * Disabled per user request: does not inject widget at the top of the page
 * or cover page elements. Ensures any existing widgets are removed.
 */
export async function injectEyeTip(
  _targetTableOrOptions?: HTMLTableElement | null | EyeTipOptions,
  _exactCountArg = 0,
  _totalCountArg = 0,
  _forceArg = false
): Promise<void> {
  hideEyeTip()
}


