import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentView.css';

const API_URL = 'http://localhost:5000';

const VideosView = ({ user, selection }) => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/videos`);
            if (response.data.success) {
                setVideos(response.data.videos);
            }
        } catch (err) {
            setError('Failed to load videos. Please try again later.');
            console.error('Error fetching videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const playVideo = (video) => {
        setSelectedVideo(video);
    };

    const closeVideo = () => {
        setSelectedVideo(null);
    };

    const filteredVideos = videos.filter(video => {
        const matchesClass = selection ? String(video.standard) === String(selection.class) : true;
        const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesClass && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="student-view-container">
            <div className="view-header">
                <h1>🎥 Video Lectures</h1>
                <p>Recorded lessons for <strong>Standard {selection?.class}th</strong></p>
            </div>

            <div className="search-bar card">
                <input
                    type="text"
                    placeholder="🔍 Search videos by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading videos...</p>
                </div>
            ) : error ? (
                <div className="error-container card">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">📹</div>
                    <h3>{searchTerm ? 'No videos found' : 'No videos available yet'}</h3>
                    <p>
                        {searchTerm
                            ? 'Try searching with different keywords'
                            : 'Your teacher will upload video lectures soon'}
                    </p>
                </div>
            ) : (
                <div className="videos-grid">
                    {filteredVideos.map((video) => (
                        <div key={video.id} className="video-card card">
                            <div className="video-thumbnail">
                                <div className="play-overlay" onClick={() => playVideo(video)}>
                                    <div className="play-icon">▶️</div>
                                </div>
                                <span className="video-badge">🎬 Video</span>
                            </div>
                            <div className="video-content">
                                <h3>{video.title}</h3>
                                <p className="video-description">{video.description || 'No description available'}</p>
                                <div className="video-meta">
                                    <span className="video-date">
                                        📅 {formatDate(video.uploaded_at)}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-success watch-btn"
                                    onClick={() => playVideo(video)}
                                >
                                    <span className="btn-icon">▶️</span>
                                    Watch Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedVideo && (
                <div className="video-modal" onClick={closeVideo}>
                    <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeVideo}>✕</button>
                        <h2>{selectedVideo.title}</h2>
                        <div className="video-player">
                            <video
                                controls
                                autoPlay
                                className="video-element"
                                src={`${API_URL}/api/download/videos/${selectedVideo.filename}`}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        {selectedVideo.description && (
                            <div className="video-info">
                                <h3>About this video</h3>
                                <p>{selectedVideo.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideosView;
