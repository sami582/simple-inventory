// src/components/ReviewQR.jsx
import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase, getCurrentUser } from '../services/supabaseClient'
import './ReviewQR.css'

export default function ReviewQR() {
  const [user, setUser] = useState(null)
  const [link, setLink] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [existingCount, setExistingCount] = useState(0)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    ;(async () => {
      const sessionUser = await getCurrentUser()
      setUser(sessionUser)
      if (!sessionUser) return

      // load saved profile link (if any)
      const { data, error } = await supabase
        .from('profiles')
        .select('review_link')
        .eq('id', sessionUser.id)
        .single()

      if (!error && data?.review_link) {
        setLink(data.review_link)
        try {
          const url = await QRCode.toDataURL(data.review_link, { margin: 1, width: 360 })
          setQrDataUrl(url)
        } catch (e) { /* ignore */ }
      }

      await refreshQrCount(sessionUser.id)
    })()
  }, [])

  async function refreshQrCount(uid) {
    if (!uid) return setExistingCount(0)
    try {
      const { data, count, error } = await supabase
        .from('qr_codes')
        .select('id', { count: 'exact' })
        .eq('user_id', uid)

      if (error) {
        console.warn('Failed to read qr_codes count', error)
        setExistingCount(0)
      } else {
        setExistingCount(count ?? (Array.isArray(data) ? data.length : 0))
      }
    } catch (e) {
      console.error(e)
      setExistingCount(0)
    }
  }

  // single action: generate (consumes a slot) and save profile link after insert success
  async function handleGenerateQR() {
    setMsg('')
    if (!user) return setMsg('You must be logged in.')
    if (!link || !link.startsWith('http')) {
      return setMsg('Please paste a valid URL (starts with https://).')
    }
    if (existingCount >= 3) return setMsg('QR limit reached (3/3).')

    setGenerating(true)
    try {
      // 1) Attempt to insert qr_codes row first (DB trigger will block if limit reached)
      const { error: insertError } = await supabase
        .from('qr_codes')
        .insert({ user_id: user.id, target_url: link })

      if (insertError) {
        const text = String(insertError?.message || insertError)
        if (text.includes('QR_LIMIT_EXCEEDED') || text.toLowerCase().includes('limit')) {
          setMsg('QR limit reached (3/3).')
        } else {
          setMsg('Failed to generate QR (server error).')
          console.error('qr insert error', insertError)
        }
        await refreshQrCount(user.id)
        return
      }

      // 2) Insert succeeded -> upsert profile.review_link so user has saved link
      const payload = { id: user.id, review_link: link }
      const { error: upsertError } = await supabase.from('profiles').upsert(payload, { returning: 'minimal' })
      if (upsertError) {
        console.warn('Failed to save profile link after QR insert', upsertError)
        // Not fatal — we already consumed a slot; show message but continue
        setMsg('QR generated but saving profile link failed (see console).')
      } else {
        setMsg('QR generated and link saved!')
      }

      // 3) generate QR image client-side (visual)
      try {
        const url = await QRCode.toDataURL(link, { margin: 1, width: 360 })
        setQrDataUrl(url)
      } catch (e) {
        console.error('QR image generation failed', e)
      }

      // 4) refresh count (should have incremented)
      await refreshQrCount(user.id)
    } catch (err) {
      console.error(err)
      setMsg('Unexpected error during generation.')
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'review-qr.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handleCopy() {
    try {
      if (!link) return setMsg('No link to copy.')
      await navigator.clipboard.writeText(link)
      setMsg('Link copied to clipboard.')
    } catch (e) {
      setMsg('Copy failed.')
    }
  }

  return (
    <div className="review-qr-wrap">
      <h2>Reviews QR</h2>
      <p>Paste your Google review link (example: <code>https://search.google.com/local/writereview?placeid=PLACE_ID</code>)</p>

      <div className="form-row">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://search.google.com/local/writereview?placeid=..."
          style={{ width: '100%', padding: '8px', borderRadius: 6 }}
        />
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleGenerateQR} disabled={generating || existingCount >= 3} className="btn btn-primary">
          {generating ? 'Generating…' : `Generate QR (${existingCount}/3)`}
        </button>

        <button onClick={handleCopy} className="btn btn-secondary">Copy link</button>

        <div style={{ marginLeft: 'auto', color: existingCount >= 3 ? '#b91c1c' : '#374151', fontWeight: 600 }}>
          {existingCount}/3 used
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {msg && <div className="small-msg">{msg}</div>}
      </div>

      <div style={{ marginTop: 18 }}>
        {qrDataUrl ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <img src={qrDataUrl} alt="QR code" style={{ width: 240, height: 240, border: '1px solid #eee', padding: 8, background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleDownload} className="btn btn-primary">Download QR</button>
              <a href={link} target="_blank" rel="noreferrer" className="btn btn-secondary">Open link</a>
            </div>
          </div>
        ) : (
          <div style={{ color: '#666' }}>No QR yet. Paste a link and click Generate QR.</div>
        )}
      </div>
    </div>
  )
}
