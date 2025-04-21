import os
import json
import logging
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, jsonify, redirect, url_for
from news_fetcher import get_anime_news, get_season_announcements

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "anime-zone-secret-key")

# Load anime data from JSON file
def load_anime_data():
    try:
        with open('anime_data.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        # If file doesn't exist, create a sample structure
        anime_data = {
            "anime": []
        }
        with open('anime_data.json', 'w') as file:
            json.dump(anime_data, file)
        return anime_data

# Helper function to extract video ID from Google Drive URL
def get_drive_embed_url(drive_url):
    if not drive_url:
        return None
    
    # Parse the URL
    parsed_url = urlparse(drive_url)
    
    # Check if it's a Google Drive URL
    if 'drive.google.com' in parsed_url.netloc:
        if '/file/d/' in drive_url:
            # Format: https://drive.google.com/file/d/FILE_ID/view
            file_id = drive_url.split('/file/d/')[1].split('/')[0]
        elif 'id=' in drive_url:
            # Format: https://drive.google.com/open?id=FILE_ID
            query = parse_qs(parsed_url.query)
            file_id = query.get('id', [''])[0]
        else:
            return None
            
        # Return the embed URL that allows direct embedding
        return f"https://drive.google.com/file/d/{file_id}/preview"
    
    return None

# Routes
@app.route('/')
def index():
    # Fetch anime news and upcoming seasons
    try:
        news_items = get_anime_news()
        upcoming_anime = get_season_announcements()
    except Exception as e:
        app.logger.error(f"Error fetching news or upcoming anime: {e}")
        news_items = []
        upcoming_anime = []
    
    return render_template('index.html', news=news_items, upcoming=upcoming_anime)

@app.route('/video/<anime_id>/<season>/<episode>')
def video(anime_id, season, episode):
    anime_data = load_anime_data()
    
    # Find the anime, season, and episode
    anime = next((a for a in anime_data.get('anime', []) if str(a.get('id')) == anime_id), None)
    
    if not anime:
        return redirect(url_for('index'))
    
    selected_season = next((s for s in anime.get('seasons', []) if str(s.get('number')) == season), None)
    
    if not selected_season:
        return redirect(url_for('index'))
    
    selected_episode = next((e for e in selected_season.get('episodes', []) if str(e.get('number')) == episode), None)
    
    if not selected_episode:
        return redirect(url_for('index'))
    
    # Get the video URL
    video_url = selected_episode.get('video_url', '')
    embed_url = get_drive_embed_url(video_url)
    
    # Log for debugging
    app.logger.info(f"Original video URL: {video_url}")
    app.logger.info(f"Embed URL: {embed_url}")
    
    # If we can't embed the video, redirect to index
    if not embed_url:
        app.logger.error("Failed to generate embed URL")
        return redirect(url_for('index'))
    
    # Create a download URL from the original Google Drive link that forces download
    download_url = video_url
    if 'drive.google.com' in video_url:
        # Extract the file ID
        if '/file/d/' in video_url:
            file_id = video_url.split('/file/d/')[1].split('/')[0]
        elif 'id=' in video_url:
            parsed_url = urlparse(video_url)
            query = parse_qs(parsed_url.query)
            file_id = query.get('id', [''])[0]
        else:
            file_id = None
            
        if file_id:
            # Use the direct download URL format
            download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
    
    return render_template(
        'video.html',
        anime=anime,
        season=selected_season,
        episode=selected_episode,
        embed_url=embed_url,
        download_url=download_url
    )

@app.route('/api/anime')
def get_anime():
    anime_data = load_anime_data()
    search_query = request.args.get('q', '').lower()
    
    if search_query:
        # Filter anime based on search query
        filtered_anime = [
            anime for anime in anime_data.get('anime', [])
            if search_query in anime.get('title', '').lower()
        ]
        return jsonify({"anime": filtered_anime})
    
    return jsonify(anime_data)

@app.route('/api/anime/<anime_id>')
def get_anime_details(anime_id):
    anime_data = load_anime_data()
    
    # Find the anime by ID
    anime = next((a for a in anime_data.get('anime', []) if str(a.get('id')) == anime_id), None)
    
    if not anime:
        return jsonify({"error": "Anime not found"}), 404
    
    return jsonify(anime)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
