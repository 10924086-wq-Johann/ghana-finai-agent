import React, { useState, useEffect } from 'react'
import { getArticlesByCompany, calculateCompanySentiment } from '../services/api'
import { generateStockRecommendation } from '../utils/stockRecommendation'
import { calculateInvestmentRating } from '../utils/investmentRating'
import { getBacktestProofForSignal } from '../utils/backtestProof'
import { COMPANIES } from '../data/companies'

function StockDetailModal({ stock, onClose, articles = [], allStocks, marketStatus = {} }) {
  const [companyNews, setCompanyNews] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [rating, setRating] = useState(null)
  const [backtest, setBacktest] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (stock) loadStockDetails()
    const interval = setInterval(() => loadStockDetails(), 30000)
    return () => clearInterval(interval)
  }, [stock, articles])

  const loadStockDetails = async () => {
    setRefreshing(true)
    const company = COMPANIES[stock.symbol] || {}
    
    // Filter articles by company
    const filtered = getArticlesByCompany(stock.symbol, articles || [])
    setCompanyNews(filtered.slice(0, 5))

    // Calculate sentiment
    const sentimentData = calculateCompanySentiment(filtered)
    setSentiment(sentimentData)

    // Generate recommendation
    const newsQuality = filtered.length > 0 ? sentimentData.positive / filtered.length : 0.5
    const rec = generateStockRecommendation(stock, filtered, sentimentData)
    setRecommendation(rec)

    // Calculate rating
    const rat = calculateInvestmentRating(rec.action, rec.confidence, sentimentData, newsQuality, stock.change_pct || 0)
    setRating(rat)

    // Get backtest proof
    const proof = getBacktestProofForSignal(rec.action, rec.confidence, sentimentData, newsQuality)
    setBacktest(proof)
    
    setRefreshing(false)
  }

  if (!stock) return null

  const company = COMPANIES[stock.symbol] || {}
  const isMarketOpen = marketStatus?.is_open || false
  
  const actionColors = {
    BUY: { bg: '#0F6E5625', border: '#1D9E75', color: '#1D9E75', icon: '📈' },
    SELL: { bg: '#E24B4A25', border: '#E24B4A', color: '#E24B4A', icon: '📉' },
    HOLD: { bg: '#37474F40', border: '#546E7A', color: '#90A4AE', icon: '⏸' },
    WATCH: { bg: '#FF980025', border: '#FF9800', color: '#FF9800', icon: '👁' },
  }
  const s = actionColors[recommendation?.action] || actionColors.HOLD

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header with GSE Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>{company.name}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{company.sector}</p>
              <span style={{ background: isMarketOpen ? '#0F6E56' : '#5F5E5A', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500 }}>
                GSE {isMarketOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => loadStockDetails()} style={{ background: 'transparent', border: '1px solid #378ADD', color: '#378ADD', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }} disabled={refreshing}>
              🔄 {refreshing ? 'Updating...' : 'Refresh'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Price Info */}
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <p style={{ color: '#64748b', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Current Price</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>₵{stock.price?.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: '#64748b', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>24h Change</p>
            <p style={{ color: (stock.change_pct || 0) > 0 ? '#1D9E75' : '#E24B4A', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {(stock.change_pct || 0) > 0 ? '+' : ''}{stock.change_pct?.toFixed(2) || '0'}%
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Volume</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{stock.volume?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p style={{ color: '#64748b', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Market Cap</p>
            <p style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{company.marketCap}</p>
          </div>
        </div>

        {/* About */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>About</h3>
          <p style={{ color: '#94a3b8', margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>{company.about}</p>
        </div>

        {/* Recent News */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Recent News ({companyNews.length} articles)</h3>
          {companyNews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {companyNews.map((article, idx) => (
                <div key={idx} style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px', border: '1px solid #334155' }}>
                  <p style={{ color: '#94a3b8', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>{article.source} • {new Date(article.published).toLocaleDateString()}</p>
                  <p style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 500 }}>{article.title}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: article.sentiment === 'positive' ? 'rgba(29,158,117,0.2)' : article.sentiment === 'negative' ? 'rgba(226,75,74,0.2)' : 'rgba(148,163,184,0.2)', color: article.sentiment === 'positive' ? '#1D9E75' : article.sentiment === 'negative' ? '#E24B4A' : '#94A3B8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {article.sentiment?.toUpperCase()} {Math.round((article.sentiment_score || 0) * 100)}%
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{article.sector}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px', border: '1px dashed #334155' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>📰 No recent news found. Check back when new articles are published.</p>
            </div>
          )}
        </div>

        {/* Sentiment */}
        {sentiment && (
          <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1rem', borderRadius: '6px', border: `2px solid ${sentiment.mood === 'BULLISH' ? '#1D9E75' : sentiment.mood === 'BEARISH' ? '#E24B4A' : '#546E7A'}` }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>📊 Market Sentiment</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ color: sentiment.mood === 'BULLISH' ? '#1D9E75' : sentiment.mood === 'BEARISH' ? '#E24B4A' : '#546E7A', margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                {sentiment.mood === 'BULLISH' ? '🟢' : sentiment.mood === 'BEARISH' ? '🔴' : '⚪'} {sentiment.mood}
              </p>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Score: {sentiment.score}%</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#1D9E75', margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{sentiment.positive}</p>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Positive</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#94A3B8', margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{sentiment.neutral}</p>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Neutral</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#E24B4A', margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{sentiment.negative}</p>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Negative</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {recommendation && (
          <div style={{ marginBottom: '1.5rem', background: s.bg, border: `2px solid ${s.border}`, borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ color: s.color, margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{s.icon} {recommendation.action}</p>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>Confidence</p>
                <p style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{recommendation.confidence}%</p>
              </div>
            </div>
            <p style={{ color: '#94a3b8', margin: '0 0 0.75rem 0', fontSize: '0.9rem', lineHeight: '1.5' }}>{recommendation.rationale}</p>
            <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${recommendation.confidence}%`, background: s.color, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Investment Rating */}
        {rating && (
          <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <p style={{ color: '#64748b', margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>Investment Worthiness</p>
            <p style={{ color: '#fff', margin: '0 0 0.75rem 0', fontSize: '1.3rem', fontWeight: 'bold' }}>{'⭐'.repeat(Math.floor(rating.stars))} {rating.stars}/5</p>
            <p style={{ color: rating.worthy ? '#1D9E75' : '#E24B4A', margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{rating.worthy ? '✅ WORTHY TO INVEST' : '❌ NOT RECOMMENDED'}</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{recommendation.summary}</p>
          </div>
        )}

        {/* Backtesting Proof */}
        {backtest && (
          <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #00d9ff' }}>
            <p style={{ color: '#00d9ff', margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>📊 Backtesting Proof</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
              When similar "{backtest.signalType}" signals appear: <strong>{backtest.winRate}% win rate</strong> | Avg return: <strong>{backtest.avgGain > 0 ? '+' : ''}{backtest.avgGain}%</strong>
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid #FF9800', borderRadius: '6px', padding: '1rem' }}>
          <p style={{ color: '#FF9800', margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ Disclaimer</p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem', lineHeight: '1.5' }}>AI-generated analysis for educational purposes. Not financial advice. Always consult a licensed financial advisor.</p>
        </div>
      </div>
    </div>
  )
}

export default StockDetailModal