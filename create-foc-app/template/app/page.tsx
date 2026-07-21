'use client'

import { useState } from 'react'

type UploadResponse = {
  pieceCid: string
  size: number
  complete: boolean
  copies: { providerId: string; dataSetId: string; pieceId: string; retrievalUrl: string }[]
  error?: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [retrieveCid, setRetrieveCid] = useState('')
  const [retrieving, setRetrieving] = useState(false)
  const [retrieveError, setRetrieveError] = useState<string | null>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setResult(null)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json: UploadResponse = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`)
      setResult(json)
      setRetrieveCid(json.pieceCid)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRetrieve() {
    if (!retrieveCid) return
    setRetrieving(true)
    setRetrieveError(null)
    try {
      const res = await fetch(`/api/download?pieceCid=${encodeURIComponent(retrieveCid)}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? `Download failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = retrieveCid
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setRetrieveError(e instanceof Error ? e.message : 'Download failed')
    } finally {
      setRetrieving(false)
    }
  }

  return (
    <main>
      <h1>🌊 FOC App</h1>
      <p className="sub">
        Filecoin Onchain Cloud starter — scaffolded with <span className="mono">create-foc-app</span>
      </p>

      <div className="card">
        <h2>Upload to Filecoin</h2>
        <div className="row">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {uploading && <p className="dim result">Uploading and confirming on-chain — this can take a minute…</p>}
        {uploadError && <p className="err result">✗ {uploadError}</p>}
        {result && (
          <div className="result">
            <div className="ok">✓ Stored on Filecoin ({result.size} bytes)</div>
            <div>
              Piece CID: <span className="mono">{result.pieceCid}</span>
            </div>
            {result.copies.map((c) => (
              <div key={c.pieceId} className="dim">
                data set #{c.dataSetId} · provider #{c.providerId}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Retrieve by Piece CID</h2>
        <div className="row">
          <input
            type="text"
            placeholder="bafkzcib…"
            value={retrieveCid}
            onChange={(e) => setRetrieveCid(e.target.value.trim())}
          />
          <button onClick={handleRetrieve} disabled={!retrieveCid || retrieving}>
            {retrieving ? 'Fetching…' : 'Retrieve'}
          </button>
        </div>
        {retrieveError && <p className="err result">✗ {retrieveError}</p>}
      </div>

      <p className="dim">
        Not working? Run <span className="mono">npm run foc:check</span> · docs:{' '}
        <a href="https://docs.filecoin.cloud" target="_blank" rel="noreferrer">
          docs.filecoin.cloud
        </a>
      </p>
    </main>
  )
}
