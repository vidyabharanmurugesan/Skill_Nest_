import React, { useState } from 'react';
import axios from 'axios';
import './Upload.css';

const API_URL = 'http://localhost:5000';

const VideoUpload = ({ user, selection }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null
    });
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleChange = (e) => {
        if (e.target.name === 'file') {
            const file = e.target.files[0];
            // Check file size (max 500MB)
            if (file && file.size > 500 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size should not exceed 500MB' });
                return;
            }
            setFormData({ ...formData, file });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.file) {
            setMessage({ type: 'error', text: 'Please select a video file to upload' });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const data = new FormData();
        data.append('file', formData.file);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('teacher_id', user.id);
        data.append('subject', selection?.subject || 'General');
        data.append('standard', selection?.class || 'Unknown');

        try {
            const response = await axios.post(`${API_URL}/api/upload/video`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Video uploaded successfully!' });
                setFormData({ title: '', description: '', file: null });
                setUploadProgress(0);

                // Reset file input
                document.getElementById('video-file-input').value = '';
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to upload video. Please try again.'
            });
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h1>🎥 Upload Video Lecture</h1>
                <p>Sharing for: <strong>Standard {selection?.class}th - {selection?.subject}</strong></p>
            </div>

            <div className="upload-card card">
                <form onSubmit={handleSubmit} className="upload-form">
                    <div className="input-group">
                        <label>Video Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Algebra Basics - Lesson 1"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe what students will learn from this video..."
                            rows="4"
                        />
                    </div>

                    <div className="input-group">
                        <label>Upload Video * (MP4, AVI, MOV, WMV - Max 500MB)</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                id="video-file-input"
                                name="file"
                                onChange={handleChange}
                                accept="video/*"
                                required
                            />
                            <div className="file-input-display">
                                <span className="file-icon">🎬</span>
                                <span className="file-name">
                                    {formData.file
                                        ? `${formData.file.name} (${formatFileSize(formData.file.size)})`
                                        : 'Choose a video file...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {uploading && (
                        <div className="progress-bar-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    {uploadProgress}%
                                </div>
                            </div>
                            <p className="upload-status">Uploading video... This may take a while depending on file size.</p>
                        </div>
                    )}

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading Video...' : 'Upload Video'}
                    </button>
                </form>
            </div>

            <div className="upload-tips card mt-4">
                <h3>💡 Tips for uploading videos</h3>
                <ul>
                    <li>Use MP4 format for best compatibility across all devices</li>
                    <li>Keep videos under 30 minutes for better engagement</li>
                    <li>Ensure good audio quality - clear voice is essential</li>
                    <li>Use a descriptive title that explains the topic</li>
                    <li>Consider recording in HD (720p or 1080p) for clarity</li>
                    <li>Break complex topics into multiple shorter videos</li>
                </ul>
            </div>
        </div>
    );
};

export default VideoUpload;
