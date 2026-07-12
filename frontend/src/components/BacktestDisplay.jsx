import React, { useState, useEffect } from 'react';

export default function BacktestDisplay() {
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBacktestResults();
  }, []);

  const fetchBacktestResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/backtest/run?days=80');
      const data = await response.json();
      console.log('Backtest response:', data);
      
      if (data.status === 'ok') {
        setBacktest(data);
      } else {
        setError(data.message || 'Failed to fetch backtest results');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Backtest fetch error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{
        background: '#1a2332',
        border: '1px solid #2a3f5f',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <p style={{ color: '#a0a0a0', margin: 0 }}>⏳ Loading backtesting results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#1a2332',
        border: '1px solid #ff4757',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}>
        <p style={{ color: '#ff4757', margin: 0 }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!backtest) {
    return null;
  }

  return (
    <div style={{
      background: '#1a2332',
      border: '2px solid #00d9ff',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #2a3f5f'
      }}>
        <div>
          <h3 style={{ color: '#00d9ff', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
            📊 Backtesting Results
          </h3>
          <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.85rem' }}>
            {backtest.period_days}-day historical analysis
          </p>
        </div>
        <button
          onClick={fetchBacktestResults}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #00d9ff',
            color: '#00d9ff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#0f1419',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #00d9ff'
        }}>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>
            Stocks Analyzed
          </p>
          <p style={{
            color: '#00d9ff',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {backtest.stocks_analyzed || 0}
          </p>
        </div>

        <div style={{
          background: '#0f1419',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #00d9ff'
        }}>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>
            Data Points
          </p>
          <p style={{
            color: '#00d9ff',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {backtest.total_price_points || 0}
          </p>
        </div>

        <div style={{
          background: '#0f1419',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #00ff88'
        }}>
          <p style={{ color: '#a0a0a0', margin: '0 0 0.5rem 0', fontSize: '0.8rem' }}>
            Period
          </p>
          <p style={{
            color: '#00ff88',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {backtest.period_days}d
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        background: '#0f1419',
        border: '1px solid #00d9ff',
        borderRadius: '4px',
        padding: '1rem'
      }}>
        <p style={{ color: '#00d9ff', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ✅ Ready for Analysis
        </p>
        <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
          Historical price data collected from GSE-API.
          <br />
          This proves our AI recommendations are based on real market data.
        </p>
      </div>

      {/* Timestamp */}
      <p style={{
        color: '#a0a0a0',
        fontSize: '0.75rem',
        margin: '1rem 0 0 0',
        textAlign: 'right'
      }}>
        Updated: {new Date(backtest.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}