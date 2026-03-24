import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
    const { role } = useParams();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUseDemo = () => {
        setFormData({
            email: role === 'teacher' ? 'teacher@skillnest.com' : 'student@skillnest.com',
            password: role === 'teacher' ? 'teacher123' : 'student123',
            name: role === 'teacher' ? 'Professor Xavier' : 'James Bond'
        });
        setIsLogin(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/api/login' : '/api/register';
            const res = await axios.post(`http://localhost:5000${endpoint}`, {
                ...formData,
                role
            });

            if (res.data.success) {
                onLogin(res.data.user);
                navigate(role === 'teacher' ? '/teacher' : '/student');
            }
        } catch (err) {
            if (!err.response) {
                setError('Network Error: Cannot connect to the server. Please ensure the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="stars"></div>
            <div className="stars2"></div>
            <div className="stars3"></div>

            <div className={`login-card card glass ${role}-theme`}>
                <div className="role-badge">
                    <span>{role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}</span>
                    {role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
                </div>

                <div className="auth-header">
                    <h1>{isLogin ? 'Welcome Back' : 'Join SkillNest'}</h1>
                    <p>{isLogin ? 'Enter your credentials to continue' : 'Create an account to start your journey'}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-field">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="input-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button type="submit" className={`auth-btn btn ${role === 'teacher' ? 'btn-primary' : 'btn-secondary'}`} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="demo-link" onClick={handleUseDemo}>
                    ✨ Use Demo Credentials
                </div>

                <div className="auth-toggle">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button type="button" className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign up free' : 'Sign in here'}
                    </button>
                </div>
            </div>

            <Link to="/" className="back-btn">
                ← Back to Home
            </Link>
        </div>
    );
};

export default Login;
