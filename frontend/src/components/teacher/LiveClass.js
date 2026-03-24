import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './LiveClass.css';

const API_URL = 'http://localhost:5000';

const LiveClass = ({ user, selection }) => {
    const [classTitle, setClassTitle] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [currentClass, setCurrentClass] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [participants, setParticipants] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showPanel, setShowPanel] = useState(true);
    const socketRef = useRef();
    const jitsiRef = useRef();
    const chatEndRef = useRef();

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(API_URL);

        socketRef.current.on('participants_update', (data) => {
            setParticipants(data.participants);
        });

        socketRef.current.on('receive_class_message', (msg) => {
            setChatMessages(prev => [...prev, msg]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (jitsiRef.current) {
                jitsiRef.current.dispose();
            }
        };
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    const startJitsi = (classId, roomName) => {
        const domain = 'meet.jit.si';
        const options = {
            roomName: `SkillNest_Class_${classId}_${roomName.replace(/\s+/g, '_')}`,
            width: '100%',
            height: '100%',
            parentNode: document.querySelector('#jitsi-container'),
            userInfo: {
                displayName: user.name
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'info', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            }
        };
        jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    };

    const startLiveClass = async () => {
        if (!classTitle.trim()) {
            setMessage({ type: 'error', text: 'Please enter a class title' });
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/liveclass/start`, {
                teacher_id: user.id,
                title: classTitle,
                subject: selection?.subject || 'General',
                standard: selection?.class || 'Unknown'
            });

            if (response.data.success) {
                const liveClass = response.data.class;
                setCurrentClass(liveClass);
                setIsLive(true);
                setMessage({ type: 'success', text: 'Live class started successfully!' });

                // Join the socket room for this class
                socketRef.current.emit('join_class_room', {
                    class_id: liveClass.id,
                    user_id: user.id,
                    user_name: user.name
                });

                // Initialize Jitsi after a short delay to ensure container is ready
                setTimeout(() => {
                    startJitsi(liveClass.id, liveClass.title);
                }, 500);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to start live class'
            });
        }
    };

    const endLiveClass = async () => {
        if (!currentClass) return;

        try {
            await axios.post(`${API_URL}/api/liveclass/end`, {
                class_id: currentClass.id
            });

            if (jitsiRef.current) {
                jitsiRef.current.dispose();
                jitsiRef.current = null;
            }

            // Clean up local state
            setIsLive(false);
            setCurrentClass(null);
            setClassTitle('');
            setChatMessages([]);
            setMessage({ type: 'success', text: 'Live class ended. Students have been notified.' });
            setShowPanel(true);
        } catch (error) {
            console.error('Error ending live class:', error);
            setMessage({ type: 'error', text: 'Failed to end live class cleanly on server' });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        socketRef.current.emit('send_class_message', {
            class_id: currentClass.id,
            message: chatInput,
            sender_id: user.id,
            sender_name: user.name,
            sender_role: 'teacher'
        });

        setChatInput('');
    };

    return (
        <div className={`liveclass-wrapper ${isLive ? 'is-live-fullscreen' : ''}`}>
            {!isLive ? (
                <div className="liveclass-container">
                    <div className="liveclass-header">
                        <h1>📡 Live Class Setup</h1>
                        <p>Teaching: <strong>Standard {selection?.class}th - {selection?.subject}</strong></p>
                    </div>

                    <div className="liveclass-start glass">
                        <div className="start-icon">👨‍🏫</div>
                        <h2>Start a New Live Session</h2>
                        <p>Engage with your students in real-time with our premium HD video platform.</p>

                        <div className="input-group">
                            <input
                                type="text"
                                className="styled-input"
                                value={classTitle}
                                onChange={(e) => {
                                    setClassTitle(e.target.value);
                                    setMessage({ type: '', text: '' });
                                }}
                                placeholder="e.g., Advanced Mathematics - Calculus Part 1"
                            />
                        </div>

                        {message.text && !isLive && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            className="btn-glow pulse"
                            onClick={startLiveClass}
                        >
                            Start Live Class
                        </button>
                    </div>
                </div>
            ) : (
                <div className="fullscreen-live-view">
                    <div id="jitsi-container" className="jitsi-full"></div>
                    
                    <div className="overlay-controls">
                        <div className="live-badge-overlay pulsing">
                            <span className="dot"></span> LIVE
                        </div>
                        <h2 className="overlay-title">{currentClass?.title}</h2>
                        <button className="panel-toggle-btn" onClick={() => setShowPanel(!showPanel)}>
                            {showPanel ? 'Hide Panel ➡️' : '⬅️ Show Panel'}
                        </button>
                        <button className="end-class-btn" onClick={endLiveClass}>
                            End Class
                        </button>
                    </div>

                    <div className={`glass-side-panel ${showPanel ? 'open' : 'closed'}`}>
                        <div className="panel-section participants-section">
                            <h3>👥 Classmates ({participants.length})</h3>
                            <div className="participants-list">
                                {participants.length === 0 ? (
                                    <p className="no-participants">Waiting for students...</p>
                                ) : (
                                    participants.map(p => (
                                        <div key={p.user_id} className="participant-item">
                                            <span className="participant-avatar">👩‍🎓</span>
                                            <span className="participant-name">{p.user_name}</span>
                                            <span className="participant-status online"></span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="panel-section chat-section">
                            <h3>💬 Live Chat</h3>
                            <div className="chat-messages">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`chat-msg ${msg.sender_id === user.id ? 'mine' : ''}`}>
                                        <span className="msg-sender">{msg.sender_name}</span>
                                        <span className="msg-text">{msg.message}</span>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Message class..."
                                />
                                <button type="submit">📤</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveClass;
