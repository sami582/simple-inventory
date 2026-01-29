// src/components/InventoryAssistant.jsx
import { useState, useRef, useEffect } from 'react'
import { useInventory } from '../contexts/InventoryContext'
import { assistantService } from '../services/assistantService'
import { useTranslation } from 'react-i18next'
import './InventoryAssistant.css'

const Assistant = () => {
  const { items } = useInventory()
  const { t, i18n } = useTranslation()

  // initial message uses translation; we keep message with id 'intro' so we can replace it on language change
  const [messages, setMessages] = useState([
    { id: 'intro', from: 'assistant', text: t('assistant_intro', 'Hi — ask me about low stock, what to buy, or your inventory status.') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update the intro message when language changes (so the assistant UI is localized even if user navigated before language selection)
  useEffect(() => {
    setMessages(prev => {
      // replace intro message if exists, otherwise prepend
      const rest = prev.filter(m => m.id !== 'intro')
      const intro = { id: 'intro', from: 'assistant', text: t('assistant_intro', 'Hi — ask me about low stock, what to buy, or your inventory status.') }
      return [intro, ...rest]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const append = (msg) => setMessages(prev => [...prev, { id: String(Date.now()) + Math.random(), ...msg }])

  const handleSend = async () => {
    const text = (input || '').trim()
    if (!text) return
    append({ from: 'user', text })
    setInput('')
    setLoading(true)

    try {
      // pass items and let service produce a localized response based on current i18n language
      const res = await assistantService.generateResponse(items, text, i18n.language)
      if (res && res.text) {
        append({ from: 'assistant', text: res.text })
      } else {
        append({ from: 'assistant', text: t('assistant_error', "Sorry, I couldn't generate an answer.") })
      }
    } catch (err) {
      console.error('Assistant error', err)
      append({ from: 'assistant', text: t('assistant_error', 'An error occurred while generating the reply.') })
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="assistant-wrap">
      <div className="assistant-header">
        <h3>{t('assistant_title', 'Inventory Assistant')}</h3>
        <p className="assistant-sub">{t('assistant_sub', 'Ask: "What should I buy now?" or "Show low stock"')}</p>
      </div>

      <div className="assistant-messages" role="log" aria-live="polite">
        {messages.map(m => (
          <div key={m.id} className={`assistant-message ${m.from}`}>
            <div className="assistant-bubble">
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.text}</pre>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="assistant-input">
        <textarea
          placeholder={t('assistant_placeholder', 'Type a question... (Enter to send)')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={2}
        />
        <div className="assistant-actions">
          <button onClick={handleSend} disabled={loading}>
            {loading ? t('assistant_thinking', 'Thinking...') : t('assistant_send', 'Send')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Assistant
