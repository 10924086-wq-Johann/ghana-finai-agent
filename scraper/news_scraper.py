import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import hashlib
import os
import sys
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")

# ── All Ghanaian Financial News Sources ───────────
RSS_FEEDS = {
    "BFT Online":       "https://thebftonline.com/feed/",
    "Joy Business":     "https://www.myjoyonline.com/category/business/feed/",
    "Citi Business":    "https://citibusinessnews.com/feed/",
    "Ghana Web Business": "https://www.ghanaweb.com/GhanaHomePage/business/business.feed.xml",
    "Graphic Business": "https://www.graphic.com.gh/business/business-news/feed",
    "Modern Ghana":            "https://rss.modernghana.com/default.asp",
    "Daily Guide":      "https://dailyguidenetwork.com/feed/",
    "Ghana Talks Business": "https://ghanatalks.business/feed/",
    "Google News Ghana Finance": "https://news.google.com/rss/search?q=Ghana+finance+economy&hl=en-GH&gl=GH&ceid=GH:en",
    "Google News Bank of Ghana": "https://news.google.com/rss/search?q=Bank+of+Ghana&hl=en-GH&gl=GH&ceid=GH:en",
    "Google News GSE":           "https://news.google.com/rss/search?q=Ghana+Stock+Exchange&hl=en-GH&gl=GH&ceid=GH:en",
}

# ── In-memory article store ────────────────────────
article_cache = {}

# ── Utilities ─────────────────────────────────────

def make_id(url: str) -> str:
    """Create unique ID from URL"""
    return hashlib.md5(url.encode()).hexdigest()

def clean_html(text: str) -> str:
    """Strip HTML tags from text"""
    if not text:
        return ""
    try:
        return BeautifulSoup(text, "html.parser").get_text(separator=" ").strip()
    except:
        return text

def is_recent(date_input, hours: int = 24) -> bool:
    """Check if article is within the last N hours"""
    try:
        if date_input is None:
            return True
        # Handle time.struct_time from feedparser
        if hasattr(date_input, 'tm_year'):
            import calendar
            timestamp = calendar.timegm(date_input)
            pub = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        # Handle string dates
        elif isinstance(date_input, str):
            from email.utils import parsedate_to_datetime
            try:
                pub = parsedate_to_datetime(date_input)
            except:
                return True
        else:
            return True
        now = datetime.now(timezone.utc)
        diff_hours = (now - pub).total_seconds() / 3600
        return diff_hours <= hours
    except Exception as e:
        print(f"Date parse error: {e}")
        return True

def build_article(
    article_id, title, source,
    url, published, summary, content
) -> dict:
    """Build standard article dict"""
    return {
        "id": article_id,
        "title": title.strip() if title else "No title",
        "source": source,
        "url": url,
        "published": published,
        "summary": clean_html(summary)[:500],
        "content": clean_html(content)[:1500],
        "is_today": True,
        "sentiment": None,
        "sentiment_score": None,
        "sector": None,
        "entities": [],
        "decision": None,
        "fraud_risk": "low",
        "analyzed": False,
        "scraped_at": datetime.now(timezone.utc).isoformat()
    }

# ── Scraper 1: RSS Feeds ───────────────────────────


def scrape_rss_feeds() -> list:
    articles = []
    for source, feed_url in RSS_FEEDS.items():
        try:
            print(f"  Scraping RSS: {source}")
            feed = feedparser.parse(feed_url)
            entries_to_process = feed.entries

            # 🛠️ ADVANCED FAULT-TOLERANT FALLBACK ENGINE
            if (feed.bozo and not entries_to_process) or not entries_to_process:
                print(f"  ⚠ RSS parser failed or empty for {source}. Activating backup...")
                try:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    }
                    res = requests.get(feed_url, headers=headers, timeout=12)
                    
                    fallback_entries = []

                   # 🚨 CASE A: THE RSS URL IS COMPLETELY DEAD (HTTP 404)
                    if res.status_code == 404:
                        print(f"  🌐 RSS endpoint is 404 Not Found. Attempting direct HTML scraping fallback...")
                        from urllib.parse import urljoin
                        
                        base_url = "https://thebftonline.com/"
                        main_res = requests.get(base_url, headers=headers, timeout=12)
                        
                        if main_res.status_code == 200:
                            soup = BeautifulSoup(main_res.content, "html.parser")
                            links_found = soup.find_all("a", href=True)
                            print(f"  🔍 Found {len(links_found)} raw links on homepage. Filtering for articles...")
                            
                            for a_tag in links_found:
                                href = a_tag["href"]
                                # Clean up tabs, line breaks, and multi-spaces from headings
                                text = " ".join(a_tag.get_text().split()) 
                                
                                # Seamlessly patch relative links (/story) into absolute URLs (https://...)
                                absolute_url = urljoin(base_url, href)
                                
                                # Standard filter layout for news headlines
                                if (len(text) > 15 and 
                                    base_url in absolute_url and 
                                    not any(x in href.lower() for x in ["/category/", "/tag/", "/wp-content/", "/page/", "/contact", "/about", "/advertise", "/terms"])):
                                    
                                    # Prevent scraping identical headline clusters
                                    if not any(e["link"] == absolute_url for e in fallback_entries):
                                        fallback_entries.append({
                                            "title": text,
                                            "link": absolute_url,
                                            "summary": "Direct HTML fallback article extract.",
                                            "description": "Direct HTML fallback article extract.",
                                            "published": datetime.now(timezone.utc).isoformat(),
                                            "fallback_content": "Content available at source link."
                                        })
                        else:
                            print(f"  ❌ Primary site structure unreachable. Status: {main_res.status_code}")
                            continue
                        
                    # 📄 CASE C: STREAM LOADED BUT WRONG TAG ALIGNMENT
                    else:
                        soup = BeautifulSoup(res.content, "html.parser")
                        items = soup.find_all("item")
                        for item in items:
                            title_tag = item.find("title")
                            link_tag = item.find("link")
                            desc_tag = item.find("description")
                            
                            if link_tag:
                                fallback_entries.append({
                                    "title": title_tag.get_text().strip() if title_tag else "No Title",
                                    "link": link_tag.get_text().strip(),
                                    "summary": desc_tag.get_text().strip() if desc_tag else "",
                                    "description": desc_tag.get_text().strip() if desc_tag else "",
                                    "published": datetime.now(timezone.utc).isoformat(),
                                    "fallback_content": desc_tag.get_text().strip() if desc_tag else ""
                                })

                    entries_to_process = fallback_entries
                    print(f"  ⚡ Fallback recovered {len(entries_to_process)} entries for {source}")
                    
                except Exception as fallback_err:
                    print(f"  ✗ Fallback execution crash for {source}: {fallback_err}")
                    continue

            if not entries_to_process:
                continue

            count = 0
            for entry in entries_to_process[:15]:
                url = entry.get("link", "")
                if not url:
                    continue

                article_id = make_id(url)
                if article_id in article_cache:
                    continue

                pub_date = (
                    entry.get("published_parsed") or
                    entry.get("updated_parsed") or
                    entry.get("published")
                )
                if pub_date and not is_recent(pub_date, hours=24):
                    continue

                summary = entry.get("summary") or entry.get("description") or ""
                content = entry.get("fallback_content") or summary

                article = build_article(
                    article_id=article_id,
                    title=entry.get("title", ""),
                    source=source,
                    url=url,
                    published=entry.get("published", datetime.now(timezone.utc).isoformat()),
                    summary=summary,
                    content=content
                )
                articles.append(article)
                article_cache[article_id] = article
                count += 1

            print(f"  ✓ {source}: {count} new articles")

        except Exception as e:
            print(f"  ✗ RSS error {source}: {e}")

    return articles
        
