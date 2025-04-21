
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Anime(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    seasons = db.relationship('Season', backref='anime', lazy=True)

class Season(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200))
    anime_id = db.Column(db.Integer, db.ForeignKey('anime.id'), nullable=False)
    episodes = db.relationship('Episode', backref='season', lazy=True)

class Episode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    video_url = db.Column(db.String(500))
    duration = db.Column(db.Integer)  # durée en minutes
    views = db.Column(db.Integer, default=0)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
