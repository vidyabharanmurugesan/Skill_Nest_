import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TeacherAssessment.css';

const TeacherAssessment = ({ user, selection }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDetail, setActiveDetail] = useState(null); // 'live', 'notes', 'videos'

    const fetchStats = useCallback(async () => {
        try {
            let url = `http://localhost:5000/api/teacher/stats/${user.id}`;
            const params = new URLSearchParams();
            if (selection?.subject) params.append('subject', selection.subject);
            if (selection?.class) params.append('standard', selection.class);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url);
            if (response.data.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user.id, selection]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleViewFile = (item, type) => {
        if (type === 'live') {
            alert(`--- Live Class Details ---\nTitle: ${item.title}\nSubject: ${item.subject}\nStandard: ${item.standard}\nStarted: ${new Date(item.started_at).toLocaleString()}\nParticipants: ${item.participants?.length || 0}`);
            return;
        }
        const url = `http://localhost:5000/api/download/${type}/${item.filename}`;
        window.open(url, '_blank');
    };

    const handleManualAssessment = async (studentName, currentFeedback) => {
        const newScore = prompt(`Enter new score for ${studentName}:`, "85");
        const newFeedback = prompt(`Enter new Teacher Feedback:`, currentFeedback);

        if (newScore !== null && newFeedback !== null) {
            try {
                const response = await axios.post('http://localhost:5000/api/assessment/update', {
                    student_name: studentName,
                    score: parseInt(newScore),
                    feedback: newFeedback,
                    teacher_id: user.id
                });
                if (response.data.success) {
                    alert('Assessment updated successfully!');
                    fetchStats();
                }
            } catch (error) {
                alert('Failed to update assessment.');
            }
        }
    };

    const handleCreateNewAssessment = async () => {
        const studentName = prompt("Enter Student Name:");
        if (!studentName) return;
        const subject = selection?.subject || prompt("Enter Subject:", "Mathematics");
        const standard = selection?.class || prompt("Enter Standard:", "12");
        const score = prompt("Enter Score (%):", "0");
        const feedback = prompt("Enter Feedback:", "Initial assessment.");

        try {
            const response = await axios.post('http://localhost:5000/api/assessment/submit', {
                student_name: studentName,
                student_id: 'MANUAL',
                quiz_id: 'MANUAL',
                subject: subject,
                standard: standard,
                answers: [],
                score: parseInt(score),
                feedback: feedback
            });
            if (response.data.success) {
                alert('New assessment record posted!');
                fetchStats();
            }
        } catch (error) {
            alert('Failed to post manual assessment.');
        }
    };

    if (loading) return <div className="loading">Loading Analytics...</div>;

    const handleVerifyContent = async (id, type, status = 'verified') => {
        try {
            const response = await axios.post('http://localhost:5000/api/content/verify', {
                id: id,
                type: type,
                status: status
            });
            if (response.data.success) {
                alert(`Content marked as ${status}!`);
                fetchStats();
            }
        } catch (error) {
            alert('Failed to update verification status.');
        }
    };

    const renderDetails = () => {
        if (!activeDetail) return null;

        let title = "";
        let items = [];

        if (activeDetail === 'live') {
            title = "Live Classes History";
            items = stats?.live_classes || [];
        } else if (activeDetail === 'notes') {
            title = "Shared Notes Library";
            items = stats?.notes || [];
        } else if (activeDetail === 'videos') {
            title = "Video Library Content";
            items = stats?.videos || [];
        }

        return (
            <div className="modal-overlay-analytics" onClick={() => setActiveDetail(null)}>
                <div className="detail-modal card glass" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{title}</h2>
                        <button className="close-btn-mini" onClick={() => setActiveDetail(null)}>✕</button>
                    </div>
                    <div className="modal-content-list">
                        {items.length === 0 ? (
                            <p className="no-data">No items found in this category.</p>
                        ) : (
                            <table className="analytics-table mini">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        {activeDetail === 'live' && <th>Participants</th>}
                                        {activeDetail !== 'live' && <th>Description</th>}
                                        <th>Date</th>
                                        <th>Audit Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <button
                                                    className="title-link-btn"
                                                    onClick={() => handleViewFile(item, activeDetail)}
                                                >
                                                    {item.title}
                                                </button>
                                            </td>
                                            <td>{item.subject || 'General'}</td>
                                            {activeDetail === 'live' &&
                                                <td>
                                                    <span className="participant-count">
                                                        👤 {item.participants?.length || 0} students
                                                    </span>
                                                </td>
                                            }
                                            {activeDetail !== 'live' && <td>{item.description || 'No description'}</td>}
                                            <td>{new Date(item.started_at || item.uploaded_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="audit-actions">
                                                    <span className={`status-badge ${item.status || 'pending'}`}>
                                                        {item.status === 'verified' ? '✅ Correct' : '⏳ Pending'}
                                                    </span>
                                                    {item.status !== 'verified' && (
                                                        <button
                                                            className="btn btn-mini btn-success ml-2"
                                                            onClick={() => handleVerifyContent(item.id, activeDetail)}
                                                        >
                                                            Mark Correct
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>📈 Performance & Workload Analytics</h1>
                <p>Viewing data for <strong>Standard {selection?.class}th - {selection?.subject}</strong></p>
            </div>

            <div className="stats-grid-analytics">
                <div className="stat-card-glass clickable" onClick={() => setActiveDetail('live')}>
                    <div className="card-top">
                        <h3>📡 Live Classes</h3>
                        <span className="click-hint">Click for details</span>
                    </div>
                    <div className="stat-number">{stats?.total_live || 0}</div>
                    <p>Total sessions conducted</p>
                </div>
                <div className="stat-card-glass clickable" onClick={() => setActiveDetail('notes')}>
                    <div className="card-top">
                        <h3>📝 Notes Shared</h3>
                        <span className="click-hint">Click for details</span>
                    </div>
                    <div className="stat-number">{stats?.total_notes || 0}</div>
                    <p>Study materials uploaded</p>
                </div>
                <div className="stat-card-glass clickable" onClick={() => setActiveDetail('videos')}>
                    <div className="card-top">
                        <h3>🎬 Video Library</h3>
                        <span className="click-hint">Click for details</span>
                    </div>
                    <div className="stat-number">{stats?.total_videos || 0}</div>
                    <p>Recorded lectures available</p>
                </div>
                <div className="stat-card-glass">
                    <div className="card-top">
                        <h3>👥 Participations</h3>
                    </div>
                    <div className="stat-number">{stats?.total_participations || 0}</div>
                    <p>Total student attendances</p>
                </div>
            </div>

            {renderDetails()}

            <div className="assessment-section mt-4">
                <div className="section-header-flex">
                    <h2>📊 Student AI Assessments</h2>
                    <button className="btn btn-primary btn-sm" onClick={handleCreateNewAssessment}>
                        ➕ Post Manual Grade
                    </button>
                </div>
                <div className="table-container card">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Subject</th>
                                <th>Score</th>
                                <th>AI Feedback</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.student_assessments?.map((record, index) => (
                                <tr key={index}>
                                    <td>{record.student_name}</td>
                                    <td>{record.subject}</td>
                                    <td>
                                        <div className={`score-badge ${record.score > 80 ? 'high' : 'medium'}`}>
                                            {record.score}%
                                        </div>
                                    </td>
                                    <td><span className="feedback-text">{record.ai_feedback}</span></td>
                                    <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-mini btn-primary"
                                            onClick={() => handleManualAssessment(record.student_name, record.ai_feedback)}
                                        >
                                            ✍️ Post Grade
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="workload-breakdown mt-4">
                <h2>📚 Subject-wise Productivity</h2>
                <div className="subject-list">
                    {Object.entries(stats?.subject_stats || {}).map(([sub, data]) => (
                        <div key={sub} className="subject-item card">
                            <h4>{sub}</h4>
                            <div className="bits">
                                <span>Notes: {data.notes}</span>
                                <span>Videos: {data.videos}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherAssessment;
