import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/SearchUsers.css';
import { Search, UserPlus, UserMinus, Users, ArrowLeft, User } from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function SearchUsers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const userID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) navigate('/');
    document.title = 'LearnX | Find Users';
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(HOST_SERVER + '/api/social/search', {
          params: { q: query.trim(), userID }
        });
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, userID]);

  const fetchSocialData = useCallback(async (tab) => {
    if (!userID) return;
    setLoading(true);
    try {
      if (tab === 'followers') {
        const res = await axios.get(HOST_SERVER + '/api/social/followers/' + userID, { params: { viewerID: userID } });
        setFollowers(res.data);
      } else if (tab === 'following') {
        const res = await axios.get(HOST_SERVER + '/api/social/following/' + userID, { params: { viewerID: userID } });
        setFollowing(res.data);
      } else if (tab === 'friends') {
        const res = await axios.get(HOST_SERVER + '/api/social/friends/' + userID, { params: { viewerID: userID } });
        setFriends(res.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    if (activeTab !== 'search') {
      fetchSocialData(activeTab);
    }
  }, [activeTab, fetchSocialData]);

  const handleFollow = async (targetId) => {
    try {
      await axios.post(HOST_SERVER + '/api/social/follow/' + targetId, { userID });
      const updateList = prev => prev.map(u =>
        u._id === targetId ? { ...u, isFollowing: true } : u
      );
      setResults(updateList);
      setFollowers(updateList);
      setFollowing(updateList);
      setFriends(updateList);
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleUnfollow = async (targetId) => {
    try {
      await axios.post(HOST_SERVER + '/api/social/unfollow/' + targetId, { userID });
      const updateList = prev => prev.map(u =>
        u._id === targetId ? { ...u, isFollowing: false } : u
      );
      setResults(updateList);
      setFollowers(updateList);
      setFollowing(updateList);
      setFriends(updateList);
      if (activeTab === 'following') {
        setFollowing(prev => prev.filter(u => u._id !== targetId));
      }
      if (activeTab === 'friends') {
        setFriends(prev => prev.filter(u => u._id !== targetId));
      }
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  };

  const renderUserCard = (user, showFollowBtn = true) => (
    <div key={user._id} className="user-card">
      <div
        className="user-avatar"
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/profile/${user._id}`)}
      >
        {(user.name || 'U').charAt(0).toUpperCase()}
      </div>
      <div
        className="user-info"
        style={{ cursor: 'pointer', flex: 1 }}
        onClick={() => navigate(`/profile/${user._id}`)}
      >
        <span className="user-name">{user.name}</span>
        {user.username && <span className="user-username">@{user.username}</span>}
      </div>
      {showFollowBtn && (
        user.isFollowing ? (
          <button className="follow-btn following" onClick={(e) => { e.stopPropagation(); handleUnfollow(user._id); }}>
            <UserMinus size={14} /> Unfollow
          </button>
        ) : (
          <button className="follow-btn" onClick={(e) => { e.stopPropagation(); handleFollow(user._id); }}>
            <UserPlus size={14} /> Follow
          </button>
        )
      )}
    </div>
  );

  const getListData = () => {
    if (activeTab === 'followers') return followers;
    if (activeTab === 'following') return following;
    if (activeTab === 'friends') return friends;
    return [];
  };

  return (
    <div className="search-users-container">
      <header className="search-header">
        <div className="header-content">
          <div className="logo-container" onClick={() => navigate('/Home')}>
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
          <button className="back-nav" onClick={() => navigate('/Home')}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="search-main">
        <div className="search-hero">
          <Users size={40} className="search-hero-icon" />
          <h1>Find & Connect</h1>
          <p>Search for users, follow friends, and build your network</p>
        </div>

        <div className="search-tabs">
          {['search', 'followers', 'following', 'friends'].map(tab => (
            <button
              key={tab}
              className={"search-tab " + (activeTab === tab ? 'active' : '')}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'search' && <Search size={16} />}
              {tab === 'followers' && <User size={16} />}
              {tab === 'following' && <UserPlus size={16} />}
              {tab === 'friends' && <Users size={16} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'followers' && followers.length > 0 && <span className="tab-count">{followers.length}</span>}
              {tab === 'following' && following.length > 0 && <span className="tab-count">{following.length}</span>}
              {tab === 'friends' && friends.length > 0 && <span className="tab-count">{friends.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'search' && (
          <div className="search-bar-section">
            <div className="search-input-wrapper">
              <Search size={18} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input-field"
              />
            </div>
          </div>
        )}

        <div className="users-list">
          {activeTab === 'search' ? (
            results.length > 0 ? (
              results.map(u => renderUserCard(u, true))
            ) : query.trim().length >= 2 ? (
              <div className="empty-state">No users found for "{query}"</div>
            ) : (
              <div className="empty-state">Start typing to search for users</div>
            )
          ) : loading ? (
            <div className="empty-state">Loading...</div>
          ) : getListData().length > 0 ? (
            getListData().map(u => renderUserCard(u, true))
          ) : (
            <div className="empty-state">
              No {activeTab} yet
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SearchUsers;
