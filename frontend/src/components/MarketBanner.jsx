import { useState, useEffect } from 'react'
import { getMarketSummary } from '../services/api'

function MarketBanner() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const res = await getMarketSummary()
      setData(res.data)
    } catch (err) {
      console.error('Banner fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) return null

  const mood    = data.combined_mood
  const market  = data.market
  const forex   = market?.forex || {}
  const trading = market?.trading || {}
  const tbills  = market?.tbills || {}

  const moodColor = mood?.overall_mood === 'OPTIMISTIC' ? '#1D9E75'
                  : mood?.overall_mood === 'BEARISH'    ? '#E24B4A'
                  : '#546E7A'

  return (
    <div style={{
      background:     '#0f172a',
      borderBottom:   '1px solid #1e293b',
      padding:        '8px 1.5rem',
      display:        'flex',
      alignItems:     'center',
      gap:            '24px',
      overflowX:      'auto'
    }}>

      {/* Market mood */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '6px',
        flexShrink: 0
      }}>
        <span style={{
          fontSize:   '11px',
          color:      moodColor,
          fontWeight: 500
        }}>
          ● {mood?.overall_mood}
        </span>
        <span style={{ fontSize: '10px', color: '#334155' }}>
          MARKET MOOD
        </span>
      </div>

      <div style={{ width: '1px', height: '16px', background: '#1e293b' }} />

      {/* Forex */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '10px', color: '#475569' }}>USD/GHS </span>
        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
          {forex.USD_GHS?.toFixed(4) || '--'}
        </span>
        <span style={{
          fontSize:  '10px',
          color:     forex.live ? '#1D9E75' : '#475569',
          marginLeft:'4px'
        }}>
          {forex.live ? '●' : '○'}
        </span>
      </div>

      <div style={{ width: '1px', height: '16px', background: '#1e293b' }} />

      {/* T-bill */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '10px', color: '#475569' }}>91-day T-bill </span>
        <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
          {tbills['91_day']?.rate || '--'}%
        </span>
      </div>

      <div style={{ width: '1px', height: '16px', background: '#1e293b' }} />

      {/* GSE status */}
      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '10px', color: '#475569' }}>GSE </span>
        <span style={{
          fontSize:  '12px',
          fontWeight: 500,
          color:     trading.is_open ? '#1D9E75' : '#475569'
        }}>
          {trading.status || '--'}
        </span>
      </div>

      <div style={{ width: '1px', height: '16px', background: '#1e293b' }} />

      {/* Fraud alerts */}
      {mood?.fraud_alerts > 0 && (
        <div style={{ flexShrink: 0 }}>
          <span style={{
            fontSize:     '10px',
            color:        '#fff',
            background:   '#E24B4A',
            padding:      '2px 8px',
            borderRadius: '10px',
            fontWeight:   500
          }}>
            ⚠️ {mood.fraud_alerts} Fraud Alert
          </span>
        </div>
      )}

      {/* Signal tags */}
      <div style={{
        display:  'flex',
        gap:      '6px',
        flexWrap: 'nowrap'
      }}>
        {mood?.signals?.slice(0, 2).map((signal, i) => (
          <span key={i} style={{
            fontSize:     '10px',
            color:        '#475569',
            background:   '#1e293b',
            padding:      '2px 8px',
            borderRadius: '10px',
            flexShrink:   0
          }}>
            {signal}
          </span>
        ))}
      </div>

    </div>
  )
}

export default MarketBanner