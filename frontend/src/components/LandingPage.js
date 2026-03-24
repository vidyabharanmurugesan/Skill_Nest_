import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const [activeRole, setActiveRole] = useState(null);

    return (
        <div className={`landing-page ${activeRole ? `mood-${activeRole}` : ''}`}>
            <div className="stars"></div>
            <div className="stars2"></div>
            <div className="stars3"></div>

            <div className="landing-content">
                <div className="hero-section">
                    <h1 className="brand-title">
                        <span className="brand-skill">Skill</span>
                        <span className="brand-nest">Nest</span>
                    </h1>
                    <p className="tagline">Empowering Rural Minds through AI-Integrated Learning</p>
                    <p className="subtitle">Choose your portal to begin your educational journey</p>
                </div>

                <div className="identity-selector">
                    <div
                        className={`identity-card teacher-card ${activeRole === 'teacher' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveRole('teacher')}
                        onMouseLeave={() => setActiveRole(null)}
                    >
                        <Link to="/login/teacher" className="identity-link">
                            <div className="identity-glow"></div>
                            <div className="identity-content">
                                <div className="identity-icon">👨‍🏫</div>
                                <div className="identity-info">
                                    <h3>Educator Portal</h3>
                                    <p>Start teaching, upload notes, and manage your students</p>
                                    <div className="identity-action">Enter Nest →</div>
                                </div>
                            </div>
                            <div className="floating-elements">
                                <span>📚</span>
                                <span>🎥</span>
                                <span>✍️</span>
                            </div>
                        </Link>
                    </div>

                    <div
                        className={`identity-card student-card ${activeRole === 'student' ? 'active' : ''}`}
                        onMouseEnter={() => setActiveRole('student')}
                        onMouseLeave={() => setActiveRole(null)}
                    >
                        <Link to="/login/student" className="identity-link">
                            <div className="identity-glow"></div>
                            <div className="identity-content">
                                <div className="identity-icon">👨‍🎓</div>
                                <div className="identity-info">
                                    <h3>Learner Portal</h3>
                                    <p>Join classes, watch videos, and level up your skills</p>
                                    <div className="identity-action">Start Learning →</div>
                                </div>
                            </div>
                            <div className="floating-elements">
                                <span>🚀</span>
                                <span>🧩</span>
                                <span>💡</span>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="stats-section">
                    <div className="stat-item">
                        <div className="stat-value">5k+</div>
                        <div className="stat-label">Students</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">500+</div>
                        <div className="stat-label">Materials</div>
                    </div>
                </div>
            </div>

            <footer className="landing-footer">
                <p>&copy; 2026 SkillNest. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
