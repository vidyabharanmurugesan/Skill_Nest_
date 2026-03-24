import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './QuickAccessHUD.css';

const QuickAccessHUD = ({ user, role, selection }) => {
    const location = useLocation();
    const [isLiveActive, setIsLiveActive] = useState(false);
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Check for live classes
                const liveResp = await axios.get(`${API_URL}/api/liveclass`);
                if (liveResp.data.success) {
                    const activeClasses = liveResp.data.classes;
                    if (role === 'student') {
                        setIsLiveActive(activeClasses.some(c => String(c.standard) === String(selection?.class)));
                    } else {
                        setIsLiveActive(activeClasses.some(c => c.teacher_id === user.id));
                    }
                }
            } catch (err) {
                console.error('HUD check failed:', err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [user.id, role, selection]);

    // Hide HUD if on specific pages where it might overlap too much (optional)
    const hiddenPages = ['/teacher/liveclass', '/student/liveclass'];
    if (hiddenPages.some(path => location.pathname.includes(path))) {
        // We still might want to show it, or a slim version.
        // For now, let's keep it visible but maybe repositioned via CSS.
    }

    return (
        <div className="quick-access-hud">
            <div className="hud-actions">
                {isLiveActive && (
                    <Link to={role === 'teacher' ? '/teacher/liveclass' : '/student/liveclass'} className="hud-btn live-pulse" title="Class is LIVE!">
                        <span className="hud-icon">📡</span>
                        <span className="hud-badge-dot"></span>
                    </Link>
                )}

                <Link to={role === 'teacher' ? '/teacher/chat' : '/student/chat'} className="hud-btn" title="Messages">
                    <span className="hud-icon">💬</span>
                </Link>

                <Link to={role === 'teacher' ? '/teacher/assessment' : '/student/profile'} className="hud-btn" title={role === 'teacher' ? 'Analytics' : 'My Progress'}>
                    <span className="hud-icon">{role === 'teacher' ? '📈' : '👤'}</span>
                </Link>

                <Link to={role === 'teacher' ? '/teacher' : '/student'} className="hud-btn" title="Home">
                    <span className="hud-icon">🏠</span>
                </Link>
            </div>
        </div>
    );
};

export default QuickAccessHUD;
