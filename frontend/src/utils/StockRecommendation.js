/**
 * Stock Recommendation Engine
 * Generates investment recommendations based on:
 * - Company news sentiment
 * - Price movement
 * - Market conditions
 * - Historical patterns
 */

export const generateStockRecommendation = (stock, articles, sentiment) => {
  /**
   * Generate investment recommendation for a stock.
   * 
   * Args:
   *   stock (object): Stock data {symbol, price, change_pct, volume}
   *   articles (array): Recent articles about the company
   *   sentiment (object): Sentiment analysis {positive, negative, neutral, score, mood}
   * 
   * Returns:
   *   object: Recommendation {action, confidence, risk, rationale, worthyToInvest, rating}
   */

  if (!stock || !sentiment) {
    return getDefaultRecommendation()
  }

  const priceChange = stock.change_pct || 0
  const positiveCount = sentiment.positive || 0
  const negativeCount = sentiment.negative || 0
  const totalArticles = sentiment.total || 0
  const sentimentScore = sentiment.score || 50

  // Calculate news quality score (0-1)
  let newsQuality = 0.5
  if (totalArticles > 0) {
    newsQuality = positiveCount / totalArticles
  }

  // Determine recommendation based on multiple factors
  let action = 'HOLD'
  let confidence = 50
  let risk = 'MEDIUM'
  let rationale = []

  // ── Factor 1: Sentiment Analysis ──
  if (sentimentScore > 70) {
    // Strongly positive
    rationale.push(`Strong positive sentiment (${sentimentScore}%) from ${positiveCount} bullish articles`)
    if (priceChange > 0) {
      action = 'BUY'
      confidence = Math.min(90, 70 + (sentimentScore - 70) * 0.5)
      risk = 'LOW'
    } else if (priceChange > -1) {
      action = 'BUY'
      confidence = Math.min(85, 65 + (sentimentScore - 70) * 0.4)
      risk = 'LOW'
    } else {
      action = 'WATCH'
      confidence = 70
      risk = 'MEDIUM'
      rationale.push('Positive news but stock down slightly - potential entry point')
    }
  } else if (sentimentScore > 55) {
    // Moderately positive
    rationale.push(`Positive sentiment (${sentimentScore}%) with ${positiveCount} positive articles`)
    if (priceChange > 1) {
      action = 'BUY'
      confidence = Math.min(80, 60 + positiveCount * 8)
      risk = 'LOW'
    } else if (priceChange > -0.5) {
      action = 'BUY'
      confidence = Math.min(75, 55 + positiveCount * 7)
      risk = 'MEDIUM'
    } else {
      action = 'HOLD'
      confidence = 60
      risk = 'MEDIUM'
    }
  } else if (sentimentScore > 45) {
    // Neutral
    rationale.push(`Neutral sentiment (${sentimentScore}%) - mixed market signals`)
    if (priceChange > 2) {
      action = 'BUY'
      confidence = 60
      risk = 'MEDIUM'
      rationale.push('Stock showing strong momentum despite neutral news')
    } else if (priceChange < -2) {
      action = 'WATCH'
      confidence = 65
      risk = 'MEDIUM'
      rationale.push('Stock declining despite neutral sentiment - caution advised')
    } else {
      action = 'HOLD'
      confidence = 55
      risk = 'MEDIUM'
    }
  } else if (sentimentScore > 30) {
    // Moderately negative
    rationale.push(`Negative sentiment (${sentimentScore}%) with ${negativeCount} concerning articles`)
    if (priceChange > 1) {
      action = 'WATCH'
      confidence = 65
      risk = 'MEDIUM'
      rationale.push('Price resilient despite negative news - watch for reversal')
    } else if (priceChange < -1) {
      action = 'SELL'
      confidence = Math.min(75, 55 + negativeCount * 7)
      risk = 'HIGH'
    } else {
      action = 'HOLD'
      confidence = 50
      risk = 'MEDIUM'
    }
  } else {
    // Strongly negative
    rationale.push(`Strong negative sentiment (${sentimentScore}%) from ${negativeCount} bearish articles`)
    action = 'SELL'
    confidence = Math.min(85, 65 + negativeCount * 8)
    risk = 'HIGH'
    
    if (priceChange < -2) {
      rationale.push('Stock declining sharply - downside pressure likely to continue')
    }
  }

  // ── Factor 2: News Volume & Recency ──
  if (totalArticles > 5) {
    rationale.push(`High news volume (${totalArticles} recent articles) indicates market interest`)
  } else if (totalArticles === 0) {
    rationale.push('No recent news coverage - limited visibility')
    confidence -= 10
  }

  // ── Factor 3: Price Momentum ──
  if (priceChange > 3) {
    rationale.push('Strong positive price momentum (+3% or more)')
    confidence = Math.min(95, confidence + 5)
  } else if (priceChange > 1) {
    rationale.push('Positive price momentum')
    confidence = Math.min(90, confidence + 3)
  } else if (priceChange < -3) {
    rationale.push('Strong negative price momentum (-3% or more)')
    confidence = Math.min(85, confidence + 5)
    if (action !== 'SELL') action = 'WATCH'
  } else if (priceChange < -1) {
    rationale.push('Negative price momentum')
    if (action === 'BUY' && confidence < 70) {
      action = 'HOLD'
    }
  }

  // ── Calculate Rating ──
  const rating = calculateRating(action, confidence, newsQuality)

  // ── Determine if Worthy to Invest ──
  const worthyToInvest = action === 'BUY' && confidence > 65 && risk !== 'CRITICAL'

  // ── Generate Summary ──
  const summary = generateSummary(action, worthyToInvest, sentimentScore, positiveCount, negativeCount)

  return {
    action,
    confidence: Math.round(confidence),
    risk,
    rationale: rationale.join('. ') || 'Market conditions are neutral',
    worthyToInvest,
    rating,
    summary,
    timestamp: new Date().toISOString(),
  }
}

