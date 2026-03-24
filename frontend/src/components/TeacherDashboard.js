import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import NotesUpload from './teacher/NotesUpload';
import VideoUpload from './teacher/VideoUpload';
import LiveClass from './teacher/LiveClass';
import TeacherAssessment from './teacher/TeacherAssessment';
import ClassSubjectSelection from './teacher/ClassSubjectSelection';
import QuizCreator from './teacher/QuizCreator';
import QuickAccessHUD from './QuickAccessHUD';
import Chat from './Chat';
import Profile from './Profile';
import './TeacherDashboard.css';

const TeacherDashboard = ({ user, onLogout }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selection, setSelection] = useState(() => {
        const saved = localStorage.getItem('teacher_context');
        return saved ? JSON.parse(saved) : null;
    });

    const handleContextSelect = (data) => {
        setSelection(data);
        localStorage.setItem('teacher_context', JSON.stringify(data));
    };

    const menuItems = [
        { path: '/teacher', icon: '📊', label: 'Dashboard', exact: true },
        { path: '/teacher/notes', icon: '📝', label: 'Upload Notes' },
        { path: '/teacher/videos', icon: '🎬', label: 'Upload Videos' },
        { path: '/teacher/liveclass', icon: '📡', label: 'Go Live' },
        { path: '/teacher/assessment', icon: '📈', label: 'Overall Assessment' },
        { path: '/teacher/generate-quiz', icon: '📝', label: 'Generate Assessment' },
        { path: '/teacher/chat', icon: '💬', label: 'Student Chats' },
        { path: '/teacher/profile', icon: '👤', label: 'My Profile' }
    ];

    const isActive = (path, exact) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="dashboard-container">
            {!selection && <ClassSubjectSelection onSelect={handleContextSelect} />}
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
                    <div className="user-avatar teacher-avatar">👩‍🏫</div>
                    <div className="user-info">
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <span className="user-badge teacher-badge">Teacher</span>
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
                    <Route path="/" element={<TeacherHome user={user} selection={selection} onResetSelection={() => {
                        setSelection(null);
                        localStorage.removeItem('teacher_context');
                    }} />} />
                    <Route path="/notes" element={<NotesUpload user={user} selection={selection} />} />
                    <Route path="/videos" element={<VideoUpload user={user} selection={selection} />} />
                    <Route path="/liveclass" element={<LiveClass user={user} selection={selection} />} />
                    <Route path="/assessment" element={<TeacherAssessment user={user} selection={selection} />} />
                    <Route path="/generate-quiz" element={<QuizCreator user={user} selection={selection} />} />
                    <Route path="/chat" element={<Chat user={user} role="teacher" />} />
                    <Route path="/profile" element={<Profile user={user} />} />
                </Routes>
            </main>
            <QuickAccessHUD user={user} role="teacher" selection={selection} />
        </div>
    );
};

const TeacherHome = ({ user, selection, onResetSelection }) => {
    return (
        <div className="dashboard-home">
            <div className="welcome-banner teacher-banner">
                <h1>Welcome back, {user.name}! 👨‍🏫</h1>
                <p>Teaching: <strong>Standard {selection?.class}th - {selection?.subject}</strong></p>
                <button className="change-context-btn" onClick={onResetSelection}>Change Subject/Class</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Total Students</h3>
                        <p className="stat-value">45</p>
                        <span className="stat-change positive">+5 this week</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>Notes Uploaded</h3>
                        <p className="stat-value">12</p>
                        <span className="stat-change positive">+2 new</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">🎥</div>
                    <div className="stat-content">
                        <h3>Videos Uploaded</h3>
                        <p className="stat-value">8</p>
                        <span className="stat-change positive">+1 new</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                        <h3>New Messages</h3>
                        <p className="stat-value">3</p>
                        <span className="stat-change positive">Check inbox</span>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/teacher/notes" className="action-card card">
                        <div className="action-icon">📝</div>
                        <h3>Upload Notes</h3>
                        <p>Share new study materials</p>
                    </Link>

                    <Link to="/teacher/videos" className="action-card card">
                        <div className="action-icon">🎬</div>
                        <h3>Upload Video</h3>
                        <p>Add a new video lecture</p>
                    </Link>

                    <Link to="/teacher/liveclass" className="action-card card">
                        <div className="action-icon">📡</div>
                        <h3>Start Live Class</h3>
                        <p>Begin a real-time session</p>
                    </Link>

                    <Link to="/teacher/chat" className="action-card card">
                        <div className="action-icon">💬</div>
                        <h3>Check Messages</h3>
                        <p>Reply to student queries</p>
                    </Link>
                </div>
            </div>

            <div className="motivational-card card mt-4">
                <h3>💡 Teacher's Tip</h3>
                <p>
                    "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important." - Bill Gates
                </p>
                <div className="tip-footer">
                    <span className="tip-icon">🌟</span>
                    <span>Keep making a difference!</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
