import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:8000'
let socket = null

export function connectSocket(callbacks = {}) {
  const { onNewAlert, onConnect, onDisconnect, onMarketUpdate, onScraperUpdate } = callbacks

  socket = io(SOCKET_URL, {
    transports:          ['websocket', 'polling'],
    reconnection:        true,
    reconnectionDelay:   3000,
    reconnectionAttempts: 10,
    timeout:             10000
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    if (onConnect) onConnect(socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
    if (onDisconnect) onDisconnect(reason)
  })

  socket.on('connected', (data) => {
    console.log('Server confirmed:', data.message)
  })

  socket.on('new_alert', (data) => {
    console.log('New alert:', data.title)
    if (onNewAlert) onNewAlert(data)
  })

  socket.on('market_update', (data) => {
    if (onMarketUpdate) onMarketUpdate(data)
  })

  socket.on('scraper_update', (data) => {
    console.log('Scraper update:', data)
    if (onScraperUpdate) onScraperUpdate(data)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}

export function isConnected() {
  return socket?.connected || false
}