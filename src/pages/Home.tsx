import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Sparkles } from 'lucide-react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import quiz from './Quiz.tsx';
function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [userID, setUserId] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);

  const historyRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Show sidebar when mouse near edge
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 10) setIsHistoryOpen(true);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hide sidebar when clicked outside
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

  // Load user data
  useEffect(() => {
    const storedName = sessionStorage.getItem('userName');
    const storedEmail = sessionStorage.getItem('userEmail');
    const storedID = sessionStorage.getItem('userID');

    if (storedName) setUserName(storedName);
    if (storedEmail) setEmail(storedEmail);
    if (storedID) setUserId(storedID);

    if (!storedEmail) navigate('/');
  }, [navigate]);

  // Set page title
  useEffect(() => {
    document.title = `LearnX | ${userName}`;
  }, [userName]);

  // Fetch topic history
  useEffect(() => {
    const fetchTopics = async () => {
      const userID = sessionStorage.getItem('userID');
      if (!userID) return;

      try {
        const res = await axios.get(`https://learnx-ed1w.onrender.com/history/${userID}`);
        const fetchedTopics = res.data.topics || [];
        setTopics(fetchedTopics);
        sessionStorage.setItem('topics', JSON.stringify(fetchedTopics));
      } catch (error) {
        console.error('❌ Failed to fetch topics from DB:', error);
      }
    };
    fetchTopics();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const handleHistoryClick = (topic: string) => {
    navigate('/QuizHistoryView', { state: { userID, topic } });
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

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon">
            <span className="logo-text">LearnX</span>
          </div>
        </div>

        <div className="profile-wrapper">
          <button className="profile-button" onClick={handleProfileClick}>
            <User className="profile-icon" />
          </button>

          {isProfileMenuOpen && (
            <div className="profile-dropdown">
              <button onClick={navigateToProfile} className="profile-dropdown-item">View Profile</button>
              <button className="profile-dropdown-item">Settings</button>
              <button className="profile-dropdown-item" onClick={() => setIsHistoryOpen(true)}>History</button>
              <div className="profile-dropdown-separator">
                <button className="profile-dropdown-item" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div ref={historyRef} className={`history-sidebar ${isHistoryOpen ? 'open' : ''}`}>
        <div className='logos'>
          <div className="logo-container" id="slider">
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
          <h2 className="history-title">Previous Topics</h2>
        </div>
        <div className="history-divider" />
        <div className="topic-list">
          {topics.map((topic, index) => (
            <button
              key={index}
              className="topic-item"
              onClick={() => handleHistoryClick(topic)}
              title={topic}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <main className="main-content">
        <div className="hero-container">
          <div className="hero-text-container">
            <div className="hero-title-wrapper">
              <Sparkles className="hero-icon" />
              <h1 className="hero-title">
                Welcome, {userName} 👋
                What would you like to <span className="highlight-text">learn</span> today?
              </h1>
            </div>
            <p className="hero-subtitle">
              Discover knowledge through AI-Powered learning. Ask questions, explore topics, and expand your understanding.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-wrapper">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask me anything or explore a topic..."
                className="search-input"
              />
              <button type="submit" className="search-submit" disabled={!searchQuery.trim()}>
                <Search className="search-icon" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Home;
