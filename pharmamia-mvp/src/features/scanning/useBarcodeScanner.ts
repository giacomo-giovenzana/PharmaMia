import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { selectBarcodeBackend, scanWithNative } from './barcodeScanner'

export type ScanError =
  | { type: 'permission_denied' }
  | { type: 'camera_unavailable' }
  | { type: 'api_unavailable' }
  | { type: 'scan_failed'; message: string }

interface UseBarcodeScanner {
  scanning: boolean
  result: string | null
  error: ScanError | null
  toggleTorch: () => Promise<void>
}

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onDetected: (code: string) => void
}

export function useBarcodeScanner({ videoRef, onDetected }: Options): UseBarcodeScanner {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<ScanError | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const rafRef = useRef<number | null>(null)
  const detectedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  const stopStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (zxingReaderRef.current) {
      zxingReaderRef.current.reset()
      zxingReaderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [videoRef])

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({ type: 'api_unavailable' })
      return
    }

    detectedRef.current = false
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        videoEl.srcObject = stream
        return videoEl.play()
      })
      .then(() => {
        if (cancelled) return
        setScanning(true)

        const backend = selectBarcodeBackend()

        if (backend === 'native') {
          const poll = async () => {
            if (cancelled || detectedRef.current) return
            try {
              const code = await scanWithNative(videoEl)
              if (code && !detectedRef.current) {
                detectedRef.current = true
                setResult(code)
                onDetectedRef.current(code)
                return
              }
            } catch {
              // frame not ready, keep polling
            }
            rafRef.current = requestAnimationFrame(() => { void poll() })
          }
          rafRef.current = requestAnimationFrame(() => { void poll() })
        } else {
          const reader = new BrowserMultiFormatReader()
          zxingReaderRef.current = reader
          reader
            .decodeFromStream(streamRef.current!, videoEl, (res, err) => {
              if (cancelled || detectedRef.current) return
              if (res) {
                detectedRef.current = true
                const code = res.getText()
                setResult(code)
                onDetectedRef.current(code)
              } else if (err && err.name !== 'NotFoundException') {
                setError({ type: 'scan_failed', message: err.message })
              }
            })
            .catch(e => {
              if (!cancelled) {
                setError({ type: 'scan_failed', message: (e as Error).message })
              }
            })
        }
      })
      .catch((e: Error) => {
        if (cancelled) return
        if (e.name === 'NotAllowedError') {
          setError({ type: 'permission_denied' })
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setError({ type: 'camera_unavailable' })
        } else {
          setError({ type: 'scan_failed', message: e.message })
        }
      })

    return () => {
      cancelled = true
      stopStream()
      setScanning(false)
    }
  }, [videoRef, stopStream])

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
    if (!capabilities.torch) return
    const settings = track.getSettings() as MediaTrackSettings & { torch?: boolean }
    const currentTorch = settings.torch ?? false
    try {
      await track.applyConstraints({ advanced: [{ torch: !currentTorch } as MediaTrackConstraintSet] })
    } catch {
      // torch unsupported on this device, silently ignore
    }
  }, [])

  return { scanning, result, error, toggleTorch }
}
