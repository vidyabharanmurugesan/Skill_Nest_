import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './StudentView.css';

const API_URL = 'http://localhost:5000';

const LiveClassJoin = ({ user, selection }) => {
    const [liveClasses, setLiveClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joinedClass, setJoinedClass] = useState(null);
    const [classEndedNotice, setClassEndedNotice] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showPanel, setShowPanel] = useState(true);
    const socketRef = useRef();
    const jitsiRef = useRef();
    const chatEndRef = useRef();

    const fetchLiveClasses = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/liveclass`);
            if (response.data.success) {
                // Filter classes by student's selected standard
                const activeClasses = response.data.classes.filter(c =>
                    selection ? String(c.standard) === String(selection.class) : true
                );
                setLiveClasses(activeClasses);

                if (joinedClass && !response.data.classes.find(c => c.id === joinedClass.id)) {
                    // Class ended flag could be set here, but relied on socket below
                }
            }
        } catch (err) {
            setError('Failed to load live classes.');
            console.error('Error fetching live classes:', err);
        } finally {
            setLoading(false);
        }
    }, [selection, joinedClass]);

    // 1. Establish the socket connection once when the component mounts
    useEffect(() => {
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

    // 2. Continually fetch live class list every 10 seconds
    useEffect(() => {
        fetchLiveClasses();
        const interval = setInterval(fetchLiveClasses, 10000);
        return () => clearInterval(interval);
    }, [fetchLiveClasses]);

    // 3. Attach a conditional event listener for class ended handling
    useEffect(() => {
        if (!socketRef.current) return;

        const handleClassEndedEvent = (data) => {
            if (joinedClass && data.class_id === joinedClass.id) {
                handleClassEnded();
            }
        };

        socketRef.current.on('class_ended', handleClassEndedEvent);
        return () => {
            socketRef.current.off('class_ended', handleClassEndedEvent);
        };
    }, [joinedClass]);

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
                    'microphone', 'camera', 'closedcaptions', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'info', 'chat',
                    'settings', 'raisehand', 'videoquality', 'filmstrip',
                    'tileview', 'videobackgroundblur', 'help'
                ],
            }
        };
        jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    };

    const handleClassEnded = () => {
        setClassEndedNotice(true);
        setTimeout(() => {
            setJoinedClass(null);
            setClassEndedNotice(false);
        }, 5000); // Wait 5 seconds before going back to the list
    };

    const joinClass = (classItem) => {
        setJoinedClass(classItem);
        setClassEndedNotice(false);
        setChatMessages([]);
        socketRef.current.emit('join_class_room', {
            class_id: classItem.id,
            user_id: user.id,
            user_name: user.name
        });

        setTimeout(() => {
            startJitsi(classItem.id, classItem.title);
        }, 500);
    };

    const leaveClass = () => {
        if (joinedClass) {
            socketRef.current.emit('leave_class_room', {
                class_id: joinedClass.id,
                user_id: user.id
            });
            if (jitsiRef.current) {
                jitsiRef.current.dispose();
                jitsiRef.current = null;
            }
        }
        setJoinedClass(null);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        socketRef.current.emit('send_class_message', {
            class_id: joinedClass.id,
            message: chatInput,
            sender_id: user.id,
            sender_name: user.name,
            sender_role: 'student'
        });

        setChatInput('');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (joinedClass) {
        return (
            <div className="liveclass-wrapper is-live-fullscreen">
                {classEndedNotice && (
                    <div className="class-ended-overlay">
                        <div className="notice-card glass">
                            <h3>🔴 Class Ended</h3>
                            <p>The teacher has ended this session. Redirecting you back to the classroom list...</p>
                        </div>
                    </div>
                )}
                <div className="fullscreen-live-view">
                    <div id="jitsi-container" className="jitsi-full">
                        {classEndedNotice && (
                            <div className="video-placeholder">
                                <div className="camera-icon">📴</div>
                                <p>Stream Disconnected</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="overlay-controls">
                        <div className={`live-badge-overlay ${classEndedNotice ? 'ended' : 'pulsing'}`}>
                            {classEndedNotice ? '❌ ENDED' : <><span className="dot"></span> LIVE</>}
                        </div>
                        <h2 className="overlay-title">{joinedClass.title}</h2>
                        <button className="panel-toggle-btn" onClick={() => setShowPanel(!showPanel)}>
                            {showPanel ? 'Hide Panel ➡️' : '⬅️ Show Panel'}
                        </button>
                        <button className="end-class-btn" onClick={leaveClass}>
                            Leave Class
                        </button>
                    </div>

                    <div className={`glass-side-panel ${showPanel ? 'open' : 'closed'}`}>
                        <div className="panel-section participants-section">
                            <h3>👥 Classmates ({participants.length})</h3>
                            <div className="participants-list">
                                {participants.map(p => (
                                    <div key={p.user_id} className="participant-item">
                                        <span className="participant-avatar">{p.user_id === joinedClass.teacher_id ? '👩‍🏫' : '👨‍🎓'}</span>
                                        <span className="participant-name">{p.user_name} {p.user_id === user.id ? '(You)' : ''}</span>
                                        <span className="participant-status online"></span>
                                    </div>
                                ))}
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
                                    disabled={classEndedNotice}
                                />
                                <button type="submit" disabled={classEndedNotice || !chatInput.trim()}>📤</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-view-container">
            <div className="view-header">
                <h1>📡 Live Classes</h1>
                <p>Real-time sessions for <strong>Standard {selection?.class}th</strong></p>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Checking for live classes...</p>
                </div>
            ) : error ? (
                <div className="error-container card">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            ) : liveClasses.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">📡</div>
                    <h3>No live classes right now</h3>
                    <p>Check back later or wait for your teacher to start a session</p>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={fetchLiveClasses}
                    >
                        🔄 Refresh
                    </button>
                </div>
            ) : (
                <div className="live-classes-list">
                    {liveClasses.map((classItem) => (
                        <div key={classItem.id} className="live-class-card card">
                            <div className="live-class-header">
                                <div className="live-badge pulsing">🔴 LIVE</div>
                                <span className="class-time">Started at {formatDate(classItem.started_at)}</span>
                            </div>
                            <h3>{classItem.title}</h3>
                            <p className="class-teacher">👨‍🏫 Teacher ID: {classItem.teacher_id}</p>
                            <div className="class-participants">
                                <span>👥 {classItem.participants?.length || 0} participants</span>
                            </div>
                            <button
                                className="btn btn-success join-btn"
                                onClick={() => joinClass(classItem)}
                            >
                                <span className="btn-icon">🚀</span>
                                Join Class
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="live-class-tips card mt-4">
                <h3>💡 Tips for attending live classes</h3>
                <ul>
                    <li>Join the class a few minutes early</li>
                    <li>Make sure you have a stable internet connection</li>
                    <li>Keep your microphone muted unless speaking</li>
                    <li>Use the chat to ask questions</li>
                    <li>Take notes during the session</li>
                    <li>Participate actively when asked</li>
                </ul>
            </div>
        </div>
    );
};

export default LiveClassJoin;
