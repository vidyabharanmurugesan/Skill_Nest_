import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Certificate from './Certificate';
import './QuizAssessment.css';

const QuizAssessment = ({ user, selection }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                // Pass standard to filter quizzes
                const std = selection?.class || '1';
                const response = await axios.get(`http://localhost:5000/api/quizzes?standard=${std}`);
                if (response.data.success) {
                    setQuizzes(response.data.quizzes);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, [selection]);

    const handleSubmit = async () => {
        try {
            const answerList = selectedQuiz.questions.map((q, idx) => answers[idx] ?? -1);
            const response = await axios.post('http://localhost:5000/api/assessment/submit', {
                student_id: user.id,
                student_name: user.name,
                quiz_id: selectedQuiz.id,
                subject: selectedQuiz.subject,
                standard: selectedQuiz.standard,
                answers: answerList
            });

            if (response.data.success) {
                setResult(response.data.result);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading">Loading Assessments...</div>;

    if (showCertificate && result) {
        return <Certificate result={result} user={user} onBack={() => setShowCertificate(false)} />;
    }

    if (result) {
        return (
            <div className="assessment-container">
                <div className="result-card card glass">
                    <div className="result-icon">🎯</div>
                    <h2>AI Assessment Result</h2>
                    <div className="score-display">
                        <span className="score-num">{result.score}%</span>
                    </div>
                    <div className="ai-feedback-box">
                        <h4>🤖 AI Evaluation Verdict:</h4>
                        <p>{result.ai_feedback}</p>
                    </div>
                    <div className="result-actions">
                        <button className="btn btn-success mb-3 w-100" onClick={() => setShowCertificate(true)}>
                            🎓 Generate Certificate
                        </button>
                        <button className="btn btn-primary w-100" onClick={() => { setResult(null); setSelectedQuiz(null); }}>
                            Back to Assessments
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedQuiz) {
        return (
            <div className="assessment-container">
                <div className="quiz-card card glass">
                    <button className="back-link" onClick={() => setSelectedQuiz(null)}>← Back</button>
                    <h2>{selectedQuiz.title}</h2>
                    <p>{selectedQuiz.subject} - Standard {selectedQuiz.standard}</p>

                    <div className="questions-list">
                        {selectedQuiz.questions.map((q, idx) => (
                            <div key={idx} className="question-item">
                                <p className="q-text">Q{idx + 1}. {q.q}</p>
                                <div className="options-grid">
                                    {q.options.map((opt, oIdx) => (
                                        <div
                                            key={oIdx}
                                            className={`option-btn ${answers[idx] === oIdx ? 'selected' : ''}`}
                                            onClick={() => setAnswers({ ...answers, [idx]: oIdx })}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-success submit-btn"
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length < selectedQuiz.questions.length}
                    >
                        Submit Assessment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="student-view-container">
            <div className="view-header">
                <h1>✍️ AI Assessments</h1>
                <p>Test your knowledge and get instant AI-powered feedback</p>
            </div>

            <div className="quizzes-grid">
                {quizzes.map(q => (
                    <div key={q.id} className="quiz-card-mini card">
                        <div className="subject-tag">{q.subject}</div>
                        <h3>{q.title}</h3>
                        <p>Standard {q.standard}</p>
                        <button className="btn btn-secondary mt-3" onClick={() => setSelectedQuiz(q)}>
                            Take Assessment
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizAssessment;
