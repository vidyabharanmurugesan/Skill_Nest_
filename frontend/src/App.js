import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

function App() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('skillnest_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('skillnest_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('skillnest_user');
    localStorage.removeItem('teacher_context');
    localStorage.removeItem('student_context');
  };

  return (
    <Router>
      <div className="App">
        <div id="google_translate_element" className="translate-widget"></div>
        <Routes>
          <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
          <Route
            path="/login/:role"
            element={<Login onLogin={handleLogin} />}
          />
          <Route
            path="/teacher/*"
            element={
              user && user.role === 'teacher' ? (
                <TeacherDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/student/*"
            element={
              user && user.role === 'student' ? (
                <StudentDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
