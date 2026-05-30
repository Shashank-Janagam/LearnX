import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CollabLobby.css';
import { Users, Plus, LogIn, Sparkles, ArrowLeft } from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function CollabLobby() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [topic, setTopic] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [config, setConfig] = useState({ count: 5, timeLimit: 300, difficulty: 'easy' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) navigate('/');
  }, [navigate]);

  useEffect(() => {
    document.title = 'LearnX | Collaborative Quiz';
  }, []);

  const handleCreateRoom = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(HOST_SERVER + '/api/rooms/create', {
        userID,
        topic: topic.trim(),
        config
      });
      navigate('/collab/' + res.data.roomCode, {
        state: { roomCode: res.data.roomCode, userID, isHost: true }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || joinCode.trim().length < 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(HOST_SERVER + '/api/rooms/' + joinCode.trim().toUpperCase());
      if (res.data.status !== 'waiting') {
        setError('This quiz has already started or is completed');
        return;
      }
      navigate('/collab/' + joinCode.trim().toUpperCase(), {
        state: { roomCode: joinCode.trim().toUpperCase(), userID, isHost: false }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="collab-lobby-container">
      <header className="collab-header">
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

      <main className="collab-main">
        <div className="collab-hero">
          <div className="hero-glow" />
          <Users className="hero-icon-collab" size={48} />
          <h1>Collaborative Quiz</h1>
          <p>Create a room or join one with friends. Everyone gets the same questions — compete for the top spot!</p>
        </div>

        <div className="collab-tabs">
          <button
            className={"tab-btn " + (activeTab === 'create' ? 'active' : '')}
            onClick={() => { setActiveTab('create'); setError(''); }}
          >
            <Plus size={18} />
            Create Room
          </button>
          <button
            className={"tab-btn " + (activeTab === 'join' ? 'active' : '')}
            onClick={() => { setActiveTab('join'); setError(''); }}
          >
            <LogIn size={18} />
            Join Room
          </button>
        </div>

        <div className="collab-card">
          {activeTab === 'create' ? (
            <div className="create-section">
              <div className="input-group">
                <label>Quiz Topic</label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures, Machine Learning..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="collab-input"
                />
              </div>

              <div className="config-row">
                <div className="input-group">
                  <label>Questions</label>
                  <select
                    value={config.count}
                    onChange={(e) => setConfig({ ...config, count: Number(e.target.value) })}
                    className="collab-select"
                  >
                    {[3, 5, 10, 15, 20].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Difficulty</label>
                  <select
                    value={config.difficulty}
                    onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                    className="collab-select"
                  >
                    <option value="introductory">Introductory</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Time (min)</label>
                  <select
                    value={config.timeLimit / 60}
                    onChange={(e) => setConfig({ ...config, timeLimit: Number(e.target.value) * 60 })}
                    className="collab-select"
                  >
                    {[1, 2, 3, 5, 10, 15, 20, 30].map(n => (
                      <option key={n} value={n}>{n} min</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="collab-btn primary"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? (
                  <><div className="btn-spinner" /> Creating...</>
                ) : (
                  <><Sparkles size={18} /> Create Room</>
                )}
              </button>
            </div>
          ) : (
            <div className="join-section">
              <div className="input-group">
                <label>Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-character room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="collab-input room-code-input"
                />
              </div>

              <button
                className="collab-btn primary"
                onClick={handleJoinRoom}
                disabled={loading || joinCode.trim().length < 6}
              >
                {loading ? (
                  <><div className="btn-spinner" /> Joining...</>
                ) : (
                  <><LogIn size={18} /> Join Room</>
                )}
              </button>
            </div>
          )}

          {error && <div className="collab-error">{error}</div>}
        </div>
      </main>
    </div>
  );
}

export default CollabLobby;
