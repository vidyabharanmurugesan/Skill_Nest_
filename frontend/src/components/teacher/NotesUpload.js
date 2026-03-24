import React, { useState } from 'react';
import axios from 'axios';
import './Upload.css';

const API_URL = 'http://localhost:5000';

const NotesUpload = ({ user, selection }) => {
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
            setFormData({ ...formData, file: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.file) {
            setMessage({ type: 'error', text: 'Please select a file to upload' });
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
            const response = await axios.post(`${API_URL}/api/upload/notes`, data, {
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
                setMessage({ type: 'success', text: 'Notes uploaded successfully!' });
                setFormData({ title: '', description: '', file: null });
                setUploadProgress(0);

                // Reset file input
                document.getElementById('file-input').value = '';
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to upload notes. Please try again.'
            });
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-header">
                <h1>📚 Upload Study Notes</h1>
                <p>Sharing for: <strong>Standard {selection?.class}th - {selection?.subject}</strong></p>
            </div>

            <div className="upload-card card">
                <form onSubmit={handleSubmit} className="upload-form">
                    <div className="input-group">
                        <label>Note Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Introduction to Mathematics Chapter 1"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Provide a brief description of the notes..."
                            rows="4"
                        />
                    </div>

                    <div className="input-group">
                        <label>Upload File * (PDF, DOC, DOCX, TXT)</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                id="file-input"
                                name="file"
                                onChange={handleChange}
                                accept=".pdf,.doc,.docx,.txt"
                                required
                            />
                            <div className="file-input-display">
                                <span className="file-icon">📄</span>
                                <span className="file-name">
                                    {formData.file ? formData.file.name : 'Choose a file...'}
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
                        {uploading ? 'Uploading...' : 'Upload Notes'}
                    </button>
                </form>
            </div>

            <div className="upload-tips card mt-4">
                <h3>💡 Tips for uploading notes</h3>
                <ul>
                    <li>Ensure your file is in PDF or DOC format for best compatibility</li>
                    <li>Use clear, descriptive titles so students can easily find the content</li>
                    <li>Include relevant keywords in the description</li>
                    <li>Keep file sizes reasonable for faster downloads</li>
                    <li>Organize notes by chapter or topic</li>
                </ul>
            </div>
        </div>
    );
};

export default NotesUpload;
