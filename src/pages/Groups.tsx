import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Groups.css';
import { Users, Plus, LogIn, ArrowLeft, Search, BookOpen, Lock, Globe } from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

const EMOJI_OPTIONS = ['📚', '🧪', '💻', '🎓', '🔬', '📐', '🌍', '🎨', '🧠', '🚀', '🎵', '⚡'];

function Groups() {
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createVisibility, setCreateVisibility] = useState('public');
  const [createAvatar, setCreateAvatar] = useState('📚');
  const [createLoading, setCreateLoading] = useState(false);

  // Join modal state
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const userID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) navigate('/');
  }, [navigate]);

  useEffect(() => {
    document.title = 'LearnX | Study Groups';
  }, []);

  // Fetch user's groups
  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${HOST_SERVER}/api/groups/my-groups/${userID}`);
      setMyGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search public groups
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${HOST_SERVER}/api/groups/search/public`, {
          params: { q: searchQuery, userID }
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, userID]);

  // Create group
  const handleCreate = async () => {
    if (!createName.trim()) {
      setError('Please enter a group name');
      return;
    }
    setCreateLoading(true);
    setError('');
    try {
      const res = await axios.post(`${HOST_SERVER}/api/groups/create`, {
        userID,
        name: createName.trim(),
        description: createDesc.trim(),
        visibility: createVisibility,
        avatar: createAvatar
      });
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      navigate(`/groups/${res.data.code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  // Join group
  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.trim().length < 8) {
      setError('Please enter a valid 8-character group code');
      return;
    }
    setJoinLoading(true);
    setError('');
    try {
      await axios.post(`${HOST_SERVER}/api/groups/join`, {
        userID,
        code: joinCode.trim().toUpperCase()
      });
      setShowJoin(false);
      setJoinCode('');
      navigate(`/groups/${joinCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
    } finally {
      setJoinLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="groups-container">
      <header className="groups-header">
        <div className="header-content">
          <div className="logo-container" onClick={() => navigate('/Home')}>
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
          <button className="back-nav" onClick={() => navigate('/Home')}>
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      <main className="groups-main">
        {/* Hero */}
        <div className="groups-hero">
          <div className="hero-glow" />
          <Users className="groups-hero-icon" size={48} />
          <h1>Study Groups</h1>
          <p>Create or join study groups. Take quizzes together, chat with AI, and learn as a team.</p>
        </div>

        {/* Action Buttons */}
        <div className="groups-actions">
          <button className="groups-action-btn" onClick={() => { setShowCreate(true); setError(''); }}>
            <Plus size={18} />
            Create Group
          </button>
          <button className="groups-action-btn" onClick={() => { setShowJoin(true); setError(''); }}>
            <LogIn size={18} />
            Join Group
          </button>
        </div>

        {/* Search */}
        <div className="groups-search-wrapper">
          <Search size={18} className="groups-search-icon" />
          <input
            type="text"
            className="groups-search-input"
            placeholder="Search public groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <div className="groups-section-title">
              <Search size={14} />
              Search Results
            </div>
            <div className="groups-grid" style={{ marginBottom: '2rem' }}>
              {searchResults.map(g => (
                <div
                  key={g._id}
                  className="group-card"
                  style={{ '--group-color': g.color || '#6C5CE7' }}
                  onClick={() => {
                    if (g.isMember) {
                      navigate(`/groups/${g.code}`);
                    } else {
                      setJoinCode(g.code);
                      setShowJoin(true);
                    }
                  }}
                >
                  <div className="group-card-header">
                    <div className="group-card-avatar" style={{ background: `${g.color || '#6C5CE7'}22` }}>
                      {g.avatar || '📚'}
                    </div>
                    <div className="group-card-info">
                      <div className="group-card-name">{g.name}</div>
                      <div className="group-card-desc">{g.description || 'No description'}</div>
                    </div>
                  </div>
                  <div className="group-card-meta">
                    <span className="group-card-stat">
                      <Users size={14} />
                      {g.memberCount} members
                    </span>
                    {g.isMember ? (
                      <span className="group-card-badge public">Joined</span>
                    ) : (
                      <span className="group-card-badge private">Join</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* My Groups */}
        <div className="groups-section-title">
          <BookOpen size={14} />
          My Groups ({myGroups.length})
        </div>

        {loading ? (
          <div className="groups-loading">
            <div className="btn-spinner" />
            Loading groups...
          </div>
        ) : myGroups.length === 0 ? (
          <div className="groups-empty">
            <Users size={48} className="groups-empty-icon" />
            <h3>No groups yet</h3>
            <p>Create a new study group or join one with a group code to get started!</p>
          </div>
        ) : (
          <div className="groups-grid">
            {myGroups.map(g => (
              <div
                key={g._id}
                className="group-card"
                style={{ '--group-color': g.color || '#6C5CE7' }}
                onClick={() => navigate(`/groups/${g.code}`)}
              >
                <div className="group-card-header">
                  <div className="group-card-avatar" style={{ background: `${g.color || '#6C5CE7'}22` }}>
                    {g.avatar || '📚'}
                  </div>
                  <div className="group-card-info">
                    <div className="group-card-name">{g.name}</div>
                    <div className="group-card-desc">{g.description || 'No description'}</div>
                  </div>
                </div>
                <div className="group-card-meta">
                  <span className="group-card-stat">
                    <Users size={14} />
                    {g.memberCount}
                  </span>
                  <span className="group-card-stat">
                    <BookOpen size={14} />
                    {g.roomCount} rooms
                  </span>
                  <span className="group-card-badge {g.visibility}">
                    {g.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} />}
                    {g.visibility}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2><Plus size={20} /> Create Group</h2>

            <div className="groups-input-group">
              <label>Group Name</label>
              <input
                type="text"
                className="groups-input"
                placeholder="e.g., DSA Study Group"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="groups-input-group">
              <label>Description (optional)</label>
              <textarea
                className="groups-input groups-textarea"
                placeholder="What's this group about?"
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="groups-input-group">
              <label>Icon</label>
              <div className="emoji-row">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className={`emoji-pick ${createAvatar === emoji ? 'active' : ''}`}
                    onClick={() => setCreateAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="groups-input-group">
              <label>Visibility</label>
              <div className="visibility-toggle">
                <button
                  className={`visibility-option ${createVisibility === 'public' ? 'active' : ''}`}
                  onClick={() => setCreateVisibility('public')}
                >
                  <Globe size={14} /> Public
                </button>
                <button
                  className={`visibility-option ${createVisibility === 'private' ? 'active' : ''}`}
                  onClick={() => setCreateVisibility('private')}
                >
                  <Lock size={14} /> Private
                </button>
              </div>
            </div>

            {error && <div className="groups-error">{error}</div>}

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleCreate}
                disabled={createLoading || !createName.trim()}
              >
                {createLoading ? <><div className="btn-spinner" /> Creating...</> : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2><LogIn size={20} /> Join Group</h2>

            <div className="groups-input-group">
              <label>Group Code</label>
              <input
                type="text"
                className="groups-input join-code-input"
                placeholder="ABCD1234"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>

            {error && <div className="groups-error">{error}</div>}

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowJoin(false)}>
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleJoin}
                disabled={joinLoading || joinCode.trim().length < 8}
              >
                {joinLoading ? <><div className="btn-spinner" /> Joining...</> : 'Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;
