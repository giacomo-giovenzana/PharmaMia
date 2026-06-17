import { BrowserMultiFormatReader } from '@zxing/library'

export type BarcodeBackend = 'native' | 'zxing'

export function selectBarcodeBackend(): BarcodeBackend {
  return 'BarcodeDetector' in window ? 'native' : 'zxing'
}

export async function scanWithNative(videoEl: HTMLVideoElement): Promise<string | null> {
  const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
  })
  const barcodes = await detector.detect(videoEl)
  return barcodes.length > 0 ? barcodes[0].rawValue : null
}

export async function scanWithZXing(videoEl: HTMLVideoElement): Promise<string | null> {
  const reader = new BrowserMultiFormatReader()
  try {
    const result = await reader.decodeFromVideoElement(videoEl)
    return result.getText()
  } catch {
    return null
  } finally {
    reader.reset()
  }
}
