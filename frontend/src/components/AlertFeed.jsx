import { useState, useEffect } from 'react'
import { getNews } from '../services/api'

const SENTIMENT_COLORS = {
  positive: { bg: '#0F6E5620', border: '#1D9E75', text: '#1D9E75', label: 'POSITIVE' },
  negative: { bg: '#E24B4A20', border: '#E24B4A', text: '#E24B4A', label: 'NEGATIVE' },
  neutral:  { bg: '#37474F30', border: '#546E7A', text: '#90A4AE', label: 'NEUTRAL'  }
}

const PRIORITY_COLORS = {
  critical: '#E24B4A',
  high:     '#FF9800',
  medium:   '#FFC107',
  low:      '#546E7A'
}

const FRAUD_BADGE = {
  high:   { bg: '#E24B4A', text: '🚨 HIGH FRAUD RISK' },
  medium: { bg: '#FF9800', text: '⚠️ FRAUD INDICATOR' },
  low:    null
}

const ITEMS_PER_PAGE = 15

function timeAgo(dateStr) {
  try {
    const date = new Date(dateStr)
    const diff = (Date.now() - date.getTime()) / 1000
    if (diff < 60)    return 'just now'
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}

function AlertCard({ article, onSelect, isSelected }) {
  const sentiment = article.sentiment || 'neutral'
  const colors    = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral
  const fraud     = FRAUD_BADGE[article.fraud_risk]
  const priority  = article.priority || 'low'
  const score     = article.sentiment_score
    ? `${Math.round(article.sentiment_score * 100)}%` : ''

  return (
    <div
      onClick={() => onSelect(article)}
      style={{
        background:   isSelected ? '#1e293b' : '#0f172a',
        border:       `1px solid ${isSelected ? colors.border : '#1e293b'}`,
        borderLeft:   `3px solid ${PRIORITY_COLORS[priority] || '#546E7A'}`,
        borderRadius: '8px',
        padding:      '12px',
        marginBottom: '8px',
        cursor:       'pointer',
        transition:   'all 0.15s'
      }}
    >
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '6px'
      }}>
        <span style={{
          fontSize:     '11px',
          color:        '#378ADD',
          fontWeight:   500,
          background:   '#378ADD15',
          padding:      '2px 7px',
          borderRadius: '10px'
        }}>
          {article.source}
        </span>
        <span style={{ fontSize: '11px', color: '#475569' }}>
          {timeAgo(article.published || article.scraped_at)}
        </span>
      </div>

      <p style={{
        fontSize:   '13px',
        fontWeight: 500,
        color:      '#e2e8f0',
        margin:     '0 0 8px',
        lineHeight: '1.4'
      }}>
        {article.title}
      </p>

      <div style={{
        display:    'flex',
        gap:        '6px',
        flexWrap:   'wrap',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize:     '10px',
          fontWeight:   500,
          color:        colors.text,
          background:   colors.bg,
          border:       `1px solid ${colors.border}`,
          padding:      '2px 7px',
          borderRadius: '10px'
        }}>
          {colors.label} {score}
        </span>
        {article.sector && (
          <span style={{
            fontSize:     '10px',
            color:        '#94a3b8',
            background:   '#1e293b',
            padding:      '2px 7px',
            borderRadius: '10px'
          }}>
            {article.sector}
          </span>
        )}
        {fraud && (
          <span style={{
            fontSize:     '10px',
            fontWeight:   500,
            color:        '#fff',
            background:   fraud.bg,
            padding:      '2px 7px',
            borderRadius: '10px'
          }}>
            {fraud.text}
          </span>
        )}
        {article.entity_names?.slice(0,2).map((e, i) => (
          <span key={i} style={{
            fontSize:     '10px',
            color:        '#64748b',
            background:   '#0f172a',
            border:       '1px solid #1e293b',
            padding:      '2px 7px',
            borderRadius: '10px'
          }}>
            {e}
          </span>
        ))}
      </div>

      {article.explanation && (
        <p style={{
          fontSize:   '11px',
          color:      '#475569',
          margin:     '8px 0 0',
          lineHeight: '1.4'
        }}>
          {article.explanation.slice(0, 120)}...
        </p>
      )}
    </div>
  )
}

