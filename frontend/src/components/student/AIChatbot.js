import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AIChatbot.css';

const AIChatbot = ({ user }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: `Hello ${user.name}! I'm your AI Coding Assistant. How can I help you with your challenges today?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/ai/chat', {
                message: userMsg,
                student_id: user.id
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'ai', content: response.data.reply }]);
            }
        } catch (err) {
            console.error('AI Chat failed:', err);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now. Please make sure the OpenAI API key is configured." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-container animate-in">
            <div className="chat-header card glass">
                <div className="header-info">
                    <span className="ai-icon">🤖</span>
                    <div>
                        <h2>AI Coding Assistant</h2>
                        <p className="status">Online | Powered by GPT</p>
                    </div>
                </div>
            </div>

            <div className="chat-messages card glass">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message-bubble ${msg.role}`}>
                        <div className="avatar">{msg.role === 'ai' ? '🤖' : '👤'}</div>
                        <div className="content">
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="message-bubble ai loading">
                        <div className="avatar">🤖</div>
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input card glass" onSubmit={handleSend}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about a coding problem, syntax, or logic..."
                    disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
                    {loading ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default AIChatbot;
