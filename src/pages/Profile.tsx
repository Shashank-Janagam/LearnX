import React, { useState, useEffect } from 'react';
import './Profile.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Award, BarChart3, Clock, Settings, Lock, Edit3,
  BookOpen, Trophy, Target
} from 'lucide-react';

function ProfilePage() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileData, setProfileData] = useState(null);
  const email = sessionStorage.getItem('userEmail');
  const [degree, setDegree] = useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [role, setRole]=useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `https://learnx-ed1w.onrender.com/api/profile/email/${encodeURIComponent(email)}`
        );
        setProfileData(response.data);
        if (response.data.education) {
          const { degree, course, institution } = response.data.education;
          setDegree(degree || '');
          setCourse(course || '');
          setInstitution(institution || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (email) {
      fetchProfile();
    }
  }, [email]);

  const handleEducationUpdate = async () => {
    try {
      await axios.put(`https://learnx-ed1w.onrender.com/api/profile/update-education`, {
          email,
          education: {
            degree,
            course,
            institution,
            role
          }
        });
      alert('Educational info updated!');
      setIsEditingEducation(false);
    } catch (err) {
      console.error('Education update failed:', err);
      alert('Failed to update education.');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await axios.put(`https://learnx-ed1w.onrender.com/api/profile/update-password`, {
        email,
        newPassword,
      });
      alert('Password updated successfully!');
      setShowPasswordForm(false);
      setNewPassword('');
    } catch (error) {
      console.error('Password update failed:', error);
      alert('Error updating password.');
    }
  };

  if (!profileData) {
    return <div className="loading-text">Loading profile...</div>;
  }

  return (
    <div className="learnx-profile-container">
      <header className="learnx-profile-header">
        <div className="learnx-header-inner">
          <div className="logo-container" onClick={() => navigate('/Home')}>
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
          <div className="learnx-header-right">
            <div className="learnx-portal-label">
              <User className="learnx-icon-sm" />
              <span>Student Portal</span>
            </div>
          </div>
        </div>
      </header>

      <main className="learnx-profile-main">
        <div className="learnx-main-grid">
          <div className="learnx-left-column">
            <div className="learnx-profile-card">
              <div className="learnx-profile-header-section">
                <div className="learnx-avatar-wrapper">
                  <img
                    src="https://cdn.pixabay.com/photo/2024/03/28/18/06/dog-8661433_1280.png"
                    alt="Profile"
                    className="learnx-avatar-img"
                  />
                  <div className="learnx-avatar-icon">
                    <User className="learnx-icon-xs" />
                  </div>
                </div>
                <div className="learnx-profile-info">
                  <h2>{profileData.name}</h2>
                  <div className="learnx-info-details">
                    <div className="learnx-info-item">
                      <Mail className="learnx-icon-sm" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="learnx-info-item">
                      <Award className="learnx-icon-sm" />
                      <span className="learnx-role-badge">{profileData.education.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="learnx-stats-card">
              <h3><BarChart3 className="learnx-icon-sm learnx-purple" /> Quiz Performance</h3>
              <div className="learnx-stats-grid">
                <div className="learnx-stat-box">
                  <Trophy className="learnx-icon-sm learnx-gold" />
                  <span>{profileData.stats.totalQuizzes}</span>
                  <p>Total Quizzes</p>
                </div>
                <div className="learnx-stat-box">
                  <Target className="learnx-icon-sm learnx-purple" />
                  <span>{profileData.stats.averageScore}%</span>
                  <p>Average Score</p>
                </div>
                <div className="learnx-stat-box">
                  <Clock className="learnx-icon-sm learnx-green" />
<span className="learnx-truncate">{profileData.stats.recentTopic}</span>
                  <p>Latest Topic</p>
                </div>
              </div>
            </div>

            <div className="learnx-recent-quiz-card">
              <h3><BookOpen className="learnx-icon-sm learnx-purple" /> Recent Quiz History</h3>
              <div className="learnx-recent-list">
                {profileData.recentQuizzes.map((quiz, index) => (
                  <div key={index} className="learnx-recent-item">
                    <div className="learnx-recent-info">
                      <h4>{quiz.topic}</h4>
                      <p>{quiz.date}</p>
                    </div>
                    <div className="learnx-recent-score">
                      <div>{Math.round(quiz.score)}%</div>
                      <span>Score</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="learnx-right-column">
            <div className="learnx-settings-card">
              <h3><Settings className="learnx-icon-sm learnx-purple" /> Account Settings</h3>
              <div className="learnx-settings-options">
                <button
                  className="learnx-settings-button"
                  onClick={() => setIsEditingEducation(!isEditingEducation)}
                >
                  <Edit3 className="learnx-icon-sm learnx-purple" />
                  <div>
                    <div className="info">{isEditingEducation ? 'Cancel' : 'Edit Profile'}</div>
                    <small>{isEditingEducation ? 'Discard changes' : 'Update your information'}</small>
                  </div>
                </button>

{isEditingEducation ? (
  <div className="learnx-education-form">
    <input
      type="text"
      placeholder="Degree"
      value={degree}
      onChange={(e) => setDegree(e.target.value)}
    />
    <input
      type="text"
      placeholder="Course"
      value={course}
      onChange={(e) => setCourse(e.target.value)}
    />
    <input
      type="text"
      placeholder="Institution"
      value={institution}
      onChange={(e) => setInstitution(e.target.value)}
    />
        <input
      type="text"
      placeholder="Role"
      value={role}
      onChange={(e) => setRole(e.target.value)}
    />
    <button onClick={handleEducationUpdate} className="learnx-update-button">
      Update Education
    </button>
  </div>
) : (
  <div className="learnx-info-details">
    <div className="learnx-info-item">🎓 <strong>Degree:</strong> {profileData.education.degree || 'Not provided'}</div>
    <div className="learnx-info-item">📘 <strong>Course:</strong> {profileData.education.course || 'Not provided'}</div>
    <div className="learnx-info-item">🏫 <strong>Institution:</strong> {profileData.education.institution || 'Not provided'}</div>
  </div>
)}


                <button
                  className="learnx-settings-button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  <Lock className="learnx-icon-sm learnx-purple" />
                  <div>
                    <div className="info">Change Password</div>
                    <small>Update your password</small>
                  </div>
                </button>

                {showPasswordForm && (
                  <div className="password-update-form">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button onClick={handlePasswordUpdate}>Update</button>
                  </div>
                )}
              </div>
            </div>

            <div className="learnx-actions-card">
              <h3>Quick Actions</h3>
              <button className="learnx-primary-action">Take New Quiz</button>
              <button className="learnx-secondary-action">View All Results</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
