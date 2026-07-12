import { useState, useEffect, lazy, Suspense } from 'react'
import { checkHealth } from '../services/api'
import { isConnected } from '../services/socket'
import { useTheme } from '../context/ThemeContext'
import Navbar       from '../components/Navbar'
import MarketBanner from '../components/MarketBanner'

const MarketChart   = lazy(() => import('../components/MarketChart'))
const AlertFeed     = lazy(() => import('../components/AlertFeed'))
const DecisionPanel = lazy(() => import('../components/DecisionPanel'))
const ChatBot       = lazy(() => import('../components/ChatBot'))
const SettingsPanel = lazy(() => import('../components/SettingsPanel'))

function LoadingCard() {
  const { theme } = useTheme()
  return (
    <div style={{
      background:     theme.cardBg,
      borderRadius:   '12px',
      border:         `1px solid ${theme.border}`,
      padding:        '2rem',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '200px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width:        '32px',
          height:       '32px',
          borderRadius: '50%',
          border:       `2px solid ${theme.border2}`,
          borderTop:    `2px solid ${theme.blue}`,
          animation:    'spin 0.8s linear infinite',
          margin:       '0 auto 12px'
        }} />
        <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>
          Loading...
        </p>
      </div>
    </div>
  )
}

function Dashboard() {
  const { theme }                               = useTheme()
  const [activeTab, setActiveTab]               = useState('dashboard')
  const [backendStatus, setBackendStatus]       = useState('Checking...')
  const [socketConnected, setSocketConnected]   = useState(false)
  const [selectedArticle, setSelectedArticle]   = useState(null)
  const [marketContext, setMarketContext]        = useState({})

  useEffect(() => {
    checkHealth()
      .then(() => {
        setBackendStatus('✅ API Online')
        setSocketConnected(true)
      })
      .catch(() => setBackendStatus('❌ Offline'))

    const interval = setInterval(() => {
      setSocketConnected(isConnected())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{
              display:             'grid',
              gridTemplateColumns: '1fr 360px 320px',
              gap:                 '1rem',
              padding:             '1rem 1.5rem',
              alignItems:          'start'
            }}>
              <Suspense fallback={<LoadingCard />}>
                <MarketChart />
              </Suspense>
              <Suspense fallback={<LoadingCard />}>
                <AlertFeed onArticleSelect={setSelectedArticle} />
              </Suspense>
              <Suspense fallback={<LoadingCard />}>
                <DecisionPanel article={selectedArticle} />
              </Suspense>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <Suspense fallback={<LoadingCard />}>
                <ChatBot marketContext={marketContext} />
              </Suspense>
            </div>
          </>
        )
      case 'market':
        return (
          <div style={{ padding: '1rem 1.5rem' }}>
            <Suspense fallback={<LoadingCard />}>
              <MarketChart />
            </Suspense>
          </div>
        )
      case 'alerts':
        return (
          <div style={{
            display:             'grid',
            gridTemplateColumns: '1fr 360px',
            gap:                 '1rem',
            padding:             '1rem 1.5rem',
            alignItems:          'start'
          }}>
            <Suspense fallback={<LoadingCard />}>
              <AlertFeed onArticleSelect={setSelectedArticle} />
            </Suspense>
            <Suspense fallback={<LoadingCard />}>
              <DecisionPanel article={selectedArticle} />
            </Suspense>
          </div>
        )
      case 'chat':
        return (
          <div style={{ padding: '1rem 1.5rem' }}>
            <Suspense fallback={<LoadingCard />}>
              <ChatBot marketContext={marketContext} />
            </Suspense>
          </div>
        )
      case 'settings':
        return (
          <div style={{ padding: '1rem 1.5rem' }}>
            <Suspense fallback={<LoadingCard />}>
              <SettingsPanel />
            </Suspense>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{
      background: theme.pageBg,
      minHeight:  '100vh',
      color:      theme.textPrimary
    }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendStatus={backendStatus}
        socketConnected={socketConnected}
      />
      <MarketBanner />
      {renderContent()}
    </div>
  )
}

export default Dashboard