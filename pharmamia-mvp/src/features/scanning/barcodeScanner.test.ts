import { describe, it, expect, vi, afterEach } from 'vitest'

// Mock @zxing/library before importing the module under test
vi.mock('@zxing/library', () => {
  return {
    BrowserMultiFormatReader: vi.fn(),
  }
})

import { selectBarcodeBackend, scanWithNative, scanWithZXing } from './barcodeScanner'
import { BrowserMultiFormatReader } from '@zxing/library'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('selectBarcodeBackend', () => {
  it('restituisce "native" quando BarcodeDetector è disponibile nella window', () => {
    vi.stubGlobal('BarcodeDetector', class {})
    expect(selectBarcodeBackend()).toBe('native')
  })

  it('restituisce "zxing" quando BarcodeDetector NON è disponibile nella window', () => {
    // Ensure BarcodeDetector is not present
    const win = window as unknown as Record<string, unknown>
    const original = win['BarcodeDetector']
    delete win['BarcodeDetector']

    expect(selectBarcodeBackend()).toBe('zxing')

    if (original !== undefined) {
      win['BarcodeDetector'] = original
    }
  })
})

describe('scanWithNative', () => {
  it('contiene "data_matrix" tra i formati del detector nativo', async () => {
    let capturedFormats: string[] = []
    class FakeBarcodeDetector {
      constructor(opts: { formats: string[] }) {
        capturedFormats = opts.formats
      }
      detect = vi.fn().mockResolvedValue([])
    }
    vi.stubGlobal('BarcodeDetector', FakeBarcodeDetector)
    const videoEl = document.createElement('video')
    await scanWithNative(videoEl)
    expect(capturedFormats).toContain('data_matrix')
  })

  it('restituisce il rawValue quando vengono rilevati codici a barre', async () => {
    const fakeDetect = vi.fn().mockResolvedValue([{ rawValue: '1234567890123' }])
    class FakeBarcodeDetector {
      constructor(_opts: { formats: string[] }) {}
      detect = fakeDetect
    }
    vi.stubGlobal('BarcodeDetector', FakeBarcodeDetector)

    const videoEl = document.createElement('video')
    const result = await scanWithNative(videoEl)

    expect(result).toBe('1234567890123')
    expect(fakeDetect).toHaveBeenCalledWith(videoEl)
  })

  it('restituisce null quando non vengono trovati codici a barre', async () => {
    const fakeDetect = vi.fn().mockResolvedValue([])
    class FakeBarcodeDetector {
      constructor(_opts: { formats: string[] }) {}
      detect = fakeDetect
    }
    vi.stubGlobal('BarcodeDetector', FakeBarcodeDetector)

    const videoEl = document.createElement('video')
    const result = await scanWithNative(videoEl)

    expect(result).toBeNull()
  })
})

describe('scanWithZXing', () => {
  it('restituisce null quando decodeFromVideoElement lancia un errore (nessun codice trovato)', async () => {
    const mockReset = vi.fn()
    const mockDecodeFromVideoElement = vi.fn().mockRejectedValue(new Error('No MultiFormat Readers were able to detect the code.'))
    vi.mocked(BrowserMultiFormatReader).mockImplementation(function (this: unknown) {
      Object.assign(this as object, {
        decodeFromVideoElement: mockDecodeFromVideoElement,
        reset: mockReset,
      })
    } as unknown as typeof BrowserMultiFormatReader)

    const videoEl = document.createElement('video')
    const result = await scanWithZXing(videoEl)

    expect(result).toBeNull()
    expect(mockReset).toHaveBeenCalled()
  })
})
