import React from 'react';
import './Certificate.css';

const Certificate = ({ result, user, onBack }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="certificate-screen">
            <div className="certificate-container" id="printable-certificate">
                <div className="cert-border">
                    <div className="cert-inner">
                        <div className="cert-header">
                            <div className="cert-logo">SkillNest</div>
                            <h1>CERTIFICATE OF ACHIEVEMENT</h1>
                            <p className="cert-subtitle">Recognizing Excellence in AI Learning</p>
                        </div>

                        <div className="cert-body">
                            <h2 className="student-name">{user.name}</h2>
                            <p>has successfully completed the {result.problem_title ? 'Coding Challenge' : 'Assessment'} for</p>
                            <h3 className="course-name">
                                {result.problem_title ? `${result.problem_title} (${result.language})` : `${result.subject} (Standard ${result.standard})`}
                            </h3>

                            <div className="score-badge-cert">
                                <span className="label">Performance Score:</span>
                                <span className="value">{result.score}%</span>
                            </div>

                            <p className="cert-date">Issued on {new Date(result.timestamp).toLocaleDateString()}</p>
                        </div>

                        <div className="cert-footer">
                            <div className="signature">
                                <div className="line"></div>
                                <p>AI Evaluation System</p>
                            </div>
                            <div className="signature">
                                <div className="line"></div>
                                <p>SkillNest Academy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cert-actions no-print">
                <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / Save PDF</button>
                <button className="btn btn-secondary" onClick={onBack}>↩ Back to Results</button>
            </div>
        </div>
    );
};

export default Certificate;
