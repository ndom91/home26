/**
 * Cloudflare Browser Run interaction for link screenshots: binding detection
 * and a single rate-limited `screenshot` capture. The throttle gate serializes
 * Browser Run calls and spaces successive starts, so callers can fire captures
 * without coordinating; everything that does NOT call Browser Run (cache reads,
 * youtube thumbnails) stays outside this module and is never serialized.
 */
const BROWSER_RUN_INTERVAL_MS = 2500
// Wait after page load before capturing, so intro/entrance animations settle.
const SCREENSHOT_SETTLE_MS = 500
// Cap page navigation so a slow/never-idle page does not hang the request.
const SCREENSHOT_NAV_TIMEOUT_MS = 25000

export type BrowserRunBinding = {
  quickAction(action: 'screenshot', options: unknown): Promise<Response>
}

let browserRunQueue: Promise<void> = Promise.resolve()
let lastBrowserRunStartedAt = 0

export function getBrowserRunBinding(binding: unknown): BrowserRunBinding | null {
  if (
    typeof binding === 'object' &&
    binding !== null &&
    'quickAction' in binding &&
    typeof binding.quickAction === 'function'
  ) {
    return binding as BrowserRunBinding
  }

  return null
}

/**
 * Capture a screenshot of `normalizedUrl`, returning the PNG bytes or null on
 * any failure (logged here). Calls are serialized and interval-spaced to stay
 * under Cloudflare's Browser Run rate limit.
 */
export async function captureScreenshot(
  browser: BrowserRunBinding,
  normalizedUrl: string
): Promise<ArrayBuffer | null> {
  let response: Response

  try {
    response = await withBrowserRun(() =>
      browser.quickAction('screenshot', {
        url: normalizedUrl,
        viewport: {
          width: 1280,
          height: 720,
        },
        waitForTimeout: SCREENSHOT_SETTLE_MS,
        // Cap navigation so a slow/never-idle page fails fast instead of leaving
        // the request pending; bestAttempt still captures what loaded by then.
        gotoOptions: { waitUntil: 'load', timeout: SCREENSHOT_NAV_TIMEOUT_MS },
        bestAttempt: true,
      })
    )
  } catch (error) {
    logBrowserRunError(normalizedUrl, error)

    return null
  }

  if (!response.ok) {
    await logBrowserRunFailure(normalizedUrl, response)

    return null
  }

  return await response.arrayBuffer()
}

// Serialize Browser Run calls (one at a time) and space successive starts by
// BROWSER_RUN_INTERVAL_MS so a burst of hovers can't trip the rate limit.
async function withBrowserRun<T>(task: () => Promise<T>): Promise<T> {
  const previousBrowserRun = browserRunQueue.catch(() => {})
  let releaseBrowserRunSlot = () => {}

  browserRunQueue = new Promise<void>((resolve) => {
    releaseBrowserRunSlot = resolve
  })

  await previousBrowserRun

  try {
    const delay = Math.max(0, lastBrowserRunStartedAt + BROWSER_RUN_INTERVAL_MS - Date.now())

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    lastBrowserRunStartedAt = Date.now()

    return await task()
  } finally {
    releaseBrowserRunSlot()
  }
}

async function logBrowserRunFailure(normalizedUrl: string, response: Response) {
  let bodySnippet = ''

  try {
    bodySnippet = (await response.text()).slice(0, 1000)
  } catch (error) {
    bodySnippet = `Unable to read failure body: ${String(error)}`
  }

  // biome-ignore lint/suspicious/noConsole: Emit Worker diagnostics for Browser Run failures.
  console.warn('Link screenshot Browser Run failed', {
    bodySnippet,
    status: response.status,
    statusText: response.statusText,
    targetUrl: normalizedUrl,
  })
}

function logBrowserRunError(normalizedUrl: string, error: unknown) {
  // biome-ignore lint/suspicious/noConsole: Emit Worker diagnostics for Browser Run failures.
  console.warn('Link screenshot Browser Run threw', {
    error: error instanceof Error ? { message: error.message, name: error.name } : String(error),
    targetUrl: normalizedUrl,
  })
}
