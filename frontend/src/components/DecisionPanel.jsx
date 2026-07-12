import { useState, useEffect } from 'react'
import { getDecision } from '../services/api'
import BacktestDisplay from './BacktestDisplay'

const _decisionCache = {}
const ACTION_STYLES = {
  BUY:   { bg: '#0F6E5625', border: '#1D9E75', color: '#1D9E75', icon: '📈' },
  SELL:  { bg: '#E24B4A25', border: '#E24B4A', color: '#E24B4A', icon: '📉' },
  HOLD:  { bg: '#37474F40', border: '#546E7A', color: '#90A4AE', icon: '⏸' },
  WATCH: { bg: '#FF980025', border: '#FF9800', color: '#FF9800', icon: '👁' },
  AVOID: { bg: '#E24B4A40', border: '#E24B4A', color: '#E24B4A', icon: '🚫' },
}
const RISK_COLORS = {
  LOW:    '#1D9E75',
  MEDIUM: '#FFC107',
  HIGH:   '#FF9800',
  CRITICAL: '#E24B4A',
}
const CONFIDENCE_COLORS = {
  green:  '#1D9E75',
  teal:   '#1D9E75',
  amber:  '#FFC107',
  orange: '#FF9800',
  red:    '#E24B4A',
}
function DecisionPanel({ article }) {
  const [decision, setDecision] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  useEffect(() => {
    if (!article) return
    setDecision(null)
    setError(null)
    fetchDecision()
  }, [article?.id])
  const fetchDecision = async () => {
    if (!article?.id) return
    if (_decisionCache[article.id]) {
      setDecision(_decisionCache[article.id])
      return
    }
    setLoading(true)
    try {
      const res = await getDecision(article.id)
      if (res.data.status === 'ok') {
        _decisionCache[article.id] = res.data.decision
        setDecision(res.data.decision)
      } else {
        setError('Could not load decision')
      }
    } catch (err) {
      setError('Decision unavailable')
    } finally {
      setLoading(false)
    }
  }
  if (!article) return (
    <div style={styles.empty}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
      <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center' }}>
        Click any alert card to see the AI investment decision
      </p>
    </div>
  )
  const sentiment      = article.sentiment || 'neutral'
  const sentimentColor = sentiment === 'positive' ? '#1D9E75'
                       : sentiment === 'negative' ? '#E24B4A'
                       : '#90A4AE'
  return (
    <div style={styles.container}>
      {/* Article header */}
      <div style={styles.articleHeader}>
        <div style={{
          display:      'flex',
          gap:          '8px',
          alignItems:   'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize:     '11px',
            color:        '#378ADD',
            background:   '#378ADD15',
            padding:      '2px 8px',
            borderRadius: '10px',
            fontWeight:   500
          }}>
            {article.source}
          </span>
          <span style={{
            fontSize:   '11px',
            color:      sentimentColor,
            fontWeight: 500
          }}>
            {sentiment?.toUpperCase()}
            {article.sentiment_score
              ? ` ${Math.round(article.sentiment_score * 100)}%`
              : ''}
          </span>
          {article.fraud_risk !== 'low' && (
            <span style={{
              fontSize:     '11px',
              color:        '#fff',
              background:   '#E24B4A',
              padding:      '2px 8px',
              borderRadius: '10px'
            }}>
              ⚠️ {article.fraud_risk?.toUpperCase()} FRAUD RISK
            </span>
          )}
        </div>
        <h3 style={{
          fontSize:   '14px',
          fontWeight: 500,
          color:      '#e2e8f0',
          margin:     '0 0 8px',
          lineHeight: '1.4'
        }}>
          {article.title}
        </h3>
        <p style={{
          fontSize:   '12px',
          color:      '#64748b',
          margin:     '0 0 8px',
          lineHeight: '1.5'
        }}>
          {article.explanation}
        </p>
        {article.sector && (
          <span style={{
            fontSize:     '11px',
            color:        '#94a3b8',
            background:   '#1e293b',
            padding:      '2px 8px',
            borderRadius: '10px'
          }}>
            {article.sector}
          </span>
        )}
      </div>
      <div style={styles.divider} />
      {/* Decision section */}
      {loading && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            Generating AI investment decision...
          </p>
        </div>
      )}
      {error && (
        <div style={{ padding: '1rem' }}>
          <p style={{ color: '#E24B4A', fontSize: '13px' }}>{error}</p>
          <button onClick={fetchDecision} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}
      {decision && !loading && (() => {
        const action = decision.action || 'HOLD'
        const s      = ACTION_STYLES[action] || ACTION_STYLES.HOLD
        return (
          <div>
            {/* Action badge */}
            <div style={{
              background:     s.bg,
              border:         `1px solid ${s.border}`,
              borderRadius:   '10px',
              padding:        '12px 16px',
              marginBottom:   '12px',
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center'
            }}>
              <div>
                <div style={{
                  fontSize:   '22px',
                  fontWeight: 500,
                  color:      s.color
                }}>
                  {s.icon} {action}
                </div>
                <div style={{
                  fontSize:  '11px',
                  color:     '#94a3b8',
                  marginTop: '2px'
                }}>
                  {decision.time_horizon?.replace('_',' ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize:   '13px',
                  color:      RISK_COLORS[decision.risk_level] || '#90A4AE',
                  fontWeight: 500
                }}>
                  {decision.risk_level} RISK
                </div>
                <div style={{
                  fontSize: '11px',
                  color:    CONFIDENCE_COLORS[
                    decision.confidence_info?.color
                  ] || '#90A4AE'
                }}>
                  {decision.confidence}% confident
                </div>
              </div>
            </div>
            {/* What caused this */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>What caused this</h4>
              <p style={styles.sectionText}>{decision.what_caused_this}</p>
            </div>
            {/* Investment action */}
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Recommended action</h4>
              <p style={styles.sectionText}>{decision.investment_action}</p>
            </div>
            {/* Steps */}
            {decision.steps?.length > 0 && (
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Steps to take</h4>
                {decision.steps.map((step, i) => (
                  <div key={i} style={{
                    display:      'flex',
                    gap:          '10px',
                    marginBottom: '6px',
                    alignItems:   'flex-start'
                  }}>
                    <span style={{
                      minWidth:       '20px',
                      height:         '20px',
                      borderRadius:   '50%',
                      background:     '#1e293b',
                      color:          '#378ADD',
                      fontSize:       '11px',
                      fontWeight:     500,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      flexShrink:     0,
                      marginTop:      '1px'
                    }}>
                      {i + 1}
                    </span>
                    <p style={{
                      fontSize:   '12px',
                      color:      '#94a3b8',
                      margin:     0,
                      lineHeight: '1.5'
                    }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {/* Ghana context */}
            {decision.ghana_context && (
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Ghana market context</h4>
                <p style={styles.sectionText}>{decision.ghana_context}</p>
              </div>
            )}
            {/* Risks */}
            {decision.risks && (
              <div style={styles.section}>
                <h4 style={{ ...styles.sectionTitle, color: '#FF9800' }}>
                  ⚠️ Risks
                </h4>
                <p style={styles.sectionText}>{decision.risks}</p>
              </div>
            )}
            {/* Confidence bar */}
            <div style={styles.section}>
              <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                marginBottom:   '4px'
              }}>
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  AI Confidence
                </span>
                <span style={{
                  fontSize: '11px',
                  color:    CONFIDENCE_COLORS[
                    decision.confidence_info?.color
                  ] || '#90A4AE'
                }}>
                  {decision.confidence_info?.label}
                </span>
              </div>
              <div style={{
                height:       '4px',
                background:   '#1e293b',
                borderRadius: '2px'
              }}>
                <div style={{
                  height:       '4px',
                  borderRadius: '2px',
                  width:        `${decision.confidence || 0}%`,
                  background:   CONFIDENCE_COLORS[
                    decision.confidence_info?.color
                  ] || '#90A4AE',
                  transition:   'width 0.5s'
                }} />
              </div>
              <p style={{
                fontSize:  '11px',
                color:     '#475569',
                margin:    '4px 0 0'
              }}>
                {decision.confidence_info?.caution}
              </p>
            </div>
            {/* Disclaimer */}
            <div style={{
              background:   '#1e293b',
              borderRadius: '8px',
              padding:      '10px',
              marginTop:    '8px'
            }}>
              <p style={{
                fontSize:   '10px',
                color:      '#475569',
                margin:     0,
                lineHeight: '1.5'
              }}>
                {decision.disclaimer}
              </p>
            </div>
            {/* Model + link */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              marginTop:      '8px'
            }}>
              <span style={{ fontSize: '10px', color: '#334155' }}>
                Model: {decision.model_used}
              </span>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize:       '11px',
                  color:          '#378ADD',
                  textDecoration: 'none'
                }}
              >
                Read full article →
              </a>
            </div>

            {/* Backtesting Results */}
            <BacktestDisplay />
          </div>
        )
      })()}
    </div>
  )
}
const styles = {
  container: {
    background:   '#0f172a',
    borderRadius: '12px',
    padding:      '1rem',
    border:       '1px solid #1e293b',
    overflowY:    'auto',
    maxHeight:    '85vh'
  },
  empty: {
    background:     '#0f172a',
    borderRadius:   '12px',
    padding:        '2rem',
    border:         '1px solid #1e293b',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      '200px'
  },
  articleHeader: {
    marginBottom: '12px'
  },
  divider: {
    height:     '1px',
    background: '#1e293b',
    margin:     '12px 0'
  },
  section: {
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize:       '11px',
    fontWeight:     500,
    color:          '#64748b',
    textTransform:  'uppercase',
    letterSpacing:  '0.5px',
    margin:         '0 0 6px'
  },
  sectionText: {
    fontSize:   '12px',
    color:      '#94a3b8',
    margin:     0,
    lineHeight: '1.6'
  },
  retryBtn: {
    fontSize:     '12px',
    color:        '#378ADD',
    background:   'transparent',
    border:       '1px solid #378ADD',
    borderRadius: '6px',
    padding:      '4px 12px',
    cursor:       'pointer',
    marginTop:    '8px'
  }
}
export default DecisionPanel