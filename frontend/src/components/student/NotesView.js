import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentView.css';

const API_URL = 'http://localhost:5000';

const NotesView = ({ user, selection }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/notes`);
            if (response.data.success) {
                setNotes(response.data.notes);
            }
        } catch (err) {
            setError('Failed to load notes. Please try again later.');
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const downloadNote = (filename) => {
        window.open(`${API_URL}/api/download/notes/${filename}`, '_blank');
    };

    const filteredNotes = notes.filter(note => {
        const matchesClass = selection ? String(note.standard) === String(selection.class) : true;
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.description.toLowerCase().includes(searchTerm.toLowerCase());
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
                <h1>📚 Study Notes</h1>
                <p>Access learning materials for <strong>Standard {selection?.class}th</strong></p>
            </div>

            <div className="search-bar card">
                <input
                    type="text"
                    placeholder="🔍 Search notes by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading notes...</p>
                </div>
            ) : error ? (
                <div className="error-container card">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">📭</div>
                    <h3>{searchTerm ? 'No notes found' : 'No notes available yet'}</h3>
                    <p>
                        {searchTerm
                            ? 'Try searching with different keywords'
                            : 'Your teacher will upload study materials soon'}
                    </p>
                </div>
            ) : (
                <div className="notes-grid">
                    {filteredNotes.map((note) => (
                        <div key={note.id} className="note-card card">
                            <div className="note-icon">📄</div>
                            <h3>{note.title}</h3>
                            <p className="note-description">{note.description || 'No description available'}</p>
                            <div className="note-meta">
                                <span className="note-date">
                                    📅 {formatDate(note.uploaded_at)}
                                </span>
                            </div>
                            <button
                                className="btn btn-primary download-btn"
                                onClick={() => downloadNote(note.filename)}
                            >
                                <span className="btn-icon">⬇️</span>
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesView;
