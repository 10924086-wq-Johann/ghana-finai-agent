import { useState, useEffect, useCallback } from 'react'
import { getNews } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'
import { notifyNewAlert, requestNotificationPermission } from '../utils/notifications'

export function useNewsData() {
  const [articles, setArticles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [lastRefresh, setLastRefresh]   = useState(null)
  const [newCount, setNewCount]         = useState(0)
  const [socketStatus, setSocketStatus] = useState('connecting')
  const [isOnline, setIsOnline]         = useState(navigator.onLine)

  const fetchNews = useCallback(async () => {
    try {
      const res = await getNews()
      setArticles(res.data.articles || [])
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      setError('Could not fetch news')
      console.error('News fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    requestNotificationPermission()
    fetchNews()

    // ── Online/offline detection ──────────────
    const handleOnline = () => {
      console.log('[Network] Back online — refreshing feed')
      setIsOnline(true)
      setError(null)
      // Wait 2 seconds for connection to stabilize then refetch
      setTimeout(() => {
        fetchNews()
      }, 2000)
    }

    const handleOffline = () => {
      console.log('[Network] Gone offline')
      setIsOnline(false)
      setError('No internet connection')
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // ── Socket connection ─────────────────────
    connectSocket({
      onConnect: (id) => {
        setSocketStatus('connected')
      },
      onDisconnect: () => {
        setSocketStatus('disconnected')
      },
      onNewAlert: (article) => {
        setArticles(prev => {
          const exists = prev.find(a => a.id === article.article_id)
          if (exists) return prev
          return [article, ...prev]
        })
        setNewCount(prev => prev + 1)
        notifyNewAlert({
          id:        article.article_id,
          title:     article.title,
          source:    article.source,
          sentiment: article.sentiment,
          priority:  article.priority,
          fraud_risk: article.fraud_risk
        })
      }
    })

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      disconnectSocket()
    }
  }, [fetchNews])

  const clearNewCount = () => setNewCount(0)

  return {
    articles,
    loading,
    error,
    lastRefresh,
    newCount,
    socketStatus,
    isOnline,
    refresh:       fetchNews,
    clearNewCount
  }
}