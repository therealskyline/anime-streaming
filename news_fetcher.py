import trafilatura
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_anime_news(url="https://www.animenewsnetwork.com/news/"):
    """
    Fetch latest anime news from Anime News Network or other anime news sites.
    
    Args:
        url (str): The URL of the news source to scrape
        
    Returns:
        list: A list of news items, each containing title, date, and short description
    """
    try:
        logger.info(f"Fetching news from {url}")
        
        # Download the webpage
        downloaded = trafilatura.fetch_url(url)
        
        if not downloaded:
            logger.error(f"Failed to download content from {url}")
            return []
        
        # Extract the main content
        text = trafilatura.extract(downloaded)
        
        if not text:
            logger.error(f"Failed to extract content from {url}")
            return []
        
        # Process the text to extract news items
        # This is a simple implementation - in a real-world scenario,
        # you'd want to use more sophisticated parsing with BeautifulSoup or similar
        
        # For demonstration purposes, we'll create some sample news items
        # based on the extracted text
        lines = text.split('\n')
        news_items = []
        
        current_item = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Assume headlines are generally shorter than descriptions
            if len(line) < 100 and not current_item.get('title'):
                current_item['title'] = line
            elif current_item.get('title') and not current_item.get('description'):
                current_item['description'] = line
                current_item['date'] = datetime.now().strftime("%Y-%m-%d")
                news_items.append(current_item)
                current_item = {}
                
            # Limit to 5 news items for demonstration
            if len(news_items) >= 5:
                break
        
        logger.info(f"Successfully extracted {len(news_items)} news items")
        return news_items
        
    except Exception as e:
        logger.error(f"Error fetching anime news: {e}")
        return []

def get_season_announcements(url="https://www.livechart.me/"):
    """
    Fetch upcoming season announcements from anime tracking sites.
    
    Args:
        url (str): The URL of the source to scrape
        
    Returns:
        list: A list of upcoming anime seasons with details
    """
    try:
        logger.info(f"Fetching season announcements from {url}")
        
        # Download the webpage
        downloaded = trafilatura.fetch_url(url)
        
        if not downloaded:
            logger.error(f"Failed to download content from {url}")
            return []
        
        # Extract the main content
        text = trafilatura.extract(downloaded)
        
        if not text:
            logger.error(f"Failed to extract content from {url}")
            return []
        
        # Process to extract upcoming anime
        lines = text.split('\n')
        upcoming_anime = []
        
        current_item = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Simple heuristic parsing
            if len(line) < 80 and not current_item.get('title'):
                current_item['title'] = line
            elif current_item.get('title') and not current_item.get('season'):
                # Try to identify season info
                if any(s in line.lower() for s in ['winter', 'spring', 'summer', 'fall']):
                    current_item['season'] = line
                else:
                    current_item['description'] = line
                
                if current_item.get('season') or current_item.get('description'):
                    upcoming_anime.append(current_item)
                    current_item = {}
            
            # Limit to 5 items for demonstration
            if len(upcoming_anime) >= 5:
                break
        
        logger.info(f"Successfully extracted {len(upcoming_anime)} upcoming anime")
        return upcoming_anime
        
    except Exception as e:
        logger.error(f"Error fetching season announcements: {e}")
        return []

if __name__ == "__main__":
    # Test the functions
    news = get_anime_news()
    print(f"Found {len(news)} news items")
    for item in news:
        print(f"Title: {item.get('title')}")
        print(f"Date: {item.get('date')}")
        print(f"Description: {item.get('description')}")
        print("---")
    
    upcoming = get_season_announcements()
    print(f"\nFound {len(upcoming)} upcoming anime")
    for item in upcoming:
        print(f"Title: {item.get('title')}")
        print(f"Season: {item.get('season', 'Unknown')}")
        print(f"Description: {item.get('description', 'No description available')}")
        print("---")