export const calculateRating = (action, confidence, newsQuality) => {
  /**
   * Calculate star rating (1-5) based on recommendation quality.
   */
  let stars = 2.5

  if (action === 'BUY') {
    stars = 3.5
    if (confidence > 75) stars = 4
    if (confidence > 85) stars = 4.5
    if (confidence > 90) stars = 5
  } else if (action === 'SELL') {
    stars = 2
    if (confidence > 75) stars = 1.5
  } else if (action === 'HOLD') {
    stars = 3
  } else if (action === 'WATCH') {
    stars = 3
    if (confidence > 70) stars = 3.2
  }

  // Adjust based on news quality
  if (newsQuality < 0.3) stars = Math.max(1, stars - 0.5)

  return Math.round(stars * 10) / 10 // Round to 1 decimal
}

export const generateSummary = (action, worthyToInvest, sentimentScore, positive, negative) => {
  /**
   * Generate a brief investment summary.
   */
  let summary = ''

  if (action === 'BUY') {
    summary = `This stock presents a strong investment opportunity. ${positive} positive article${positive > 1 ? 's' : ''} and market sentiment of ${sentimentScore}% suggest growth potential and upside momentum.`
  } else if (action === 'SELL') {
    summary = `Market sentiment and recent news suggest downside risk. ${negative} concerning article${negative > 1 ? 's' : ''} indicate potential challenges ahead. Consider reducing exposure.`
  } else if (action === 'WATCH') {
    summary = `Mixed market signals warrant careful monitoring. While ${positive} positive signal${positive > 1 ? 's' : ''} exist, the overall sentiment (${sentimentScore}%) suggests caution. Wait for clearer direction.`
  } else {
    summary = `Market conditions are neutral with balanced sentiment (${sentimentScore}%). Current news and price action don't provide a clear directional signal. Hold existing positions and monitor for developments.`
  }

  return summary
}

export const getDefaultRecommendation = () => {
  /**
   * Return default recommendation when data is insufficient.
   */
  return {
    action: 'HOLD',
    confidence: 50,
    risk: 'MEDIUM',
    rationale: 'Insufficient data to generate recommendation',
    worthyToInvest: false,
    rating: 3,
    summary: 'Not enough information available. Please check back when more articles are published.',
    timestamp: new Date().toISOString(),
  }
}

export const getRiskLevel = (confidence, articleCount, priceChange) => {
  /**
   * Determine risk level based on multiple factors.
   */
  let risk = 'MEDIUM'

  if (confidence > 80 && articleCount > 3 && Math.abs(priceChange) < 2) {
    risk = 'LOW'
  } else if (confidence < 60 || articleCount < 2 || Math.abs(priceChange) > 3) {
    risk = 'HIGH'
  } else if (Math.abs(priceChange) > 5) {
    risk = 'CRITICAL'
  }

  return risk
}

export const getInvestmentCategory = (action) => {
  /**
   * Categorize investment by action type.
   */
  const categories = {
    BUY: 'Growth / Entry Point',
    SELL: 'Risk Reduction / Exit',
    HOLD: 'Maintain Position',
    WATCH: 'Monitor & Analyze',
    AVOID: 'High Risk / Skip',
  }
  return categories[action] || 'Neutral'
}

export const getActionColor = (action) => {
  /**
   * Get color for action (for UI styling).
   */
  const colors = {
    BUY: '#1D9E75',    // Green
    SELL: '#E24B4A',   // Red
    HOLD: '#94A3B8',   // Gray
    WATCH: '#FF9800',  // Orange
    AVOID: '#E24B4A',  // Red
  }
  return colors[action] || '#94A3B8'
}

export const getActionIcon = (action) => {
  /**
   * Get emoji icon for action.
   */
  const icons = {
    BUY: '📈',
    SELL: '📉',
    HOLD: '⏸',
    WATCH: '👁',
    AVOID: '🚫',
  }
  return icons[action] || '📊'
}