import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import NotesView from './student/NotesView';
import VideosView from './student/VideosView';
import LiveClassJoin from './student/LiveClassJoin';
import QuizAssessment from './student/QuizAssessment';
import ClassSelection from './student/ClassSelection';
import QuickAccessHUD from './QuickAccessHUD';
import Chat from './Chat';
import Profile from './Profile';
import './StudentDashboard.css';

const StudentDashboard = ({ user, onLogout }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selection, setSelection] = useState(() => {
        const saved = localStorage.getItem(`${user.role}_context`);
        return saved ? JSON.parse(saved) : null;
    });

    const handleContextSelect = (data) => {
        setSelection(data);
        localStorage.setItem(`${user.role}_context`, JSON.stringify(data));
    };

    const basePath = '/student';

    const menuItems = [
        { path: `${basePath}`, icon: '📊', label: 'Dashboard', exact: true },
        { path: `${basePath}/notes`, icon: '📚', label: 'Study Notes' },
        { path: `${basePath}/videos`, icon: '🎥', label: 'Video Lectures' },
        { path: `${basePath}/liveclass`, icon: '📡', label: 'Live Classes' },
        { path: `${basePath}/assessment`, icon: '✍️', label: 'AI Assessments' },
        { path: `${basePath}/chat`, icon: '💬', label: 'Ask Teacher' },
        { path: `${basePath}/profile`, icon: '👤', label: 'My Profile' }
    ];

    const isActive = (path, exact) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="dashboard-container">
            {!selection && <ClassSelection user={user} onSelect={handleContextSelect} />}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-skill">Skill</span>
                        <span className="logo-nest">Nest</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <div className="user-profile">
                    <div className="user-avatar student-avatar">
                        👨‍🎓
                    </div>
                    <div className="user-info">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <span className="user-badge student-badge">
                            Student
                        </span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={onLogout}>
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="/" element={
                        <StudentHome user={user} selection={selection} basePath={basePath} onResetSelection={() => {
                            setSelection(null);
                            localStorage.removeItem(`${user.role}_context`);
                        }} />
                    } />
                    <Route path="/notes" element={<NotesView user={user} selection={selection} />} />
                    <Route path="/videos" element={<VideosView user={user} selection={selection} />} />
                    <Route path="/liveclass" element={<LiveClassJoin user={user} selection={selection} />} />
                    <Route path="/assessment" element={<QuizAssessment user={user} selection={selection} />} />
                    <Route path="/chat" element={<Chat user={user} role="student" />} />
                    <Route path="/profile" element={<Profile user={user} />} />
                </Routes>
            </main>
            <QuickAccessHUD user={user} role="student" selection={selection} />
        </div>
    );
};

const StudentHome = ({ user, selection, onResetSelection, basePath }) => {
    return (
        <div className="dashboard-home">
            <div className="welcome-banner student-banner">
                <h1>Welcome, {user.name}! 👨‍🎓</h1>
                <p>
                    Browsing: <strong>Standard {selection?.class}th</strong>
                </p>
                <button className="change-context-btn" onClick={onResetSelection}>
                    Change Standard
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>Available Notes</h3>
                        <p className="stat-value">12</p>
                        <span className="stat-change positive">+3 new</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">🎥</div>
                    <div className="stat-content">
                        <h3>Video Lectures</h3>
                        <p className="stat-value">8</p>
                        <span className="stat-change positive">+2 new</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Completed</h3>
                        <p className="stat-value">5</p>
                        <span className="stat-change positive">Keep it up!</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content">
                        <h3>Study Hours</h3>
                        <p className="stat-value">24</p>
                        <span className="stat-change positive">This week</span>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Quick Access</h2>
                <div className="actions-grid">
                    <Link to={`${basePath}/notes`} className="action-card card">
                        <div className="action-icon">📚</div>
                        <h3>Study Notes</h3>
                        <p>Access learning materials</p>
                    </Link>

                    <Link to={`${basePath}/videos`} className="action-card card">
                        <div className="action-icon">🎥</div>
                        <h3>Video Lectures</h3>
                        <p>Watch recorded lessons</p>
                    </Link>

                    <Link to={`${basePath}/liveclass`} className="action-card card">
                        <div className="action-icon">📡</div>
                        <h3>Live Classes</h3>
                        <p>Join interactive sessions</p>
                    </Link>

                    <Link to={`${basePath}/assessment`} className="action-card card">
                        <div className="action-icon">✍️</div>
                        <h3>AI Assessments</h3>
                        <p>Test your skills</p>
                    </Link>
                </div>
            </div>

            <div className="motivational-card card mt-4">
                <h3>💡 Learning Tip of the Day</h3>
                <p>
                    "The capacity to learn is a gift; the ability to learn is a skill;
                    the willingness to learn is a choice." - Brian Herbert
                </p>
                <div className="tip-footer">
                    <span className="tip-icon">🌟</span>
                    <span>Keep learning, keep growing!</span>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
