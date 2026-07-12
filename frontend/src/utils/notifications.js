export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications')
    return false
  }
  if (Notification.permission === 'granted') {
    return true
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted')
      }
    })
  }
  return false
}

export function sendNotification(title, options = {}) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const defaultOptions = {
    icon:  '/favicon.ico',
    badge: '/favicon.ico',
    tag:   'ghana-finai',
    ...options
  }

  const notification = new Notification(title, defaultOptions)

  notification.onclick = () => {
    window.focus()
    notification.close()
  }

  setTimeout(() => notification.close(), 8000)
}

export function notifyNewAlert(article) {
  const sentiment = article.sentiment?.toUpperCase() || 'NEUTRAL'
  const riskIcon = 
    article.fraud_risk === 'high' ? '🚨' :
    article.priority === 'critical' ? '⚠️' :
    article.priority === 'high' ? '🔥' :
    '📰'

  sendNotification(
    `${riskIcon} ${sentiment} | ${article.source}`,
    {
      body: article.title.slice(0, 80),
      tag: article.id,
      requireInteraction: article.priority === 'critical'
    }
  )
}

export function notifyMarketAlert(mood) {
  const icon =
    mood.overall_mood === 'OPTIMISTIC' ? '📈' :
    mood.overall_mood === 'BEARISH' ? '📉' :
    '⚠️'

  sendNotification(
    `${icon} Market Mood: ${mood.overall_mood}`,
    {
      body: mood.signals?.slice(0, 2).join(' • '),
      tag: 'market-mood'
    }
  )
}