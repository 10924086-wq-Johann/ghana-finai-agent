import { useTheme } from '../context/ThemeContext'

function Navbar({ activeTab, onTabChange, backendStatus, socketConnected }) {
  const { theme, themeName, toggleTheme } = useTheme()

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'market',    label: '📈 Market'    },
    { key: 'alerts',    label: '🔔 Alerts'    },
    { key: 'chat',      label: '💬 Assistant' },
    { key: 'settings',  label: '⚙️ Settings'  },
  ]

  return (
    <nav style={{
      background:     theme.navBg,
      borderBottom:   `1px solid ${theme.border}`,
      padding:        '0 1.5rem',
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      height:         '52px',
      position:       'sticky',
      top:            0,
      zIndex:         100
    }}>

      {/* Logo + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontSize:   '18px',
          fontWeight: 600,
          color:      theme.textPrimary,
          display:    'flex',
          alignItems: 'center',
          gap:        '8px'
        }}>
          🇬🇭
          <span>Ghana FinAI</span>
          <span style={{
            fontSize:     '10px',
            background:   `${theme.green}30`,
            color:        theme.green,
            padding:      '2px 6px',
            borderRadius: '4px',
            fontWeight:   400
          }}>
            LIVE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2px', marginLeft: '16px' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                fontSize:     '12px',
                padding:      '6px 14px',
                borderRadius: '6px',
                border:       'none',
                background:   activeTab === tab.key
                  ? theme.cardBg2 : 'transparent',
                color:        activeTab === tab.key
                  ? theme.textPrimary : theme.textMuted,
                cursor:       'pointer',
                fontWeight:   activeTab === tab.key ? 500 : 400,
                transition:   'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={themeName === 'dark'
            ? 'Switch to light mode'
            : 'Switch to dark mode'}
          style={{
            fontSize:     '16px',
            background:   theme.cardBg2,
            border:       `1px solid ${theme.border}`,
            borderRadius: '6px',
            padding:      '4px 8px',
            cursor:       'pointer',
            color:        theme.textPrimary
          }}
        >
          {themeName === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* WebSocket status */}
        <span style={{
          fontSize:     '10px',
          color:        socketConnected ? theme.green : theme.textDim,
          background:   socketConnected
            ? `${theme.green}15` : theme.cardBg2,
          padding:      '3px 8px',
          borderRadius: '20px',
          border:       `1px solid ${
            socketConnected ? `${theme.green}30` : theme.border2
          }`
        }}>
          {socketConnected ? '● WebSocket Live' : '○ Connecting...'}
        </span>

        {/* Backend status */}
        <span style={{
          fontSize:     '10px',
          background:   theme.cardBg2,
          padding:      '3px 8px',
          borderRadius: '20px',
          color:        backendStatus.includes('✅')
            ? theme.green : theme.red
        }}>
          {backendStatus}
        </span>
      </div>
    </nav>
  )
}

export default Navbar