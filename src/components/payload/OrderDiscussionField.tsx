'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

interface MessageDoc {
  id: string
  body: string
  author: string | { id: string; name?: string | null; email?: string | null; role?: string }
  createdAt: string
}

export function OrderDiscussionField() {
  const { id } = useDocumentInfo()
  const [messages, setMessages] = useState<MessageDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${id}/messages`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.docs || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!id || !trimmed || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: trimmed }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setBody('')
      const doc = await res.json()
      setMessages((prev) => (prev.some((m) => m.id === doc.id) ? prev : [...prev, doc]))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  if (!id) return null

  return (
    <div
      style={{
        padding: 'var(--base)',
        background: 'var(--theme-elevation-50)',
        borderRadius: 'var(--border-radius-m)',
        border: '1px solid var(--theme-elevation-200)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base)', marginBottom: 'var(--base)' }}>
        <MessageSquare size={18} />
        <strong>Order discussion</strong>
      </div>
      {error && (
        <div style={{ color: 'var(--theme-error-500)', marginBottom: 'var(--base)', fontSize: '14px' }}>{error}</div>
      )}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base)', padding: 'var(--base)' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading messages…</span>
        </div>
      ) : (
        <>
          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              marginBottom: 'var(--base)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--base)',
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: 'var(--theme-elevation-500)', fontSize: '14px' }}>No messages yet.</div>
            )}
            {messages.map((msg) => {
              const author = typeof msg.author === 'object' && msg.author !== null ? msg.author : null
              const name = author ? (author.name || author.email || 'User') : 'User'
              const isAdmin = author?.role === 'admin'
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: 'var(--border-radius-s)',
                    background: isAdmin ? 'var(--theme-elevation-100)' : 'var(--theme-success-500)',
                    color: isAdmin ? 'var(--theme-text)' : 'white',
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 'var(--base)', alignItems: 'flex-end' }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a reply…"
              rows={2}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-s)',
                border: '1px solid var(--theme-elevation-200)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!body.trim() || sending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'var(--theme-success-500)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-s)',
                cursor: body.trim() && !sending ? 'pointer' : 'not-allowed',
                fontSize: 14,
              }}
            >
              {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
