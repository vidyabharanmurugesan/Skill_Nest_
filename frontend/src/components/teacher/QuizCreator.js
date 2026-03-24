import React, { useState } from 'react';
import axios from 'axios';
import '../TeacherDashboard.css'; // Reusing some teacher styles

const QuizCreator = ({ user, selection }) => {
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([
        { q: '', options: ['', '', '', ''], correct: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const API_URL = 'http://localhost:5000';

    const handleAddQuestion = () => {
        setQuestions([...questions, { q: '', options: ['', '', '', ''], correct: 0 }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        if (field === 'q') {
            newQuestions[index].q = value;
        } else if (field === 'correct') {
            newQuestions[index].correct = parseInt(value);
        }
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleRemoveQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/quizzes/create`, {
                title,
                subject: selection?.subject || 'General',
                standard: selection?.class || '1',
                teacher_id: user.id,
                questions
            });

            if (response.data.success) {
                alert('Quiz created successfully for Standard ' + (selection?.class || '1') + '!');
                setTitle('');
                setQuestions([{ q: '', options: ['', '', '', ''], correct: 0 }]);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quiz-creator-container">
            <div className="view-header">
                <h1>📝 Create Assessment</h1>
                <p>Generate a manual quiz for <strong>Standard {selection?.class || '1'}th - {selection?.subject || 'General'}</strong></p>
            </div>

            <form className="quiz-form card glass" onSubmit={handleSubmit}>
                <div className="form-group mb-4">
                    <label>Quiz Title</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Basic Science Test"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="questions-builder">
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="question-block card">
                            <div className="block-header">
                                <h3>Question {qIdx + 1}</h3>
                                {questions.length > 1 && (
                                    <button type="button" className="btn-close" onClick={() => handleRemoveQuestion(qIdx)}>✕</button>
                                )}
                            </div>

                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Enter your question here..."
                                value={q.q}
                                onChange={(e) => handleQuestionChange(qIdx, 'q', e.target.value)}
                                required
                            />

                            <div className="options-input-grid">
                                {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="option-input-group">
                                        <input
                                            type="radio"
                                            name={`correct_${qIdx}`}
                                            checked={q.correct === oIdx}
                                            onChange={() => handleQuestionChange(qIdx, 'correct', oIdx)}
                                        />
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Option ${oIdx + 1}`}
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="form-actions mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleAddQuestion}>
                        ➕ Add Another Question
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Generating...' : '🚀 Publish Assessment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuizCreator;
