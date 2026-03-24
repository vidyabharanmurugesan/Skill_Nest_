import React, { useState } from 'react';
import './ClassSubjectSelection.css';

const ClassSubjectSelection = ({ onSelect }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const classes = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const subjects = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology',
        'English', 'Tamil', 'Computer Science', 'History', 'Geography'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedClass && selectedSubject) {
            onSelect({ class: selectedClass, subject: selectedSubject });
        }
    };

    return (
        <div className="selection-overlay">
            <div className="selection-card glass">
                <h2>🎓 Teaching Assignment</h2>
                <p>Please select the class and subject you are teaching today.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Select Standard</label>
                        <div className="grid-options">
                            {classes.map(c => (
                                <div
                                    key={c}
                                    className={`option-item ${selectedClass === c ? 'active' : ''}`}
                                    onClick={() => setSelectedClass(c)}
                                >
                                    {c}th
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="input-group mt-4">
                        <label>Select Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="selection-select"
                            required
                        >
                            <option value="">Choose Subject...</option>
                            {subjects.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary selection-btn"
                        disabled={!selectedClass || !selectedSubject}
                    >
                        Enter Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClassSubjectSelection;
