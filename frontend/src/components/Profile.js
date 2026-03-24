import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/profile/${user.role}/${user.id}`);
                if (response.data.success) {
                    setProfile(response.data.profile);
                    setFormData(response.data.profile);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/profile/update', {
                ...formData,
                role: user.role,
                id: user.id
            });
            if (response.data.success) {
                setProfile(formData);
                setIsEditing(false);
                alert('Profile updated successfully!');
            }
        } catch (error) {
            alert('Failed to update profile.');
        }
    };

    if (loading) return <div className="loading">Loading Profile...</div>;
    if (!profile && !isEditing) return <div className="profile-error">Profile data not found.</div>;

    return (
        <div className="profile-container">
            <div className="profile-card linkedin-style glass">
                <div className="profile-banner"></div>
                <div className="profile-header-content">
                    <div className="avatar-wrapper">
                        <div className={`profile-avatar ${user.role}-avatar`}>
                            {user.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
                        </div>
                    </div>

                    <div className="profile-main-info">
                        {isEditing ? (
                            <div className="edit-form-basic">
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className="edit-input name-input"
                                />
                                <input
                                    name="headline"
                                    value={formData.headline}
                                    onChange={handleChange}
                                    placeholder="Headline (e.g., Mathematics Teacher)"
                                    className="edit-input headline-input"
                                />
                                <input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Location"
                                    className="edit-input"
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="profile-name">{profile.name}</h1>
                                <p className="profile-headline">{profile.headline}</p>
                                <p className="profile-location">{profile.location} • <span className="contact-link">Contact info</span></p>
                            </>
                        )}

                        <div className="profile-actions">
                            {isEditing ? (
                                <button className="btn btn-primary" onClick={handleSave}>Save Profile</button>
                            ) : (
                                <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-sections">
                    <section className="profile-section card">
                        <h3>About</h3>
                        {isEditing ? (
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleChange}
                                rows="4"
                                className="edit-textarea"
                            />
                        ) : (
                            <p>{profile.about || 'Add an about section to tell people who you are.'}</p>
                        )}
                    </section>

                    {user.role === 'teacher' ? (
                        <section className="profile-section card">
                            <h3>Experience</h3>
                            {isEditing ? (
                                <textarea name="experience" value={formData.experience} onChange={handleChange} className="edit-textarea" />
                            ) : (
                                <p>{profile.experience || 'No experience added yet.'}</p>
                            )}
                        </section>
                    ) : (
                        <section className="profile-section card">
                            <h3>Projects</h3>
                            {isEditing ? (
                                <textarea name="projects" value={formData.projects} onChange={handleChange} className="edit-textarea" />
                            ) : (
                                <p>{profile.projects || 'No projects added yet.'}</p>
                            )}
                        </section>
                    )}

                    <section className="profile-section card">
                        <h3>Education</h3>
                        {isEditing ? (
                            <textarea name="education" value={formData.education} onChange={handleChange} className="edit-textarea" />
                        ) : (
                            <p>{profile.education || 'No education listed.'}</p>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
};

export default Profile;