function AlertFeed({ onArticleSelect }) {
  const [articles, setArticles]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [filter, setFilter]           = useState('all')
  const [newCount, setNewCount]       = useState(0)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [countdown, setCountdown]     = useState(360)
  const [page, setPage]               = useState(1)

  useEffect(() => {
    fetchArticles()

    const refreshInterval = setInterval(() => {
      fetchArticles()
      setNewCount(0)
    }, 6 * 60 * 1000)

    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 360 : prev - 1)
    }, 1000)

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchArticles()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await getNews({ limit: 50 })
      const newArticles = res.data.articles || []
      setArticles(prev => {
        const prevIds = new Set(prev.map(a => a.id))
        const fresh   = newArticles.filter(a => !prevIds.has(a.id))
        if (fresh.length > 0) setNewCount(c => c + fresh.length)
        return newArticles
      })
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Feed fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (article) => {
    setSelected(article.id)
    if (onArticleSelect) onArticleSelect(article)
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
  }

  const filtered = articles.filter(a => {
    if (filter === 'all')      return true
    if (filter === 'negative') return a.sentiment === 'negative'
    if (filter === 'positive') return a.sentiment === 'positive'
    if (filter === 'fraud')    return a.fraud_risk !== 'low'
    if (filter === 'high')     return ['critical','high'].includes(a.priority)
    return true
  })

  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE)
  const hasMore   = page * ITEMS_PER_PAGE < filtered.length

  const formatCountdown = (s) => {
    const m   = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  return (
    <div style={{
      background:    '#0f172a',
      borderRadius:  '12px',
      padding:       '1rem',
      border:        '1px solid #1e293b',
      height:        '100%',
      display:       'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '12px'
      }}>
        <div>
          <h2 style={{
            fontSize:   '15px',
            fontWeight: 500,
            color:      '#e2e8f0',
            margin:     0
          }}>
            Live Alert Feed
          </h2>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            ⟳ Refreshing in {formatCountdown(countdown)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {newCount > 0 && (
            <span style={{
              fontSize:     '11px',
              background:   '#E24B4A',
              color:        '#fff',
              padding:      '2px 8px',
              borderRadius: '20px',
              fontWeight:   500
            }}>
              🔔 {newCount} new
            </span>
          )}
          <span style={{
            fontSize:     '11px',
            background:   '#1D9E7530',
            color:        '#1D9E75',
            padding:      '2px 8px',
            borderRadius: '20px'
          }}>
            ● Live
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display:      'flex',
        gap:          '4px',
        marginBottom: '12px',
        flexWrap:     'wrap'
      }}>
        {[
          { key: 'all',      label: `All (${articles.length})` },
          { key: 'negative', label: '🔴 Negative' },
          { key: 'positive', label: '🟢 Positive' },
          { key: 'high',     label: '🔥 High Priority' },
          { key: 'fraud',    label: '🚨 Fraud' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            style={{
              fontSize:     '11px',
              padding:      '3px 10px',
              borderRadius: '20px',
              border:       `1px solid ${filter === f.key ? '#378ADD' : '#1e293b'}`,
              background:   filter === f.key ? '#378ADD20' : 'transparent',
              color:        filter === f.key ? '#378ADD' : '#64748b',
              cursor:       'pointer'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading && (
          <p style={{ color: '#475569', fontSize: '13px' }}>
            Loading alerts...
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ color: '#475569', fontSize: '13px' }}>
            No alerts matching this filter.
          </p>
        )}
        {paginated.map(article => (
          <AlertCard
            key={article.id}
            article={article}
            onSelect={handleSelect}
            isSelected={selected === article.id}
          />
        ))}

        {hasMore && (
          <button
            onClick={() => setPage(prev => prev + 1)}
            style={{
              width:        '100%',
              padding:      '10px',
              background:   'transparent',
              border:       '1px solid #1e293b',
              borderRadius: '8px',
              color:        '#378ADD',
              fontSize:     '12px',
              cursor:       'pointer',
              marginTop:    '8px'
            }}
          >
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        )}

        {filtered.length > 0 && (
          <p style={{
            fontSize:  '10px',
            color:     '#334155',
            textAlign: 'center',
            margin:    '8px 0 0'
          }}>
            Showing {paginated.length} of {filtered.length} alerts
          </p>
        )}
      </div>
    </div>
  )
}

export default AlertFeed