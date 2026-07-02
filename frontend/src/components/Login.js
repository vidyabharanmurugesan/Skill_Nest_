import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

// Helper to lazily initialize Firebase Auth using configuration from the backend env
const getFirebaseAuth = async () => {
    const res = await axios.get('http://localhost:5000/api/config/firebase');
    const firebaseConfig = res.data;
    
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase API key is missing in server env variables.");
    }
    
    let app;
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return getAuth(app);
};

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
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [useCustomAccount, setUseCustomAccount] = useState(false);
    const [customGoogleEmail, setCustomGoogleEmail] = useState('');
    const [customGoogleName, setCustomGoogleName] = useState('');

    const triggerGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const auth = await getFirebaseAuth();
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (user && user.email) {
                const res = await axios.post('http://localhost:5000/api/auth/google', {
                    email: user.email,
                    name: user.displayName || 'Google User',
                    role
                });
                if (res.data.success) {
                    onLogin(res.data.user);
                    navigate(role === 'teacher' ? '/teacher' : '/student');
                }
            }
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            setError(`Firebase login failed: ${err.message || err}. Falling back to simulated selector...`);
            setShowGoogleModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async (email, name) => {
        setLoading(true);
        setError('');
        setShowGoogleModal(false);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/google', {
                email,
                name,
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
                setError(err.response?.data?.message || 'Google Authentication failed.');
            }
        } finally {
            setLoading(false);
        }
    };

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
            if (isLogin) {
                // Try logging in with Firebase first
                try {
                    const auth = await getFirebaseAuth();
                    await signInWithEmailAndPassword(auth, formData.email, formData.password);
                } catch (fbErr) {
                    // Fallback to local auth if it's a pre-configured demo credential
                    const isDemo = (role === 'teacher' && formData.email === 'teacher@skillnest.com' && formData.password === 'teacher123') ||
                                   (role === 'student' && formData.email === 'student@skillnest.com' && formData.password === 'student123');
                    if (!isDemo) {
                        let friendlyMsg = fbErr.message;
                        if (fbErr.code === 'auth/invalid-credential') {
                            friendlyMsg = 'Invalid email or password. Please try again.';
                        } else if (fbErr.code === 'auth/user-not-found') {
                            friendlyMsg = 'No account found with this email.';
                        } else if (fbErr.code === 'auth/wrong-password') {
                            friendlyMsg = 'Incorrect password.';
                        }
                        throw new Error(friendlyMsg);
                    } else {
                        console.log("Bypassing Firebase Auth (local-only fallback) for demo user.");
                    }
                }

                // Authenticate with local backend JSON database
                const res = await axios.post('http://localhost:5000/api/login', {
                    email: formData.email,
                    password: formData.password,
                    role
                });

                if (res.data.success) {
                    onLogin(res.data.user);
                    navigate(role === 'teacher' ? '/teacher' : '/student');
                }
            } else {
                // Register in Firebase Auth first
                const auth = await getFirebaseAuth();
                await createUserWithEmailAndPassword(auth, formData.email, formData.password);

                // Store registered user in local JSON database
                const res = await axios.post('http://localhost:5000/api/register', {
                    ...formData,
                    role
                });

                if (res.data.success) {
                    onLogin(res.data.user);
                    navigate(role === 'teacher' ? '/teacher' : '/student');
                }
            }
        } catch (err) {
            console.error("Auth Exception:", err);
            if (err.message && !err.response) {
                setError(err.message);
            } else if (!err.response) {
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

                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                <button
                    type="button"
                    className="google-btn"
                    onClick={triggerGoogleSignIn}
                    disabled={loading}
                >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#ea4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.57 15.01 1 12 1 7.24 1 3.2 3.73 1.25 7.68l3.87 3C6.07 7.75 8.79 5.04 12 5.04z" />
                        <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.62z" />
                        <path fill="#fbbc05" d="M5.12 10.68c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 3.12C.45 4.72 0 6.51 0 8.4s.45 3.68 1.25 5.28l3.87-3z" />
                        <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.21 0-5.93-2.71-6.88-5.64l-3.87 3C3.2 20.27 7.24 23 12 23z" />
                    </svg>
                    <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </button>

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

            {showGoogleModal && (
                <div className="google-modal-overlay">
                    <div className="google-modal-card glass">
                        <div className="google-modal-header">
                            <svg className="google-logo-large" viewBox="0 0 24 24" width="32" height="32">
                                <path fill="#ea4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.57 15.01 1 12 1 7.24 1 3.2 3.73 1.25 7.68l3.87 3C6.07 7.75 8.79 5.04 12 5.04z" />
                                <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2 3.7-5.02 3.7-8.62z" />
                                <path fill="#fbbc05" d="M5.12 10.68c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 3.12C.45 4.72 0 6.51 0 8.4s.45 3.68 1.25 5.28l3.87-3z" />
                                <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.21 0-5.93-2.71-6.88-5.64l-3.87 3C3.2 20.27 7.24 23 12 23z" />
                            </svg>
                            <h2>Sign in with Google</h2>
                            <p>to continue to SkillNest</p>
                        </div>
                        
                        <div className="google-modal-body">
                            {!useCustomAccount ? (
                                <div className="google-accounts-list">
                                    <div className="google-account-item" onClick={() => handleGoogleAuth(role === 'teacher' ? 'teacher.google@skillnest.com' : 'student.google@skillnest.com', role === 'teacher' ? 'Professor Xavier (Google)' : 'James Bond (Google)')}>
                                        <div className="google-avatar">{role === 'teacher' ? 'PX' : 'JB'}</div>
                                        <div className="google-account-details">
                                            <span className="google-name">{role === 'teacher' ? 'Professor Xavier (Google)' : 'James Bond (Google)'}</span>
                                            <span className="google-email">{role === 'teacher' ? 'teacher.google@skillnest.com' : 'student.google@skillnest.com'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="google-account-item use-different" onClick={() => setUseCustomAccount(true)}>
                                        <span className="plus-icon">➕</span>
                                        <span>Use another account</span>
                                    </div>
                                </div>
                            ) : (
                                <form className="google-custom-form" onSubmit={(e) => {
                                    e.preventDefault();
                                    if (customGoogleEmail && customGoogleName) {
                                        handleGoogleAuth(customGoogleEmail, customGoogleName);
                                    }
                                }}>
                                    <div className="input-field">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name"
                                            value={customGoogleName}
                                            onChange={(e) => setCustomGoogleName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="input-field">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="name@gmail.com"
                                            value={customGoogleEmail}
                                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="google-custom-actions">
                                        <button type="button" className="btn text-btn" onClick={() => setUseCustomAccount(false)}>
                                            Back
                                        </button>
                                        <button type="submit" className={`btn ${role === 'teacher' ? 'btn-primary' : 'btn-secondary'} google-submit-btn`}>
                                            Continue
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        
                        <button className="google-modal-close" onClick={() => {
                            setShowGoogleModal(false);
                            setUseCustomAccount(false);
                        }}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
