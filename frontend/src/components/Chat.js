import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

const Chat = ({ user, role }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState(role === 'student' ? 'ta' : 'en');

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // Fetch available users to chat with
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const targetRole = role === 'student' ? 'teacher' : 'student';
                const response = await axios.get(`${API_URL}/users?role=${targetRole}`);
                if (response.data.success) {
                    setUsers(response.data.users);
                    // Automatically select the first user if none selected
                    if (response.data.users.length > 0 && !selectedUser) {
                        setSelectedUser(response.data.users[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [role, selectedUser]);

    const roomName = selectedUser
        ? (role === 'teacher' ? `chat_${user.id}_${selectedUser.id}` : `chat_${selectedUser.id}_${user.id}`)
        : '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!roomName) return;

        // Initialize Socket.IO connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to chat server');
            setConnected(true);

            // Join the chat room
            socket.emit('join_chat', {
                room: roomName,
                user_id: user.id,
                user_name: user.name
            });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            setConnected(false);
        });

        socket.on('chat_history', (data) => {
            setMessages(data.messages || []);
        });

        socket.on('receive_message', (messageData) => {
            setMessages((prev) => [...prev, messageData]);
        });

        socket.on('user_typing', (data) => {
            if (data.is_typing) {
                setOtherUserTyping(data.user_name);
            } else {
                setOtherUserTyping(false);
            }
        });

        return () => {
            socket.emit('leave_chat', { room: roomName, user_id: user.id });
            socket.disconnect();
            setMessages([]); // Reset messages when switching rooms
        };
    }, [roomName, user.id, user.name]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && connected && roomName) {
            const messageData = {
                room: roomName,
                message: inputMessage,
                sender_id: user.id,
                sender_name: user.name,
                sender_role: role,
                target_language: targetLanguage
            };

            socketRef.current.emit('send_message', messageData);
            setInputMessage('');

            // Stop typing status
            socketRef.current.emit('typing', {
                room: roomName,
                user_name: user.name,
                is_typing: false
            });
            setTyping(false);
        }
    };

    const handleTyping = (e) => {
        setInputMessage(e.target.value);

        if (!typing && connected && roomName) {
            setTyping(true);
            socketRef.current.emit('typing', {
                room: roomName,
                user_name: user.name,
                is_typing: true
            });
        }

        // Clear typing status after 3 seconds of inactivity
        const timeout = setTimeout(() => {
            if (typing && connected && roomName) {
                socketRef.current.emit('typing', {
                    room: roomName,
                    user_name: user.name,
                    is_typing: false
                });
                setTyping(false);
            }
        }, 3000);

        return () => clearTimeout(timeout);
    };

    if (loading) {
        return <div className="loading-container">Loading chats...</div>;
    }

    return (
        <div className="chat-layout">
            <div className="users-sidebar">
                <h3>{role === 'teacher' ? 'Students' : 'Teachers'}</h3>
                <div className="users-list">
                    {users.map(u => (
                        <div
                            key={u.id}
                            className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                            onClick={() => setSelectedUser(u)}
                        >
                            <div className="user-icon">{role === 'teacher' ? '👨‍🎓' : '👩‍🏫'}</div>
                            <div className="user-details">
                                <span className="user-name">{u.name}</span>
                                <span className="user-email">{u.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-main">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className={`status-indicator ${connected ? 'online' : 'offline'}`}></div>
                                <h2>Chat with {selectedUser.name}</h2>
                            </div>
                            <div className="chat-settings">
                                <label>Translate to: </label>
                                <select
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    className="lang-select"
                                >
                                    <option value="en">English</option>
                                    <option value="ta">Tamil</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="empty-chat">
                                    <div className="empty-icon">💬</div>
                                    <p>No messages yet. Start the conversation with {selectedUser.name}!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`message-wrapper ${msg.sender_id === user.id ? 'own-message' : 'other-message'}`}
                                    >
                                        <div className="message-bubble">
                                            <div className="message-sender">{msg.sender_name}</div>
                                            <div className="message-content">
                                                <p className="original-text">{msg.original_message}</p>
                                                {msg.translated_message && msg.translated_message !== msg.original_message && (
                                                    <p className="translated-text">
                                                        <span className="translation-label">Translated: </span>
                                                        {msg.translated_message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {otherUserTyping && (
                                <div className="typing-indicator">
                                    {otherUserTyping} is typing<span>.</span><span>.</span><span>.</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder={`Message ${selectedUser.name}...`}
                                value={inputMessage}
                                onChange={handleTyping}
                                onBlur={() => {
                                    if (typing && connected && roomName) {
                                        socketRef.current.emit('typing', {
                                            room: roomName,
                                            user_name: user.name,
                                            is_typing: false
                                        });
                                        setTyping(false);
                                    }
                                }}
                            />
                            <button type="submit" disabled={!inputMessage.trim() || !connected}>
                                <span className="send-icon">➤</span>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-selection">
                        <div className="empty-icon">👥</div>
                        <p>Select a user to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
