import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Sparkles, Users, UserPlus, BookOpen, Plus, Award, Clock, ChevronRight, BookOpen as BookIcon } from 'lucide-react';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle.tsx';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

interface LearningModule {
  _id: string;
  title: string;
  description: string;
  topic: string;
  type: 'individual' | 'group';
  totalQuizzes: number;
  status: string;
  progress: Array<{
    user: string;
    completedQuizzes: any[];
    overallScore: number;
    punctualityRate: number;
  }>;
}

function Home() {
  const navigate = useNavigate();
  const historyRef = useRef<HTMLDivElement>(null);

  // User State
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [userID, setUserId] = useState('');
  const [userStats, setUserStats] = useState<any>({ totalQuizzes: 0, averageScore: 0, recentTopic: '' });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  
  // Learning Modules State
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moduleTopic, setModuleTopic] = useState('');
  const [isGeneratingModule, setIsGeneratingModule] = useState(false);
  const [moduleError, setModuleError] = useState('');

  // Groups State
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 10) {
        setIsHistoryOpen(true);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isHistoryOpen &&
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setIsHistoryOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousemove', handleClickOutside);
    return () => document.removeEventListener('mousemove', handleClickOutside);
  }, [isHistoryOpen]);

  useEffect(() => {
    const storedName = sessionStorage.getItem('userName');
    if (storedName) setUserName(storedName);
    const storedEmail = sessionStorage.getItem('userEmail');
    if (storedEmail) setEmail(storedEmail);
    const storedID = sessionStorage.getItem('userID');
    if (storedID) setUserId(storedID);

    if (!storedEmail) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (userName) {
      document.title = `LearnX | ${userName}`;
    }
  }, [userName]);

  // Fetch topics, profile stats, learning modules and groups
  useEffect(() => {
    if (!userID) return;

    const fetchTopicsAndStats = async () => {
      try {
        const res = await axios.get(`${HOST_SERVER}/history/${userID}`);
        const fetchedTopics = res.data.topics || [];
        setTopics(fetchedTopics);
        sessionStorage.setItem('topics', JSON.stringify(fetchedTopics));

        // Fetch User profile to get current stats
        const profileRes = await axios.get(`${HOST_SERVER}/api/profile/email/${encodeURIComponent(email)}`);
        if (profileRes.data && profileRes.data.stats) {
          setUserStats(profileRes.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch user history or stats:', error);
      }
    };

    const fetchModules = async () => {
      try {
        const res = await axios.get(`${HOST_SERVER}/api/modules/user/${userID}`);
        if (res.data.success) {
          setModules(res.data.modules);
        }
      } catch (error) {
        console.error('Failed to fetch learning modules:', error);
      }
    };

    const fetchMyGroups = async () => {
      try {
        setGroupsLoading(true);
        const res = await axios.get(`${HOST_SERVER}/api/groups/my-groups/${userID}`);
        setMyGroups(res.data || []);
      } catch (error) {
        console.error('Failed to fetch user groups:', error);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchTopicsAndStats();
    fetchModules();
    fetchMyGroups();
  }, [userID, email]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const handleHistoryClick = async (topicName: string) => {
    try {
      navigate('/QuizHistoryView', { state: { userID, topic: topicName } });
    } catch (err) {
      console.error('Failed to load result:', err);
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/Quiz', {
        state: {
          topic: searchQuery,
          userID,
          email
        }
      });
      setSearchQuery('');
    }
  };

  const navigateToProfile = () => {
    navigate('/Profile');
    setIsProfileMenuOpen(false);
  };

  // Create Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTopic.trim() || isGeneratingModule) return;

    try {
      setIsGeneratingModule(true);
      setModuleError('');
      const res = await axios.post(`${HOST_SERVER}/api/modules/create`, {
        topic: moduleTopic.trim(),
        userId: userID
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setModuleTopic('');
        navigate(`/module/${res.data.module._id}`);
      } else {
        setModuleError('AI could not generate a learning path for this topic. Try again.');
      }
    } catch (error: any) {
      console.error(error);
      setModuleError(error.response?.data?.message || 'Error generating learning path.');
    } finally {
      setIsGeneratingModule(false);
    }
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        {/* Logo */}
        <div className="logo-container" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <span className="logo-text">LearnX</span>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="header-actions">
          <button className="header-nav-btn" onClick={() => navigate('/collab')}>
            <Users size={16} />
            <span>Collab Quiz</span>
          </button>
          <button className="header-nav-btn" onClick={() => navigate('/search')}>
            <UserPlus size={16} />
            <span>Find Users</span>
          </button>
          <button className="header-nav-btn" onClick={() => navigate('/groups')}>
            <BookOpen size={16} />
            <span>Groups</span>
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Profile Icon */}
          <div className="profile-wrapper">
            <button className="profile-button" onClick={handleProfileClick}>
              <User className="profile-icon" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <button onClick={navigateToProfile} className="profile-dropdown-item">
                  View Profile
                </button>
                <button className="profile-dropdown-item" onClick={() => setIsHistoryOpen(true)}>History</button>
                <div className="profile-dropdown-separator">
                  <button className="profile-dropdown-item" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      <div
        ref={historyRef}
        className={`history-sidebar1 ${isHistoryOpen ? 'open' : ''}`}
      >
        <div className='logos' onClick={() => setIsHistoryOpen(false)}>
          <div className="logo-container" id="slider">
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
          <h2 className="history-title">Previous Topics</h2>
        </div>
        <div className="history-divider" />
        <div className="topic-list">
          {topics.map((topicName, index) => (
            <button
              key={index}
              className="topic-item"
              onClick={() => handleHistoryClick(topicName)}
              title={topicName}
            >
              {topicName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <main className="main-content">
        <div className="dashboard-grid">
          
          {/* Main Left Side (Welcome + Modules) */}
          <div className="dashboard-main-panel">
            <div className="welcome-banner">
              <h2>Welcome back, {userName}! 👋</h2>
              <p>Continue your learning journey or start a new path.</p>
            </div>

            {/* Search Bar - Create quick quiz */}
            <div className="dashboard-search-card">
              <h3>⚡ Quick AI Quiz</h3>
              <p>Type any topic to immediately test yourself with a personalized 5-question quiz.</p>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="search-wrapper">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="E.g. Binary Search, React Hooks, Cell Biology..."
                    className="search-input"
                  />
                  <button type="submit" className="search-submit" disabled={!searchQuery.trim()}>
                    <Search className="search-icon" />
                  </button>
                </div>
              </form>
            </div>

            {/* Learning Modules Section */}
            <div className="dashboard-section">
              <div className="section-header-row">
                <h3>📚 Your AI Learning Modules</h3>
                <button className="create-module-btn" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} /> Start Study Path
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="empty-modules-card">
                  <BookIcon size={32} className="empty-icon" />
                  <h4>No active learning modules</h4>
                  <p>AI Learning Modules create structured multi-quiz plans that unlock progressively.</p>
                  <button className="primary-action-btn" onClick={() => setIsModalOpen(true)}>
                    Generate My First Module
                  </button>
                </div>
              ) : (
                <div className="modules-list-grid">
                  {modules.map((mod) => {
                    const progressRec = mod.progress.find((p) => p.user && p.user.toString() === userID.toString());
                    const completed = progressRec ? progressRec.completedQuizzes.length : 0;
                    const percent = Math.round((completed / mod.totalQuizzes) * 100);

                    return (
                      <div 
                        key={mod._id} 
                        className="module-dashboard-card" 
                        onClick={() => navigate(`/module/${mod._id}`)}
                      >
                        <div className="card-top-row">
                          <span className={`mod-type-badge ${mod.type}`}>
                            {mod.type === 'group' ? '👥 Group' : '👤 Individual'}
                          </span>
                          <span className="mod-percentage">{percent}%</span>
                        </div>
                        <h4 className="mod-card-title">{mod.title}</h4>
                        <p className="mod-card-desc">{mod.description}</p>
                        
                        <div className="mod-card-progress-bar">
                          <div className="fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="card-bottom-row">
                          <span className="completed-label">{completed}/{mod.totalQuizzes} Quizzes Completed</span>
                          <ChevronRight size={16} className="arrow-icon" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Right Side (Stats + Quick actions) */}
          <div className="dashboard-sidebar">
            <div className="sidebar-widget stats-widget">
              <h3>📈 Learning Stats</h3>
              
              <div className="widget-stat-item">
                <Award className="widget-icon gold" />
                <div>
                  <div className="num">{userStats?.averageScore || 0}%</div>
                  <div className="lbl">Average Quiz Score</div>
                </div>
              </div>

              <div className="widget-stat-item">
                <Clock className="widget-icon blue" />
                <div>
                  <div className="num">{userStats?.totalQuizzes || 0}</div>
                  <div className="lbl">Total Quizzes Attempted</div>
                </div>
              </div>

              {userStats?.recentTopic && (
                <div className="recent-topic-box">
                  <span className="lbl">Last Topic Studied:</span>
                  <span className="topic">{userStats.recentTopic}</span>
                </div>
              )}
            </div>

            {/* My Groups Widget */}
            <div className="sidebar-widget groups-widget">
              <div className="widget-header-row">
                <h3>👥 My Study Groups</h3>
                <button className="widget-action-btn" onClick={() => navigate('/groups')}>
                  View All
                </button>
              </div>
              
              {groupsLoading ? (
                <div className="sidebar-loading">
                  <div className="spinner-small" style={{ borderTopColor: 'var(--accent)' }}></div>
                  <span>Loading groups...</span>
                </div>
              ) : myGroups.length === 0 ? (
                <div className="sidebar-empty">
                  <p>You haven't joined any study groups yet.</p>
                  <button className="join-group-link-btn" onClick={() => navigate('/groups')}>
                    Join/Create Group
                  </button>
                </div>
              ) : (
                <div className="sidebar-groups-list">
                  {myGroups.slice(0, 3).map((group: any) => (
                    <div 
                      key={group._id} 
                      className="sidebar-group-item" 
                      onClick={() => navigate(`/group/${group.code}`)}
                    >
                      <div className="group-item-avatar" style={{ background: `${group.color || '#6C5CE7'}22` }}>
                        {group.avatar || '📚'}
                      </div>
                      <div className="group-item-info">
                        <div className="group-name">{group.name}</div>
                        <div className="group-members-count">{group.memberCount} members</div>
                      </div>
                      <ChevronRight size={14} className="arrow-icon" />
                    </div>
                  ))}
                  {myGroups.length > 3 && (
                    <button className="view-more-groups-btn" onClick={() => navigate('/groups')}>
                      + {myGroups.length - 3} more groups
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="sidebar-widget shortcuts-widget">
              <h3>⚡ Quick Links</h3>
              <div className="shortcut-buttons">
                <button className="shortcut-btn" onClick={() => navigate('/collab')}>
                  <Users size={18} />
                  <div>
                    <strong>Real-time Room</strong>
                    <span>Compete live with friends</span>
                  </div>
                </button>
                
                <button className="shortcut-btn" onClick={() => navigate('/groups')}>
                  <BookOpen size={18} />
                  <div>
                    <strong>Study Groups</strong>
                    <span>Review schedules & AI Chat</span>
                  </div>
                </button>

                <button className="shortcut-btn" onClick={() => navigate('/search')}>
                  <UserPlus size={18} />
                  <div>
                    <strong>Connect</strong>
                    <span>Find & follow other students</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Create Module Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Start AI Learning Module</h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateModule}>
              <div className="form-group">
                <label>What topic do you want to master?</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Data Structures & Algorithms, Machine Learning Basics, Quantum Physics..."
                  value={moduleTopic}
                  onChange={(e) => setModuleTopic(e.target.value)}
                  disabled={isGeneratingModule}
                />
                <p className="field-help">
                  LearnX Groq AI will design a syllabus of progressive quizzes scheduled dynamically based on topic difficulty.
                </p>
              </div>

              {moduleError && <div className="modal-error-message">{moduleError}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isGeneratingModule}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={!moduleTopic.trim() || isGeneratingModule}
                >
                  {isGeneratingModule ? (
                    <>
                      <span className="spinner-small"></span> Generating study path...
                    </>
                  ) : 'Generate Study Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
