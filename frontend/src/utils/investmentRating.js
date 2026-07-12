export const calculateInvestmentRating = (action, confidence, sentiment, newsQuality, priceChange) => {
  /**
   * Calculate investment worthiness rating (1-5 stars).
   */
  
  let stars = 2.5
  let worthy = false
  
  // BUY recommendations
  if (action === 'BUY') {
    stars = 3.5
    if (confidence > 75) stars = 4
    if (confidence > 85) stars = 4.5
    if (confidence > 90) stars = 5
    worthy = confidence > 65
  }
  // SELL recommendations
  else if (action === 'SELL') {
    stars = 2
    if (confidence > 75) stars = 1.5
    worthy = false
  }
  // HOLD recommendations
  else if (action === 'HOLD') {
    stars = 3
    worthy = confidence > 60 && newsQuality > 0.4
  }
  // WATCH recommendations
  else if (action === 'WATCH') {
    stars = 3.2
    worthy = false
  }
  
  // Adjust for news quality
  if (newsQuality < 0.2) stars = Math.max(1, stars - 1)
  else if (newsQuality < 0.3) stars = Math.max(1, stars - 0.5)
  
  // Adjust for price momentum extremes
  if (Math.abs(priceChange) > 5) {
    if (priceChange > 0 && action === 'BUY') stars = Math.min(5, stars + 0.3)
    if (priceChange < 0 && action === 'SELL') stars = Math.max(1, stars - 0.3)
  }
  
  const rating = Math.round(stars * 10) / 10
  
  return {
    stars: rating,
    display: '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '✨' : ''),
    worthy,
    category: getCategoryName(action, worthy),
  }
}

export const getCategoryName = (action, worthy) => {
  if (action === 'BUY' && worthy) return '✅ WORTHY TO INVEST'
  if (action === 'BUY') return '⚠️ CONSIDER WITH CAUTION'
  if (action === 'SELL') return '❌ NOT RECOMMENDED'
  if (action === 'WATCH') return '👁️ MONITOR & ANALYZE'
  return '⏸️ HOLD POSITION'
}

export const getInvestmentSummary = (action, worthyToInvest, sentiment, positiveCount, negativeCount, confidence) => {
  if (action === 'BUY' && worthyToInvest) {
    return `Strong investment opportunity. ${positiveCount} bullish signal${positiveCount > 1 ? 's' : ''} and ${sentiment.score}% positive sentiment suggest upside potential. Confidence: ${confidence}%.`
  }
  if (action === 'BUY') {
    return `Moderate buy signal with ${positiveCount} positive article${positiveCount > 1 ? 's' : ''}. Consider position sizing given ${confidence}% confidence level.`
  }
  if (action === 'SELL') {
    return `Downside risk indicated by ${negativeCount} concerning article${negativeCount > 1 ? 's' : ''}. ${sentiment.score}% sentiment score suggests reducing exposure.`
  }
  if (action === 'WATCH') {
    return `Mixed signals require monitoring. With ${positiveCount} positive vs ${negativeCount} negative articles, await clarity before acting.`
  }
  return `Neutral market conditions. ${sentiment.score}% sentiment reflects balanced outlook. Hold and reassess as new information emerges.`
}

export const getInvestmentStrategy = (action, confidence) => {
  if (action === 'BUY' && confidence > 80) {
    return {
      entryStrategy: 'Aggressive - buy immediately or on any dip below current price',
      targetPrice: 'Up 5-8% from current level (3-month outlook)',
      stopLoss: 'Below 2-3% of entry price',
      positionSize: 'Up to 5% of portfolio',
    }
  }
  if (action === 'BUY') {
    return {
      entryStrategy: 'Gradual - dollar-cost average into position',
      targetPrice: 'Up 3-5% from current level',
      stopLoss: 'Below 3-4% of entry price',
      positionSize: 'Up to 3% of portfolio',
    }
  }
  if (action === 'SELL') {
    return {
      exitStrategy: 'Reduce or close position on any strength',
      targetPrice: 'Down 3-5% from current level',
      stopLoss: 'Above 2-3% if holding',
      positionSize: 'Exit 50-100% of holdings',
    }
  }
  return {
    strategy: 'Hold current position and monitor',
    targetPrice: 'Within +/- 2% of current price',
    stopLoss: 'Below 5% of entry price',
    positionSize: 'Maintain current position size',
  }
}