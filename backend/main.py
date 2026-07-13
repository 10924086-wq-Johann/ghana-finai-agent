from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_ERROR
from dotenv import load_dotenv
from datetime import datetime
import os
import sys
import asyncio
import socketio

backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)
sys.path.extend([root_dir, backend_dir])
load_dotenv()

from scraper.news_scraper import (
    run_all_scrapers,
    get_cached_articles,
    get_article_by_id,
    article_cache
)
from models.pipeline import (
    analyze_article,
    analyze_batch_articles,
    get_market_summary
)
from models.chat import generate_chat_response
from models.decision import generate_investment_decision, get_decision_stats
from models.market import get_full_market_data
from alerts.socket_manager import (
    sio,
    broadcast_new_alert,
    broadcast_scraper_update,
    get_connected_count
)

NEWSAPI_KEY        = os.getenv("NEWSAPI_KEY")
GNEWS_API_KEY      = os.getenv("GNEWS_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
ALPHA_VANTAGE_KEY  = os.getenv("ALPHA_VANTAGE_KEY")
SCRAPER_INTERVAL   = int(os.getenv("SCRAPER_INTERVAL_MINUTES", "6"))

app = FastAPI(
    title="Ghana FinAI Agent API",
    description="AI-powered financial intelligence for Ghanaian markets",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Socket.IO ───────────────────────────────
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# ── Scheduler ─────────────────────────────────────
scheduler = BackgroundScheduler(timezone="Africa/Accra")
scraper_stats = {
    "last_run":   None,
    "last_count": 0,
    "total_runs": 0,
    "next_run":   None,
    "status":     "idle"
}

def scheduled_scrape():
    scraper_stats["status"] = "running"
    print(f"\n[Scheduler] Cycle #{scraper_stats['total_runs']+1} starting...")
    try:
        new_articles = run_all_scrapers()
        if new_articles:
            print(f"[Scheduler] Running AI pipeline on {len(new_articles)} articles...")
            analyze_batch_articles(new_articles)
            for article in new_articles:
                try:
                    asyncio.run_coroutine_threadsafe(
                        broadcast_new_alert(article),
                        asyncio.get_event_loop()
                    )
                except Exception as e:
                    print(f"[Socket] {len(new_articles)} articles ready for broadcast")

        scraper_stats["last_run"]    = datetime.now().isoformat()
        scraper_stats["last_count"]  = len(new_articles)
        scraper_stats["total_runs"] += 1
        scraper_stats["status"]      = "ok"
        job = scheduler.get_job("news_scraper")
        if job:
            scraper_stats["next_run"] = job.next_run_time.isoformat()
        print(f"[Scheduler] Cycle done")
    except Exception as e:
        scraper_stats["status"] = f"error: {str(e)}"
        print(f"[Scheduler] Error: {e}")

        scraper_stats["last_run"]    = datetime.now().isoformat()
        scraper_stats["last_count"]  = len(new_articles)
        scraper_stats["total_runs"] += 1
        scraper_stats["status"]      = "ok"
        job = scheduler.get_job("news_scraper")
        if job:
            scraper_stats["next_run"] = job.next_run_time.isoformat()
        print(f"[Scheduler] Cycle done")
    except Exception as e:
        scraper_stats["status"] = f"error: {str(e)}"
        print(f"[Scheduler] Error: {e}")

def on_job_event(event):
    if event.exception:
        print(f"[Scheduler] Job failed: {event.exception}")

@app.on_event("startup")
async def startup():
    print("\n" + "="*50)
    print("  Ghana FinAI Agent starting up...")
    print("="*50)
    scheduled_scrape()
    scheduler.add_job(
        scheduled_scrape,
        trigger="interval",
        minutes=SCRAPER_INTERVAL,
        id="news_scraper",
        replace_existing=True
    )
    scheduler.add_listener(on_job_event, EVENT_JOB_ERROR)
    scheduler.start()
    job = scheduler.get_job("news_scraper")
    if job:
        scraper_stats["next_run"] = job.next_run_time.isoformat()
    print(f"\n[Startup] Scheduler running — every {SCRAPER_INTERVAL} min")
    print(f"[Startup] Next scrape: {scraper_stats['next_run']}")
    print("="*50 + "\n")

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown(wait=False)
    print("[Shutdown] Scheduler stopped")

# ── Core endpoints ────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Ghana FinAI Agent API is running",
        "version": "1.0.0",
        "total_articles": len(article_cache)
    }

@app.get("/health")
def health():
    return {
        "status":          "ok",
        "service":         "Ghana FinAI Agent",
        "articles_cached": len(article_cache),
        "scraper":         scraper_stats,
        "websocket_clients": get_connected_count()
    }

# ── News endpoints ────────────────────────────────
@app.get("/api/news")
def get_news(
    limit:  int = Query(default=50, le=200),
    source: str = Query(default=None),
    sector: str = Query(default=None)
):
    articles = get_cached_articles(limit=200)
    if source:
        articles = [a for a in articles if source.lower() in a.get("source","").lower()]
    if sector:
        articles = [a for a in articles if a.get("sector","").lower() == sector.lower()]
    return {"status":"ok","count":len(articles[:limit]),"articles":articles[:limit]}

@app.get("/api/news/{article_id}")
def get_single_article(article_id: str):
    article = get_article_by_id(article_id)
    if not article:
        return {"status":"error","message":"Article not found"}
    return {"status":"ok","article":article}

# ── Analysis endpoints ────────────────────────────
@app.get("/api/analyze/all")
def analyze_all():
    articles = get_cached_articles(limit=200)
    analyzed = analyze_batch_articles(articles)
    summary  = get_market_summary(analyzed)
    return {"status":"ok","summary":summary,"count":len(analyzed)}

@app.post("/api/analyze")
def analyze_single(payload: dict):
    article_id = payload.get("article_id")
    text       = payload.get("text","")
    if article_id:
        article = get_article_by_id(article_id)
        if not article:
            return {"status":"error","message":"Article not found"}
    else:
        article = {"id":"temp","title":text[:100],"summary":text,"content":text}
    result = analyze_article(article)
    return {"status":"ok","article":result}

# ── Market endpoints ──────────────────────────────
@app.get("/api/market")
def get_market():
    return get_full_market_data()

@app.get("/api/market/stocks")
def get_stocks():
    data = get_full_market_data()
    return {
        "status":       "ok",
        "stocks":       data.get("stocks",[]),
        "top_gainers":  data.get("top_gainers",[]),
        "top_losers":   data.get("top_losers",[]),
        "trading":      data.get("trading",{}),
        "last_updated": data.get("last_updated","")
    }

@app.get("/api/market/forex")
def get_forex():
    data = get_full_market_data()
    return {"status":"ok","forex":data.get("forex",{}),"tbills":data.get("tbills",{})}

@app.get("/api/market/summary")
def get_market_summary_endpoint():
    market_data = get_full_market_data()
    articles    = get_cached_articles(limit=200)
    ai_summary  = get_market_summary(articles)
    return {
        "status":        "ok",
        "market":        market_data,
        "sentiment":     ai_summary,
        "combined_mood": _get_combined_mood(market_data, ai_summary)
    }

def _get_combined_mood(market_data: dict, ai_summary: dict) -> dict:
    news_mood   = ai_summary.get("mood", "neutral")
    fraud_count = ai_summary.get("fraud_count", 0)
    forex       = market_data.get("forex", {})
    usd_ghs     = forex.get("USD_GHS", 15.0)
    trading     = market_data.get("trading", {})

    signals = []
    if news_mood == "bearish":
        signals.append("News sentiment is negative")
    elif news_mood == "bullish":
        signals.append("News sentiment is positive")
    if usd_ghs > 15:
        signals.append(f"Cedi under pressure (USD/GHS: {usd_ghs})")
    elif usd_ghs < 12:
        signals.append(f"Cedi strengthening (USD/GHS: {usd_ghs})")
    if fraud_count > 0:
        signals.append(f"{fraud_count} fraud alert(s) detected")
    if not trading.get("is_open"):
        signals.append("GSE market is currently closed")

    if news_mood == "bullish" and usd_ghs < 13:
        overall = "OPTIMISTIC"
    elif news_mood == "bearish" or fraud_count > 2:
        overall = "BEARISH"
    else:
        overall = "CAUTIOUS"

    return {
        "overall_mood": overall,
        "signals":      signals,
        "fraud_alerts": fraud_count,
        "usd_ghs_rate": usd_ghs,
        "news_mood":    news_mood,
        "gse_status":   trading.get("status","UNKNOWN")
    }

# ── Decision endpoints ────────────────────────────
@app.get("/api/decision")
def get_decision(article_id: str):
    article = get_article_by_id(article_id)
    if not article:
        return {"status":"error","message":"Article not found"}
    decision = generate_investment_decision(article)
    return {"status":"ok","decision":decision}

@app.get("/api/decision/stats")
def decision_stats():
    return {"status":"ok","stats":get_decision_stats()}

# ── Scraper endpoints ─────────────────────────────
@app.get("/api/scraper/status")
def scraper_status():
    job = scheduler.get_job("news_scraper")
    return {
        "status":         scraper_stats["status"],
        "last_run":       scraper_stats["last_run"],
        "last_new_count": scraper_stats["last_count"],
        "total_runs":     scraper_stats["total_runs"],
        "next_run":       job.next_run_time.isoformat() if job else None,
        "interval":       f"{SCRAPER_INTERVAL} minutes",
        "total_cached":   len(article_cache)
    }

@app.post("/api/scraper/trigger")
def trigger_scrape():
    scheduled_scrape()
    return {"status":"ok","message":"Scrape triggered","articles":len(article_cache)}

# ── WebSocket status ──────────────────────────────
@app.get("/api/socket/status")
def socket_status():
    return {
        "status":    "ok",
        "connected": get_connected_count(),
        "message":   "WebSocket running on same port"
    }

@app.post("/api/chat")
async def chat(payload: dict):
    messages = payload.get("messages", [])
    context  = payload.get("context", {})
    reply    = await generate_chat_response(messages, context)
    return {"status": "ok", "reply": reply}


@app.post("/api/scraper/update-tbills")
async def update_tbills(payload: dict):
    """
    Manual endpoint to update T-bill rates.
    POST with: {"91_day": 24.50, "182_day": 25.80, "364_day": 26.90}
    """
    from models.market import update_tbill_rates
    result = update_tbill_rates(payload)
    return result

# ── Backtesting endpoint ──────────────────────────
@app.get("/api/backtest/run")
def run_backtest_endpoint(days: int = Query(default=80, le=365)):
    """Run backtesting over N days of historical price data"""
    from models.backtest import run_backtest_simple
    result = run_backtest_simple(days=days)
    return result


# ── Config status ─────────────────────────────────
@app.get("/api/config/status")
def config_status():
    return {
        "newsapi":          "✅ loaded" if NEWSAPI_KEY else "❌ missing",
        "gnews":            "✅ loaded" if GNEWS_API_KEY else "❌ missing",
        "openrouter":       "✅ loaded" if OPENROUTER_API_KEY else "❌ missing",
        "alpha_vantage":    "✅ loaded" if ALPHA_VANTAGE_KEY else "❌ missing",
        "scraper_interval": f"{SCRAPER_INTERVAL} minutes"
    }
