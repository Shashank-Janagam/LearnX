import React, { useState, useEffect } from 'react';
import '../styles/UserProfile.css';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Award, BarChart3, Clock, ArrowLeft,
  BookOpen, Trophy, Target, UserPlus, UserMinus, AtSign, Hash
} from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const myUserID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) { navigate('/'); return; }
    if (!userId) { navigate('/Home'); return; }

    // Redirect to own profile page
    if (userId === myUserID) { navigate('/Profile'); return; }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${HOST_SERVER}/api/profile/user/${userId}`);
        setProfileData(res.data);
        document.title = `LearnX | ${res.data.name}`;
        // Check if we're already following
        const amFollowing = res.data.followers?.some(
          (f: any) => f.toString() === myUserID
        );
        setIsFollowing(amFollowing || false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'User not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, myUserID, navigate]);

  const handleFollow = async () => {
    if (!myUserID || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.post(`${HOST_SERVER}/api/social/unfollow/${userId}`, { userID: myUserID });
        setIsFollowing(false);
        setProfileData((prev: any) => ({
          ...prev,
          followerCount: Math.max(0, (prev.followerCount || 0) - 1)
        }));
      } else {
        await axios.post(`${HOST_SERVER}/api/social/follow/${userId}`, { userID: myUserID });
        setIsFollowing(true);
        setProfileData((prev: any) => ({
          ...prev,
          followerCount: (prev.followerCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="up-loading-container">
        <div className="up-loading-card">
          <div className="up-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="up-loading-container">
        <div className="up-loading-card">
          <User size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
          <p>{error || 'Profile not found'}</p>
          <button className="up-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <header className="up-header">
        <div className="up-header-inner">
          <div className="up-logo" onClick={() => navigate('/Home')}>
            <span className="up-logo-text">LearnX</span>
          </div>
          <button className="up-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      <main className="up-main">
        <div className="up-grid">
          {/* Left Column */}
          <div className="up-left">
            {/* Profile Card */}
            <div className="up-card up-profile-card">
              <div className="up-avatar-wrapper">
                <div className="up-avatar-circle">
                  {(profileData.name || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="up-profile-info">
                <h2 className="up-name">{profileData.name}</h2>
                {profileData.username && (
                  <div className="up-info-item">
                    <AtSign size={14} className="up-icon-sm" />
                    <span>@{profileData.username}</span>
                  </div>
                )}
                <div className="up-display-id">
                  <Hash size={14} className="up-icon-sm" />
                  <span className="up-display-id-text">{profileData.displayId}</span>
                </div>
                <div className="up-info-item">
                  <Award size={14} className="up-icon-sm" />
                  <span className="up-role-badge">{profileData.education?.role || 'Student'}</span>
                </div>
              </div>

              {/* Social Stats */}
              <div className="up-social-stats">
                <div className="up-social-stat">
                  <span className="up-social-count">{profileData.followerCount || 0}</span>
                  <span className="up-social-label">Followers</span>
                </div>
                <div className="up-social-stat">
                  <span className="up-social-count">{profileData.followingCount || 0}</span>
                  <span className="up-social-label">Following</span>
                </div>
              </div>

              {/* Follow Button */}
              <button
                className={`up-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <span className="up-btn-spinner" />
                ) : isFollowing ? (
                  <><UserMinus size={16} /> Unfollow</>
                ) : (
                  <><UserPlus size={16} /> Follow</>
                )}
              </button>
            </div>

            {/* Education Card */}
            <div className="up-card">
              <h3 className="up-card-title">
                <BookOpen size={16} className="up-icon-purple" /> Education
              </h3>
              <div className="up-education-list">
                <div className="up-edu-item">🎓 <strong>Degree:</strong> {profileData.education?.degree || 'Not provided'}</div>
                <div className="up-edu-item">📘 <strong>Course:</strong> {profileData.education?.course || 'Not provided'}</div>
                <div className="up-edu-item">🏫 <strong>Institution:</strong> {profileData.education?.institution || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="up-right">
            {/* Stats Card */}
            <div className="up-card">
              <h3 className="up-card-title">
                <BarChart3 size={16} className="up-icon-purple" /> Quiz Performance
              </h3>
              <div className="up-stats-grid">
                <div className="up-stat-box">
                  <Trophy size={20} className="up-icon-gold" />
                  <span className="up-stat-val">{profileData.stats?.totalQuizzes || 0}</span>
                  <p>Total Quizzes</p>
                </div>
                <div className="up-stat-box">
                  <Target size={20} className="up-icon-purple" />
                  <span className="up-stat-val">{profileData.stats?.averageScore || 0}%</span>
                  <p>Average Score</p>
                </div>
                <div className="up-stat-box">
                  <Clock size={20} className="up-icon-green" />
                  <span className="up-stat-val up-truncate">{profileData.stats?.recentTopic || '—'}</span>
                  <p>Latest Topic</p>
                </div>
              </div>
            </div>

            {/* Recent Quizzes */}
            <div className="up-card">
              <h3 className="up-card-title">
                <BookOpen size={16} className="up-icon-purple" /> Recent Quiz History
              </h3>
              <div className="up-recent-list">
                {(profileData.recentQuizzes || []).length === 0 ? (
                  <p className="up-empty">No quizzes taken yet</p>
                ) : (
                  profileData.recentQuizzes.map((quiz: any, index: number) => (
                    <div key={index} className="up-recent-item">
                      <div className="up-recent-info">
                        <h4>{quiz.topic}</h4>
                        <p>{quiz.date}</p>
                      </div>
                      <div className="up-recent-score">
                        <div>{Math.round(quiz.score)}%</div>
                        <span>Score</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserProfile;
