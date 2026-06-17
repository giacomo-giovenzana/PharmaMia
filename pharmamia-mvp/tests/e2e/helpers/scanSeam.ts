import type { Page } from '@playwright/test'

/**
 * Installs browser-level stubs for camera and BarcodeDetector APIs so that
 * the barcode-scan flow can be driven in e2e tests without real hardware.
 *
 * Must be called before `page.goto()` (uses `page.addInitScript` which runs
 * before any page script).
 *
 * Stubs installed:
 *  - `navigator.mediaDevices.getUserMedia` → returns a minimal fake MediaStream
 *  - `window.BarcodeDetector` → class whose `detect()` resolves to the given
 *    EAN code on the first call, then to an empty array on subsequent calls
 */
export async function installScanSeam(page: Page, eanCode: string): Promise<void> {
  await page.addInitScript(
    ({ eanCode: code }: { eanCode: string }) => {
      // Note: getUserMedia is intentionally NOT stubbed here.
      // The Playwright chromium project uses --use-fake-ui-for-media-stream
      // and --use-fake-device-for-media-stream launch args so the browser
      // provides a real fake camera stream that can be set as srcObject and
      // played without real hardware.

      // Stub BarcodeDetector as a class (app calls `new BarcodeDetector(...)`)
      let detectCallCount = 0

      class BarcodeDetectorStub {
        constructor(_options?: unknown) {
          // options intentionally ignored in stub
        }

        detect(_source?: unknown): Promise<Array<{ rawValue: string; format: string }>> {
          if (detectCallCount === 0) {
            detectCallCount++
            return Promise.resolve([{ rawValue: code, format: 'ean_13' }])
          }
          return Promise.resolve([])
        }

        static getSupportedFormats(): Promise<string[]> {
          return Promise.resolve(['ean_13', 'ean_8', 'code_128', 'qr_code'])
        }
      }

      ;(globalThis as Record<string, unknown>).BarcodeDetector = BarcodeDetectorStub
    },
    { eanCode },
  )
}
