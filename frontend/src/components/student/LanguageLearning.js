import React, { useState } from 'react';
import axios from 'axios';
import './LanguageLearning.css';

const LanguageLearning = ({ user }) => {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('Ready');
    const [history, setHistory] = useState([]);
    const [selectedLang, setSelectedLang] = useState('en-US');

    const languages = [
        { code: 'en-US', name: 'English', icon: '🇺🇸' },
        { code: 'ta-IN', name: 'Tamil', icon: '🇮🇳' },
        { code: 'hi-IN', name: 'Hindi', icon: '🇮🇳' },
        { code: 'ml-IN', name: 'Malayalam', icon: '🇮🇳' },
        { code: 'te-IN', name: 'Telugu', icon: '🇮🇳' },
    ];

    const speak = async () => {
        if (!text) {
            setStatus('Please enter some text');
            return;
        }

        setStatus('Translating...');

        try {
            // Translate the text first
            const translateRes = await axios.post('http://localhost:5000/api/translate', {
                text: text,
                target_lang: selectedLang
            });

            const translatedText = translateRes.data.success ? translateRes.data.translated_text : text;

            setStatus('Generating audio with OpenAI...');

            // Fetch TTS Audio from Backend
            const ttsRes = await axios.post('http://localhost:5000/api/openai/tts', {
                text: translatedText
            }, {
                responseType: 'blob' // Important: Expecting binary audio data
            });

            // Play the Audio
            const audioUrl = URL.createObjectURL(ttsRes.data);
            const audio = new Audio(audioUrl);

            audio.onplay = () => {
                setStatus('Assistant is speaking...');
                const newHistory = [{ text: translatedText, original: text, lang: selectedLang, time: new Date().toLocaleTimeString() }, ...history].slice(0, 5);
                setHistory(newHistory);
            };

            audio.onended = () => {
                setStatus('Finished speaking');
                URL.revokeObjectURL(audioUrl); // Clean up memory
            };

            audio.onerror = () => {
                setStatus('Error playing audio track');
            };

            await audio.play();

        } catch (error) {
            console.error("OpenAI TTS/Translation Error:", error);
            const errMsg = error.response?.data?.message || 'Error communicating with server';
            setStatus(`Error: ${errMsg}. Check API key.`);
        }
    };

    // The useEffect hook for speech synthesis voices is no longer needed as we are using OpenAI TTS.

    return (
        <div className="language-learning-container">
            <div className="welcome-banner student-banner">
                <h1>🗣️ Language Learning Assistant</h1>
                <p>Improve your pronunciation and language skills with AI Voice Assistant</p>
            </div>

            <div className="learning-grid">
                <div className="voice-card card glass">
                    <div className="card-header">
                        <h3>Voice Assistant</h3>
                        <span className={`status-pill ${status.includes('Assistant') ? 'active' : ''}`}>
                            {status}
                        </span>
                    </div>

                    <div className="input-section">
                        <textarea
                            className="text-input"
                            placeholder="Type anything you want to hear..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="control-section">
                        <div className="language-selector">
                            <label>Select Language:</label>
                            <div className="lang-buttons">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`lang-btn ${selectedLang === lang.code ? 'active' : ''}`}
                                        onClick={() => setSelectedLang(lang.code)}
                                    >
                                        <span className="lang-icon">{lang.icon}</span>
                                        <span className="lang-name">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="speak-btn main-action" onClick={speak}>
                            <span className="icon">🔊</span> Listen Now
                        </button>
                    </div>
                </div>

                <div className="info-card-section">
                    <div className="info-card card glass">
                        <h3>📈 Recent Practice</h3>
                        <div className="history-list">
                            {history.length > 0 ? (
                                history.map((item, idx) => (
                                    <div key={idx} className="history-item">
                                        <div className="history-text">"{item.text}"</div>
                                        <div className="history-meta">
                                            <span>{languages.find(l => l.code === item.lang)?.name}</span>
                                            <span>{item.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-msg">No recent practice history</p>
                            )}
                        </div>
                    </div>

                    <div className="info-card card glass tips-card">
                        <h3>💡 Quick Tips</h3>
                        <ul>
                            <li>Listen to complex words multiple times.</li>
                            <li>Try repeating after the assistant.</li>
                            <li>Use short sentences for better clarity.</li>
                            <li>Switch languages to compare pronunciation.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageLearning;
