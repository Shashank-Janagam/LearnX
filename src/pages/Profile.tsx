import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Award, BarChart3, Clock, Settings, Lock, Edit3,
  BookOpen, Trophy, Target, Users, AtSign
} from 'lucide-react';
const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function ProfilePage() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileData, setProfileData] = useState(null);
  const email = sessionStorage.getItem('userEmail');
  const userID = sessionStorage.getItem('userID');
  const [degree, setDegree] = useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${HOST_SERVER}/api/profile/email/${encodeURIComponent(email)}`
        );
        setProfileData(response.data);
        setUsername(response.data.username || '');
        if (response.data.education) {
          const { degree, course, institution, role } = response.data.education;
          setDegree(degree || '');
          setCourse(course || '');
          setInstitution(institution || '');
          setRole(role || '');
        }
        setFollowerCount(response.data.followers?.length || 0);
        setFollowingCount(response.data.following?.length || 0);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    const fetchFriends = async () => {
      try {
        const res = await axios.get(`${HOST_SERVER}/api/social/friends/${userID}`);
        setFriendCount(res.data.length || 0);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };

    if (email) fetchProfile();
    if (userID) fetchFriends();
  }, [email, userID]);

  const handleUsernameUpdate = async () => {
    setUsernameError('');
    if (!username || !/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
      setUsernameError('3-20 characters, lowercase letters, numbers, and underscores only');
      return;
    }
    try {
      const res = await axios.put(`${HOST_SERVER}/api/profile/update-username`, {
        email,
        username: username.toLowerCase()
      });
      alert('Username updated to @' + res.data.username);
      setIsEditingUsername(false);
      sessionStorage.setItem('username', res.data.username);
    } catch (err) {
      setUsernameError(err.response?.data?.error || 'Failed to update username');
    }
  };

  const handleEducationUpdate = async () => {
    try {
      await axios.put(`${HOST_SERVER}/api/profile/update-education`, {
        email, education: { degree, course, institution, role }
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
      await axios.put(`${HOST_SERVER}/api/profile/update-password`, { email, newPassword });
      alert('Password updated successfully!');
      setShowPasswordForm(false);
      setNewPassword('');
    } catch (error) {
      console.error('Password update failed:', error);
      alert('Error updating password.');
    }
  };

  if (!profileData) {
    return (
      <div className="profile-loading-container">
        <div className="profile-loading-card">
          <div className="spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learnx-profile-container">
      <header className="learnx-profile-header">
        <div className="learnx-header-inner">
          <div className="logo-container" onClick={() => navigate('/Home')}>
            <div className="logo-icon"><span className="logo-text">LearnX</span></div>
          </div>
          <div className="learnx-header-right">
            <div className="learnx-portal-label">
              <User className="learnx-icon-sm" /><span>Dashboard</span>
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
                  <img src="https://cdn.pixabay.com/photo/2024/03/28/18/06/dog-8661433_1280.png" alt="Profile" className="learnx-avatar-img" />
                  <div className="learnx-avatar-icon"><User className="learnx-icon-xs" /></div>
                </div>
                <div className="learnx-profile-info">
                  <h2>{profileData.name}</h2>
                  <div className="learnx-info-details">
                    <div className="learnx-info-item"><Mail className="learnx-icon-sm" /><span>{profileData.email}</span></div>
                    {profileData.username && (
                      <div className="learnx-info-item"><AtSign className="learnx-icon-sm" /><span>@{profileData.username}</span></div>
                    )}
                    <div className="learnx-info-item"><Award className="learnx-icon-sm" /><span className="learnx-role-badge">{profileData.education?.role || 'Student'}</span></div>
                  </div>
                </div>
              </div>
              <div className="social-stats-row">
                <div className="social-stat" onClick={() => navigate('/search')}><span className="social-count">{followerCount}</span><span className="social-label">Followers</span></div>
                <div className="social-stat" onClick={() => navigate('/search')}><span className="social-count">{followingCount}</span><span className="social-label">Following</span></div>
                <div className="social-stat" onClick={() => navigate('/search')}><span className="social-count">{friendCount}</span><span className="social-label">Friends</span></div>
              </div>
            </div>

            <div className="learnx-stats-card">
              <h3><BarChart3 className="learnx-icon-sm learnx-purple" /> Quiz Performance</h3>
              <div className="learnx-stats-grid">
                <div className="learnx-stat-box"><Trophy className="learnx-icon-sm learnx-gold" /><span>{profileData.stats.totalQuizzes}</span><p>Total Quizzes</p></div>
                <div className="learnx-stat-box"><Target className="learnx-icon-sm learnx-purple" /><span>{profileData.stats.averageScore}%</span><p>Average Score</p></div>
                <div className="learnx-stat-box"><Clock className="learnx-icon-sm learnx-green" /><span className="learnx-truncate">{profileData.stats.recentTopic}</span><p>Latest Topic</p></div>
              </div>
            </div>

            <div className="learnx-recent-quiz-card">
              <h3><BookOpen className="learnx-icon-sm learnx-purple" /> Recent Quiz History</h3>
              <div className="learnx-recent-list">
                {profileData.recentQuizzes.map((quiz, index) => (
                  <div key={index} className="learnx-recent-item">
                    <div className="learnx-recent-info"><h4>{quiz.topic}</h4><p>{quiz.date}</p></div>
                    <div className="learnx-recent-score"><div>{Math.round(quiz.score)}%</div><span>Score</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="learnx-right-column">
            <div className="learnx-settings-card">
              <h3><Settings className="learnx-icon-sm learnx-purple" /> Account Settings</h3>
              <div className="learnx-settings-options">
                <button className="learnx-settings-button" onClick={() => setIsEditingUsername(!isEditingUsername)}>
                  <AtSign className="learnx-icon-sm learnx-purple" />
                  <div>
                    <div className="info">{isEditingUsername ? 'Cancel' : (profileData.username ? 'Change Username' : 'Set Username')}</div>
                    <small>{profileData.username ? '@' + profileData.username : 'Set a unique username for your profile'}</small>
                  </div>
                </button>
                {isEditingUsername && (
                  <div className="learnx-education-form">
                    <input type="text" placeholder="username (3-20 chars, a-z, 0-9, _)" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                    {usernameError && <p style={{color: '#fca5a5', fontSize: '0.8rem', margin: '4px 0'}}>{usernameError}</p>}
                    <button onClick={handleUsernameUpdate} className="learnx-update-button">Update Username</button>
                  </div>
                )}

                <button className="learnx-settings-button" onClick={() => setIsEditingEducation(!isEditingEducation)}>
                  <Edit3 className="learnx-icon-sm learnx-purple" />
                  <div>
                    <div className="info">{isEditingEducation ? 'Cancel' : 'Edit Profile'}</div>
                    <small>{isEditingEducation ? 'Discard changes' : 'Update your information'}</small>
                  </div>
                </button>
                {isEditingEducation ? (
                  <div className="learnx-education-form">
                    <input type="text" placeholder="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} />
                    <input type="text" placeholder="Course" value={course} onChange={(e) => setCourse(e.target.value)} />
                    <input type="text" placeholder="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} />
                    <input type="text" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                    <button onClick={handleEducationUpdate} className="learnx-update-button">Update Education</button>
                  </div>
                ) : (
                  <div className="learnx-info-details">
                    <div className="learnx-info-item">🎓 <strong>Degree:</strong> {profileData.education?.degree || 'Not provided'}</div>
                    <div className="learnx-info-item">📘 <strong>Course:</strong> {profileData.education?.course || 'Not provided'}</div>
                    <div className="learnx-info-item">🏫 <strong>Institution:</strong> {profileData.education?.institution || 'Not provided'}</div>
                  </div>
                )}

                <button className="learnx-settings-button" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                  <Lock className="learnx-icon-sm learnx-purple" />
                  <div><div className="info">Change Password</div><small>Update your password</small></div>
                </button>
                {showPasswordForm && (
                  <div className="password-update-form">
                    <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <button onClick={handlePasswordUpdate}>Update</button>
                  </div>
                )}
              </div>
            </div>

            <div className="learnx-actions-card">
              <h3>Quick Actions</h3>
              <button className="learnx-primary-action" onClick={()=>navigate('/Home')}>Take New Quiz</button>
              <button className="learnx-primary-action collab-action" onClick={()=>navigate('/collab')}>
                <Users size={16} /> Collaborative Quiz
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
