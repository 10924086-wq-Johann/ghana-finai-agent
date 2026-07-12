import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getMarket, getMarketSummary } from '../services/api'
import StockDetailModal from './StockDetailModal'

const COLORS = {
  positive: '#1D9E75',
  negative: '#E24B4A',
  neutral:  '#888780'
}

function MarketChart() {
  const [marketData, setMarketData]   = useState(null)
  const [sentiment, setSentiment]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedStock, setSelectedStock] = useState(null)

  useEffect(() => {
    fetchMarket()
    fetchSentiment()
    const interval = setInterval(() => {
      fetchMarket()
      fetchSentiment()
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchMarket = async () => {
    try {
      const res = await getMarket()
      setMarketData(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Market fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSentiment = async () => {
    try {
      const res = await getMarketSummary()
      setSentiment(res.data)
    } catch (err) {
      console.error('Sentiment fetch failed:', err)
    }
  }

  const handleBarClick = (data) => {
    const stock = marketData.stocks.find(s => s.symbol === data.name)
    if (stock) {
      setSelectedStock({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change_pct: stock.change_pct,
        volume: stock.volume,
      })
    }
  }

  if (loading) return (
    <div style={styles.container}>
      <p style={{ color: '#64748b' }}>Loading market data...</p>
    </div>
  )

  if (!marketData) return null

  const stocks  = marketData.stocks       || []
  const forex   = marketData.forex        || {}
  const trading = marketData.trading      || {}
  const tbills  = marketData.tbills       || {}
  const gainers = marketData.top_gainers  || []
  const losers  = marketData.top_losers   || []
  const mood    = sentiment?.combined_mood

  const chartData = stocks
    .filter(s => s.price)
    .map(s => ({
      name:   s.symbol,
      price:  s.price,
      change: s.change_pct,
      fill:   s.change_pct >= 0 ? COLORS.positive : COLORS.negative
    }))

  const tbillData = [
    { name: '91-day',  rate: tbills['91_day']?.rate  || 0 },
    { name: '182-day', rate: tbills['182_day']?.rate || 0 },
    { name: '364-day', rate: tbills['364_day']?.rate || 0 },
  ]

  const moodColor = mood?.overall_mood === 'OPTIMISTIC' ? COLORS.positive
                  : mood?.overall_mood === 'BEARISH'    ? COLORS.negative
                  : '#546E7A'

  const moodBg = mood?.overall_mood === 'OPTIMISTIC' ? '#0F6E5620'
               : mood?.overall_mood === 'BEARISH'    ? '#E24B4A20'
               : '#37474F30'

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Ghana Market Intelligence</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            ...styles.badge,
            background: trading.is_open ? '#0F6E56' : '#5F5E5A',
            color: '#fff'
          }}>
            GSE {trading.status}
          </span>
          {lastUpdated && (
            <span style={styles.timestamp}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Sentiment banner */}
      {mood && (
        <div style={{
          background: moodBg,
          border:     `1px solid ${moodColor}`,
          borderRadius: '8px',
          padding:    '10px 14px',
          marginBottom: '1rem',
          display:    'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: moodColor
            }}>
              Market Mood: {mood.overall_mood}
            </span>
            <div style={{
              marginTop: '6px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {mood.signals?.map((signal, i) => (
                <span key={i} style={{
                  fontSize:     '11px',
                  color:        '#94a3b8',
                  background:   '#1e293b',
                  padding:      '2px 8px',
                  borderRadius: '10px'
                }}>
                  {signal}
                </span>
              ))}
            </div>
          </div>
          {mood.fraud_alerts > 0 && (
            <span style={{
              fontSize:     '11px',
              background:   '#E24B4A',
              color:        '#fff',
              padding:      '4px 10px',
              borderRadius: '20px',
              fontWeight:   500,
              flexShrink:   0
            }}>
              ⚠️ {mood.fraud_alerts} Fraud Alert
            </span>
          )}
        </div>
      )}

      {/* Key metrics row */}
      <div style={styles.metricsRow}>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>USD / GHS</span>
          <span style={styles.metricValue}>
            {forex.USD_GHS?.toFixed(4) || '--'}
          </span>
          <span style={{
            fontSize: '11px',
            color: forex.live ? COLORS.positive : '#888780'
          }}>
            {forex.live ? '● Live' : '● Estimated'}
          </span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>91-day T-bill</span>
          <span style={styles.metricValue}>
            {tbills['91_day']?.rate || '--'}%
          </span>
          <span style={{ fontSize: '11px', color: '#888780' }}>
            Bank of Ghana
          </span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Trading Hours</span>
          <span style={styles.metricValue}>
            {trading.is_open ? 'Open Now' : 'Closed'}
          </span>
          <span style={{ fontSize: '11px', color: '#888780' }}>
            {trading.hours}
          </span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Stocks Tracked</span>
          <span style={styles.metricValue}>{stocks.length}</span>
          <span style={{ fontSize: '11px', color: '#888780' }}>GSE Listed</span>
        </div>
      </div>

      {/* Stock price bar chart - CLICKABLE */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>GSE Stock Prices (GH₵) - Click a bar to see details</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background:   '#1e293b',
                border:       '1px solid #334155',
                borderRadius: '8px',
                color:        '#e2e8f0'
              }}
              formatter={(value) => [`GH₵${value}`, 'Price']}
            />
            <Bar 
              dataKey="price" 
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* T-bill rates chart */}
      <div style={styles.chartSection}>
        <h3 style={styles.chartTitle}>T-bill Rates (%)</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart
            data={tbillData}
            margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[20, 30]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background:   '#1e293b',
                border:       '1px solid #334155',
                borderRadius: '8px',
                color:        '#e2e8f0'
              }}
              formatter={(v) => [`${v}%`, 'Rate']}
            />
            <Bar dataKey="rate" fill="#378ADD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top movers */}
      <div style={styles.moversRow}>
        <div style={styles.moversSection}>
          <h3 style={{ ...styles.chartTitle, color: COLORS.positive }}>
            Top Gainers
          </h3>
          {gainers.length === 0 && (
            <p style={{ fontSize: '12px', color: '#475569' }}>
              No gainers today
            </p>
          )}
          {gainers.map((s, i) => (
            <div key={i} style={styles.moverCard}>
              <span style={styles.moverSymbol}>{s.symbol}</span>
              <span style={styles.moverName}>{s.name}</span>
              <span style={{ color: COLORS.positive, fontWeight: 500 }}>
                +{s.change_pct?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div style={styles.moversSection}>
          <h3 style={{ ...styles.chartTitle, color: COLORS.negative }}>
            Top Losers
          </h3>
          {losers.length === 0 && (
            <p style={{ fontSize: '12px', color: '#475569' }}>
              No losers today
            </p>
          )}
          {losers.map((s, i) => (
            <div key={i} style={styles.moverCard}>
              <span style={styles.moverSymbol}>{s.symbol}</span>
              <span style={styles.moverName}>{s.name}</span>
              <span style={{ color: COLORS.negative, fontWeight: 500 }}>
                {s.change_pct?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          articles={sentiment?.articles || []}
          allStocks={stocks}
          onClose={() => setSelectedStock(null)}
        />
      )}

    </div>
  )
}

const styles = {
  container: {
    background:   '#0f172a',
    borderRadius: '12px',
    padding:      '1.5rem',
    border:       '1px solid #1e293b'
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '1rem'
  },
  title: {
    fontSize:   '16px',
    fontWeight: 500,
    color:      '#e2e8f0',
    margin:     0
  },
  badge: {
    fontSize:     '11px',
    padding:      '3px 8px',
    borderRadius: '20px',
    fontWeight:   500
  },
  timestamp: {
    fontSize: '11px',
    color:    '#475569'
  },
  metricsRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap:                 '12px',
    marginBottom:        '1.5rem'
  },
  metric: {
    background:    '#1e293b',
    borderRadius:  '8px',
    padding:       '12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px'
  },
  metricLabel: {
    fontSize:      '11px',
    color:         '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize:   '20px',
    fontWeight: 500,
    color:      '#e2e8f0'
  },
  chartSection: {
    marginBottom: '1.5rem'
  },
  chartTitle: {
    fontSize:     '13px',
    fontWeight:   500,
    color:        '#94a3b8',
    marginBottom: '0.75rem'
  },
  moversRow: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '16px'
  },
  moversSection: {
    background:   '#1e293b',
    borderRadius: '8px',
    padding:      '12px'
  },
  moverCard: {
    display:       'flex',
    alignItems:    'center',
    gap:           '8px',
    padding:       '6px 0',
    borderBottom:  '1px solid #334155',
    fontSize:      '13px'
  },
  moverSymbol: {
    color:      '#e2e8f0',
    fontWeight: 500,
    minWidth:   '50px'
  },
  moverName: {
    color:     '#64748b',
    flex:      1,
    fontSize:  '11px'
  }
}

export default MarketChart