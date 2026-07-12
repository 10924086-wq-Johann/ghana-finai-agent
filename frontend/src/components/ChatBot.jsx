import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../services/api'
import LanguageToggle from './LanguageToggle'
import { getLanguagePrompt, getUILabels, getGreeting } from '../utils/languages'

const SUGGESTED_PROMPTS = [
  "What's the best investment for a Ghanaian with GH₵5,000?",
  "Should I buy USD or hold GHS right now?",
  "Explain Ghana's current T-bill rates",
  "Is the GSE a good investment now?",
  "What is COCOBOD and how does it affect Ghana?",
  "How does BoG policy rate affect my savings?",
  "What are the risks of investing in Ghana right now?",
  "Explain the IMF program impact on Ghana",
]

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{
      display:        'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom:   '12px',
      alignItems:     'flex-end',
      gap:            '8px'
    }}>
      {!isUser && (
        <div style={{
          width:          '28px',
          height:         '28px',
          borderRadius:   '50%',
          background:     '#1e293b',
          border:         '1px solid #334155',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '14px',
          flexShrink:     0
        }}>
          🇬🇭
        </div>
      )}
      <div style={{
        maxWidth:     '80%',
        background:   isUser ? '#378ADD20' : '#1e293b',
        border:       `1px solid ${isUser ? '#378ADD40' : '#334155'}`,
        borderRadius: isUser
          ? '12px 12px 2px 12px'
          : '12px 12px 12px 2px',
        padding: '10px 14px',
      }}>
        <p style={{
          fontSize:   '13px',
          color:      isUser ? '#93C5FD' : '#e2e8f0',
          margin:     0,
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}>
          {message.content}
        </p>
        <span style={{
          fontSize:  '10px',
          color:     '#334155',
          marginTop: '4px',
          display:   'block'
        }}>
          {message.time}
        </span>
      </div>
      {isUser && (
        <div style={{
          width:          '28px',
          height:         '28px',
          borderRadius:   '50%',
          background:     '#378ADD20',
          border:         '1px solid #378ADD40',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '14px',
          flexShrink:     0
        }}>
          👤
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
      marginBottom: '12px'
    }}>
      <div style={{
        width:          '28px',
        height:         '28px',
        borderRadius:   '50%',
        background:     '#1e293b',
        border:         '1px solid #334155',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '14px'
      }}>
        🇬🇭
      </div>
      <div style={{
        background:   '#1e293b',
        border:       '1px solid #334155',
        borderRadius: '12px 12px 12px 2px',
        padding:      '10px 16px',
        display:      'flex',
        gap:          '4px',
        alignItems:   'center'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   '#378ADD',
            animation:    `bounce 1.2s ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  )
}

function ChatBot({ marketContext }) {
  const [language, setLanguage]   = useState('en')
  const labels                    = getUILabels(language)

  const [messages, setMessages]   = useState([{
    role:    'assistant',
    content: getGreeting('en'),
    time:    new Date().toLocaleTimeString()
  }])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const messagesEndRef            = useRef(null)
  const inputRef                  = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode)
    setMessages([{
      role:    'assistant',
      content: getGreeting(langCode),
      time:    new Date().toLocaleTimeString()
    }])
    setError(null)
  }

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || loading) return

    setInput('')
    setError(null)

    const userMsg = {
      role:    'user',
      content: content,
      time:    new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: content })

      const res = await sendChat(history, {
        ...marketContext,
        language:        language,
        language_prompt: getLanguagePrompt(language)
      })

      const reply = res.data.reply || res.data.message || 'No response'

      setMessages(prev => [...prev, {
        role:    'assistant',
        content: reply,
        time:    new Date().toLocaleTimeString()
      }])
    } catch (err) {
      setError('Could not reach AI. Please try again.')
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: '❌ Sorry, I could not connect to the AI service. Please try again.',
        time:    new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role:    'assistant',
      content: getGreeting(language),
      time:    new Date().toLocaleTimeString()
    }])
    setError(null)
  }

  return (
    <div style={{
      background:    '#0f172a',
      borderRadius:  '12px',
      border:        '1px solid #1e293b',
      display:       'flex',
      flexDirection: 'column',
      height:        '600px'
    }}>

      {/* Header */}
      <div style={{
        padding:      '12px 16px',
        borderBottom: '1px solid #1e293b'
      }}>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   '10px'
        }}>
          <div>
            <h2 style={{
              fontSize:   '15px',
              fontWeight: 500,
              color:      '#e2e8f0',
              margin:     0
            }}>
              🇬🇭 {labels.chatTitle}
            </h2>
            <span style={{ fontSize: '11px', color: '#475569' }}>
              {labels.poweredBy}
            </span>
          </div>
          <button
            onClick={clearChat}
            style={{
              fontSize:     '11px',
              color:        '#475569',
              background:   'transparent',
              border:       '1px solid #1e293b',
              borderRadius: '6px',
              padding:      '3px 8px',
              cursor:       'pointer'
            }}
          >
            {labels.clearChat}
          </button>
        </div>

        {/* Language toggle */}
        <LanguageToggle
          currentLang={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Messages area */}
      <div style={{
        flex:           1,
        overflowY:      'auto',
        padding:        '16px',
        scrollbarWidth: 'thin'
      }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts — only on first load */}
      {messages.length <= 1 && (
        <div style={{
          padding:  '0 16px 8px',
          display:  'flex',
          gap:      '6px',
          flexWrap: 'wrap'
        }}>
          {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              style={{
                fontSize:     '11px',
                color:        '#64748b',
                background:   '#1e293b',
                border:       '1px solid #334155',
                borderRadius: '20px',
                padding:      '4px 10px',
                cursor:       'pointer',
                textAlign:    'left'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding:  '6px 16px',
          fontSize: '11px',
          color:    '#E24B4A'
        }}>
          {error}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding:    '12px 16px',
        borderTop:  '1px solid #1e293b',
        display:    'flex',
        gap:        '8px',
        alignItems: 'flex-end'
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={labels.placeholder}
          rows={1}
          style={{
            flex:        1,
            background:  '#1e293b',
            border:      '1px solid #334155',
            borderRadius:'8px',
            padding:     '8px 12px',
            color:       '#e2e8f0',
            fontSize:    '13px',
            resize:      'none',
            outline:     'none',
            fontFamily:  'inherit',
            lineHeight:  '1.5'
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            background:   input.trim() && !loading ? '#378ADD' : '#1e293b',
            border:       'none',
            borderRadius: '8px',
            padding:      '8px 16px',
            color:        input.trim() && !loading ? '#fff' : '#475569',
            fontSize:     '13px',
            cursor:       input.trim() && !loading ? 'pointer' : 'default',
            transition:   'all 0.2s',
            fontWeight:   500
          }}
        >
          {loading ? labels.thinking : labels.send}
        </button>
      </div>

    </div>
  )
}

export default ChatBot