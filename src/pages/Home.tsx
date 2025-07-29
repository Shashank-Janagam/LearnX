import React, { useState, useEffect,useRef } from 'react';
import { Search, User, Sparkles } from 'lucide-react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import './Quiz.tsx';
import './Profile.tsx'
// import Login from './Login.tsx';
import './QuizHistoryView.tsx';

import axios from 'axios';
// import { set } from 'mongoose';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // const [queries, setQueries] = useState([]);
  const [userName, setUserName] = useState('');
  const [email,setEmail]=useState('');
  const [userID,setUserId]=useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]); // Store previous topics
  const historyRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  
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
  const storedEmail=sessionStorage.getItem('userEmail');
  if(storedEmail) setEmail(storedEmail);
  const storedID=sessionStorage.getItem('userID');
  if(storedID) setUserId(storedID);

  if (!storedEmail){
    navigate('/');
  }
}, []);

useEffect(() => {
  document.title = `LearnX | ${userName}`;
}, [userName]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    navigate('/');

  };

useEffect(() => {
  const fetchTopics = async () => {
    const userID = sessionStorage.getItem('userID');

    if (!userID) return;

    // Try getting from localStorage
    // const localTopics = sessionStorage.getItem('topics');

    // if (localTopics) {
    //   setTopics(JSON.parse(localTopics));
    // } else {
      try {
        const res = await axios.get(`https://learnx-ed1w.onrender.com/history/${userID}`);
        const fetchedTopics = res.data.topics || [];

        // Save in both state and localStorage
        setTopics(fetchedTopics);
        sessionStorage.setItem('topics', JSON.stringify(fetchedTopics||[]));
      } catch (error) {
        console.error('❌ Failed to fetch topics from DB:', error);
      }
    
  };

  fetchTopics();
}, []);

const handleHistoryClick = async (topic: string) => {
  try {
    // const res = await axios.get(`https://learnx-ed1w.onrender.com/history/${userID}/${topic}`);
    // console.log('Fetched result:', res.data);
    navigate('/QuizHistoryView', { state: { userID,topic } });
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
      try {
        // const res = await axios.post('https://learnx-ed1w.onrender.com/api/queries', {
        // topic: searchQuery,
        // userID: userID,
        // email: email
        // });

        // setQueries([res.data, ...queries]);
        setSearchQuery('');
     navigate('/Quiz', {
        state: {
          topic: searchQuery,
          userID,
          email
        }
          });
        
      } catch (error) {
        console.error('❌ Error submitting query:', error);
      }
    }
  };

  // useEffect(() => {
  //   const fetchQueries = async () => {
  //     try {
  //       const res = await axios.get('https://learnx-ed1w.onrender.com/api/queries',{
  //         params:{userID:userID}
  //       });
  //       setQueries(res.data);
  //     } catch (error) {
  //       console.error('❌ Error fetching queries:', error);
  //     }
  //   };

  //   fetchQueries();
  // }, []);

  const navigateToProfile = () => {
    navigate('/Profile');
    console.log('Navigation to Profile page');
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
          <div className="logo-icon">
            <span className="logo-text">LearnX</span>
          </div>
        </div>

        {/* Profile Icon */}
        <div className="profile-wrapper">
          <button className="profile-button" onClick={handleProfileClick}>
            <User className="profile-icon" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="profile-dropdown"        
  

>
              <button onClick={navigateToProfile} className="profile-dropdown-item">
                View Profile
              </button>
              {/* <button className="profile-dropdown-item">Settings</button> */}
              <button className="profile-dropdown-item"  onClick={() => setIsHistoryOpen(true)}>History</button>
              <div className="profile-dropdown-separator">
                <button className="profile-dropdown-item"   onClick={handleLogout}>
                  Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </header>
          <div
            ref={historyRef}
            className={`history-sidebar1 ${isHistoryOpen ? 'open' : ''}`}
          >
            <div className='logos' onClick={() => setIsHistoryOpen(false)}>
          <div className="logo-container" id="slider">
          <div className="logo-icon">
            <span className="logo-text" >LearnX</span>
          </div>
        </div>
            <h2 className="history-title" >Previous Topics</h2>
            </div>
  <div className="history-divider" />
            <div className="topic-list">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  className="topic-item"
                  onClick={() => handleHistoryClick(topic)}
                  title={topic} // shows full topic on hover
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

        

      {/* Main Content */}
      <main className="main-content">
        <div className="hero-container">
          {/* Hero Section */}
          <div className="hero-text-container">
            <div className="hero-title-wrapper">
              <Sparkles className="hero-icon" />
              <h1 className="hero-title">
                  Welcome, {userName} 👋

                What would you like to <span className="highlight-text">learn</span> today?
              </h1>
            </div>
            <p className="hero-subtitle">
              Discover knowledge through AI-Powered learning. Explore topics, and expand your understanding.
            </p>
          </div>

          {/* Search Bar */}
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

