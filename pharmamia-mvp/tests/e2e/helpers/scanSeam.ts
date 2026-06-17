import type { Page } from '@playwright/test'

export type ScanSeamOptions = {
  rawValue: string
  format?: string
}

/**
 * Installs browser-level stubs for camera and BarcodeDetector APIs so that
 * the barcode-scan flow can be driven in e2e tests without real hardware.
 *
 * Must be called before `page.goto()` (uses `page.addInitScript`).
 * Accepts a plain EAN string (backwards-compatible) or a ScanSeamOptions object.
 */
export async function installScanSeam(page: Page, eanOrOpts: string | ScanSeamOptions): Promise<void> {
  const opts: Required<ScanSeamOptions> =
    typeof eanOrOpts === 'string'
      ? { rawValue: eanOrOpts, format: 'ean_13' }
      : { format: 'ean_13', ...eanOrOpts }

  await page.addInitScript(
    ({ rawValue, format }: { rawValue: string; format: string }) => {
      // getUserMedia is NOT stubbed here — Playwright chromium uses
      // --use-fake-ui-for-media-stream / --use-fake-device-for-media-stream.

      let detectCallCount = 0

      class BarcodeDetectorStub {
        constructor(_options?: unknown) {}

        detect(_source?: unknown): Promise<Array<{ rawValue: string; format: string }>> {
          if (detectCallCount === 0) {
            detectCallCount++
            return Promise.resolve([{ rawValue, format }])
          }
          return Promise.resolve([])
        }

        static getSupportedFormats(): Promise<string[]> {
          return Promise.resolve(['ean_13', 'ean_8', 'code_128', 'qr_code', 'data_matrix'])
        }
      }

      ;(globalThis as Record<string, unknown>).BarcodeDetector = BarcodeDetectorStub
    },
    { rawValue: opts.rawValue, format: opts.format },
  )
}

/**
 * Builds a minimal GS1 DataMatrix raw payload for test scenarios.
 * AI 01 (GTIN-14) + AI 17 (YYMMDD) + optional AI 10 (lot) + AI 21 (serial).
 * Variable-length fields separated by FNC1 (\x1d).
 */
export function buildGs1Payload(opts: {
  gtin14: string
  expiryYYMMDD: string
  lot?: string
  serial?: string
}): string {
  let s = `01${opts.gtin14}17${opts.expiryYYMMDD}`
  if (opts.lot) s += `\x1d10${opts.lot}`
  if (opts.serial) s += `\x1d21${opts.serial}`
  return s
}