# ── Scraper 2: NewsAPI ─────────────────────────────

def scrape_newsapi() -> list:
    articles = []
    if not NEWSAPI_KEY:
        print("  ⚠ NewsAPI key missing — skipping")
        return articles

    queries = [
        "Ghana finance",
        "Bank of Ghana",
        "Ghana Stock Exchange",
        "Ghana economy cedi",
        "Ghana investment banking",
    ]

    try:
        print(f"  Scraping NewsAPI...")
        for query in queries:
            res = requests.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": query,
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 10,
                    "apiKey": NEWSAPI_KEY
                },
                timeout=10
            )
            data = res.json()

            if data.get("status") != "ok":
                print(f"  ⚠ NewsAPI error: {data.get('message')}")
                continue

            for item in data.get("articles", []):
                url = item.get("url", "")
                if not url or url == "https://removed.com":
                    continue

                article_id = make_id(url)
                if article_id in article_cache:
                    continue

                article = build_article(
                    article_id=article_id,
                    title=item.get("title", ""),
                    source=item.get("source", {}).get("name", "NewsAPI"),
                    url=url,
                    published=item.get("publishedAt", ""),
                    summary=item.get("description", ""),
                    content=item.get("content", "") or item.get("description", "")
                )
                articles.append(article)
                article_cache[article_id] = article

        print(f"  ✓ NewsAPI: {len(articles)} new articles")

    except Exception as e:
        print(f"  ✗ NewsAPI error: {e}")

    return articles

# ── Scraper 3: GNews ───────────────────────────────

def scrape_gnews() -> list:
    articles = []
    if not GNEWS_API_KEY:
        print("  ⚠ GNews key missing — skipping")
        return articles

    try:
        print(f"  Scraping GNews...")
        res = requests.get(
            "https://gnews.io/api/v4/search",
            params={
                "q": "Ghana finance economy banking",
                "lang": "en",
                "max": 10,
                "token": GNEWS_API_KEY
            },
            timeout=10
        )
        data = res.json()

        for item in data.get("articles", []):
            url = item.get("url", "")
            if not url:
                continue

            article_id = make_id(url)
            if article_id in article_cache:
                continue

            article = build_article(
                article_id=article_id,
                title=item.get("title", ""),
                source=item.get("source", {}).get("name", "GNews"),
                url=url,
                published=item.get("publishedAt", ""),
                summary=item.get("description", ""),
                content=item.get("content", "") or item.get("description", "")
            )
            articles.append(article)
            article_cache[article_id] = article

        print(f"  ✓ GNews: {len(articles)} new articles")

    except Exception as e:
        print(f"  ✗ GNews error: {e}")

    return articles

# ── Main runner ────────────────────────────────────

def run_all_scrapers() -> list:
    print(f"\n{'='*50}")
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Scraper cycle started")
    print(f"{'='*50}")

    rss_articles     = scrape_rss_feeds()
    newsapi_articles = scrape_newsapi()
    gnews_articles   = scrape_gnews()

    all_new = rss_articles + newsapi_articles + gnews_articles

    # Sort newest first
    all_new.sort(key=lambda x: x.get("published", ""), reverse=True)

    total = len(article_cache)
    print(f"\n✓ Cycle complete: {len(all_new)} new | {total} total cached")
    print(f"{'='*50}\n")

    return all_new

def get_cached_articles(limit: int = 50) -> list:
    """Return most recent articles from cache"""
    items = list(article_cache.values())
    items.sort(key=lambda x: x.get("published", ""), reverse=True)
    return items[:limit]

def get_article_by_id(article_id: str) -> dict:
    return article_cache.get(article_id)

def update_article(article_id: str, updates: dict):
    """Update article fields after AI analysis"""
    if article_id in article_cache:
        article_cache[article_id].update(updates)