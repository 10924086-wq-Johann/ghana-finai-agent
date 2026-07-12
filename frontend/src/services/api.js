import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  console.log(`API: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error)
    }
    config.__retryCount = (config.__retryCount || 0) + 1
    console.log(`API retry ${config.__retryCount} for ${config.url}`)
    await new Promise(resolve =>
      setTimeout(resolve, config.__retryCount * 2000)
    )
    return api(config)
  }
)

export const checkHealth     = ()         => api.get('/health')
export const getNews         = (params)   => api.get('/api/news', { params })
export const getMarket       = ()         => api.get('/api/market')
export const getMarketStocks = ()         => api.get('/api/market/stocks')
export const getMarketForex  = ()         => api.get('/api/market/forex')
export const getMarketSummary = ()        => api.get('/api/market/summary')
export const getDecision     = (id)       => api.get(`/api/decision?article_id=${id}`)
export const analyzeAll      = ()         => api.get('/api/analyze/all')
export const sendChat        = (msgs,ctx) => api.post('/api/chat', { messages: msgs, context: ctx })
export const triggerScrape   = ()         => api.post('/api/scraper/trigger')
export const getScraperStatus = ()        => api.get('/api/scraper/status')
export const getConfigStatus  = ()        => api.get('/api/config/status')

// ── Article Filtering by Company (Phase 15 Step 2) ────────────────────
// Company name mappings for article matching
const COMPANY_KEYWORDS = {
  GOIL: ['GOIL', 'GOIL Company', 'fuel distribution', 'petroleum products'],
  GCB: ['GCB', 'Ghana Commercial Bank', 'GCB Bank'],
  EGH: ['Ecobank', 'EGH', 'Ecobank Ghana'],
  SCB: ['Standard Chartered', 'SCB', 'Standard Chartered Ghana', 'StanChart'],
  MTNGH: ['MTN', 'MTN Ghana', 'MTNGH', 'mobile network'],
  CAL: ['CalBank', 'Capital Bank', 'CAL'],
  FML: ['Fan Milk', 'FML', 'dairy', 'ice cream'],
  UNIL: ['Unilever', 'UNIL', 'Unilever Ghana', 'personal care'],
  TOTAL: ['TotalEnergies', 'TOTAL', 'Total Ghana', 'oil and gas'],
  SOGEGH: ['Societe Generale', 'SOGEGH', 'SG Ghana'],
}

export const getArticlesByCompany = (symbol, allArticles) => {
  /**
   * Filter articles that mention a specific company by symbol.
   * 
   * Args:
   *   symbol (string): Company symbol (e.g., 'GOIL', 'GCB', 'MTN')
   *   allArticles (array): Array of article objects to filter
   * 
   * Returns:
   *   array: Articles mentioning the company, sorted by date (newest first)
   */
  if (!symbol || !allArticles || allArticles.length === 0) {
    return []
  }

  const keywords = COMPANY_KEYWORDS[symbol] || [symbol]
  
  const filtered = allArticles.filter(article => {
    if (!article) return false
    
    const titleLower = (article.title || '').toLowerCase()
    const summaryLower = (article.summary || '').toLowerCase()
    const contentLower = (article.content || '').toLowerCase()
    const searchText = `${titleLower} ${summaryLower} ${contentLower}`
    
    // Check if any keyword matches
    return keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    )
  })

  // Sort by published date (newest first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.published || 0)
    const dateB = new Date(b.published || 0)
    return dateB - dateA
  })
}

export const calculateCompanySentiment = (articles) => {
  /**
   * Calculate overall sentiment distribution for a list of articles.
   * 
   * Args:
   *   articles (array): Articles to analyze
   * 
   * Returns:
   *   object: Sentiment statistics {positive, negative, neutral, score, mood}
   */
  if (!articles || articles.length === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0,
      score: 50,
      mood: 'NEUTRAL',
    }
  }

  const positive = articles.filter(a => a.sentiment === 'positive').length
  const negative = articles.filter(a => a.sentiment === 'negative').length
  const neutral = articles.filter(a => a.sentiment === 'neutral').length
  const total = articles.length

  const score = (positive / total) * 100
  const mood = score > 60 ? 'BULLISH' : score < 40 ? 'BEARISH' : 'NEUTRAL'

  return {
    positive,
    negative,
    neutral,
    total,
    score: Math.round(score),
    mood,
  }
}

export default api