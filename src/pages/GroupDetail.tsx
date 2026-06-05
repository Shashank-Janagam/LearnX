import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../styles/GroupDetail.css';
import '../styles/Groups.css';
import GroupChat from './GroupChat.tsx';
import {
  ArrowLeft, MessageCircle, BookOpen, Users, Plus, Copy, Check,
  LogOut, Clock, User, Sparkles, Shield, Trophy, X
} from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function GroupDetail() {
  const { groupCode } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Members state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Modules state
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [moduleTopic, setModuleTopic] = useState('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleError, setModuleError] = useState('');

  // Post room modal
  const [showPostRoom, setShowPostRoom] = useState(false);
  const [roomTopic, setRoomTopic] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomConfig, setRoomConfig] = useState({ count: 5, timeLimit: 300, difficulty: 'easy' });
  const [postingRoom, setPostingRoom] = useState(false);
  const [error, setError] = useState('');

  // Results modal
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [resultsTab, setResultsTab] = useState<'leaderboard' | 'questions'>('leaderboard');

  // Copy code
  const [copied, setCopied] = useState(false);

  const userID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) navigate('/');
  }, [navigate]);

  // Initialize socket and join the group socket room for real-time updates
  useEffect(() => {
    const s = io(HOST_SERVER);
    setSocket(s);

    s.on('connect', () => {
      // Join the group socket room so we receive group:room-posted events
      // even when not on the Chat tab (GroupChat also joins but only when rendered)
      s.emit('group:join-chat', { groupCode, userID });
    });

    return () => {
      s.emit('group:leave-chat', { groupCode });
      s.disconnect();
    };
  }, [groupCode, userID]);

  // Fetch group details
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}`);
        setGroup(res.data);
        document.title = `LearnX | ${res.data.name}`;
      } catch (err) {
        console.error('Failed to fetch group:', err);
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupCode, navigate]);

  // Fetch content when tab changes
  useEffect(() => {
    if (activeTab === 'rooms') fetchRooms();
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'modules') fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (group) {
      fetchModules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  // Listen for new rooms via socket (real-time room posting)
  useEffect(() => {
    if (!socket) return;
    const handleRoomPosted = (room) => {
      setRooms(prev => {
        // Avoid duplicate if already exists
        if (prev.some(r => r.roomCode === room.roomCode)) return prev;
        return [room, ...prev];
      });
    };
    socket.on('group:room-posted', handleRoomPosted);
    return () => socket.off('group:room-posted', handleRoomPosted);
  }, [socket]);

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}/rooms`);
      setRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchModules = async () => {
    if (!group) return;
    setModulesLoading(true);
    try {
      const res = await axios.get(`${HOST_SERVER}/api/modules/group/${group._id}`);
      if (res.data.success) {
        setModules(res.data.modules);
      }
    } catch (err) {
      console.error('Failed to fetch group modules:', err);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleTopic.trim()) {
      setModuleError('Please enter a topic');
      return;
    }
    setCreatingModule(true);
    setModuleError('');
    try {
      const res = await axios.post(`${HOST_SERVER}/api/modules/create-group`, {
        topic: moduleTopic.trim(),
        groupId: group._id,
        creatorId: userID
      });
      if (res.data.success) {
        setShowCreateModule(false);
        setModuleTopic('');
        fetchModules();
      }
    } catch (err: any) {
      setModuleError(err.response?.data?.message || 'Failed to create module');
    } finally {
      setCreatingModule(false);
    }
  };

  // Post a room to the group
  const handlePostRoom = async () => {
    if (!roomTopic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setPostingRoom(true);
    setError('');
    try {
      const res = await axios.post(`${HOST_SERVER}/api/groups/${groupCode}/post-room`, {
        userID,
        topic: roomTopic.trim(),
        description: roomDescription.trim(),
        config: roomConfig
      });
      setShowPostRoom(false);
      setRoomTopic('');
      setRoomDescription('');
      // Navigate to the collab quiz
      navigate(`/collab/${res.data.roomCode}`, {
        state: { roomCode: res.data.roomCode, userID, isHost: true }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post room');
    } finally {
      setPostingRoom(false);
    }
  };

  // Fetch completed room results
  const fetchRoomResults = async (roomCode: string) => {
    setResultsLoading(true);
    setResultsData(null);
    setResultsError('');
    setResultsTab('leaderboard');
    setShowResults(true);
    try {
      const res = await axios.get(`${HOST_SERVER}/api/groups/${groupCode}/rooms/${roomCode}/results`, {
        params: { userID }
      });
      setResultsData(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load results';
      setResultsError(msg);
      console.error('Failed to fetch results:', err.response?.data || err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  // Copy group code
  const copyCode = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Leave group
  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await axios.post(`${HOST_SERVER}/api/groups/leave`, {
        userID,
        code: groupCode
      });
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave group');
    }
  };

  // Remove member (admin only)
  const handleRemoveMember = async (targetUserID) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await axios.delete(`${HOST_SERVER}/api/groups/${groupCode}/remove-member`, {
        data: { adminID: userID, targetUserID }
      });
      setMembers(prev => prev.filter(m => m._id !== targetUserID));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
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
    return d.toLocaleDateString();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2);
  };

  const isAdmin = group?.admins?.some(a => a.toString() === userID);

  if (loading) {
    return (
      <div className="group-detail-container">
        <div className="tab-loading">
          <div className="btn-spinner" />
          Loading group...
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="group-detail-container">
      {/* Header */}
      <header className="group-detail-header">
        <div className="header-content">
          <div className="group-header-info">
            <button className="back-nav" onClick={() => navigate('/groups')} style={{ marginRight: '8px' }}>
              <ArrowLeft size={18} />
            </button>
            <div className="group-header-avatar" style={{ background: `${group.color || '#6C5CE7'}22` }}>
              {group.avatar || '📚'}
            </div>
            <div className="group-header-text">
              <h2>{group.name}</h2>
              <span>{group.members?.length || 0} members</span>
            </div>
          </div>
          <div className="group-header-actions">
            <div
              className={`group-code-badge ${copied ? 'copied' : ''}`}
              onClick={copyCode}
              title="Click to copy group code"
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> {groupCode}</>}
            </div>
            {group.creator?.toString() !== userID && (
              <button className="group-leave-btn" onClick={handleLeave}>
                <LogOut size={14} />
                Leave
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="group-tabs">
        <button
          className={`group-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageCircle size={16} />
          Chat
        </button>
        <button
          className={`group-tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <BookOpen size={16} />
          Rooms
          {rooms.filter(r => r.status === 'waiting').length > 0 && (
            <span className="group-tab-badge">{rooms.filter(r => r.status === 'waiting').length}</span>
          )}
        </button>
        <button
          className={`group-tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={16} />
          Members
          <span className="group-tab-badge">{group.members?.length || 0}</span>
        </button>
        <button
          className={`group-tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Sparkles size={16} style={{ color: '#fbbf24' }} />
          AI Modules
          <span className="group-tab-badge">{modules.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="group-tab-content">
        {/* Chat Tab */}
        {activeTab === 'chat' && socket && (
          <GroupChat
            socket={socket}
            groupCode={groupCode}
            groupName={group.name}
            userID={userID}
          />
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="rooms-tab-content">
            <button className="rooms-post-btn" onClick={() => { setShowPostRoom(true); setError(''); }}>
              <Plus size={18} />
              Post a Quiz Room
            </button>

            {roomsLoading ? (
              <div className="tab-loading">
                <div className="btn-spinner" />
                Loading rooms...
              </div>
            ) : rooms.length === 0 ? (
              <div className="tab-empty">
                <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <h3>No rooms yet</h3>
                <p>Post a quiz room for your group members to join and compete!</p>
              </div>
            ) : (
              <div className="room-list">
                {rooms.map((room, idx) => (
                  <div key={idx} className="room-item">
                    <div className="room-item-header">
                      <span className="room-item-topic">{room.topic}</span>
                      <span className={`room-item-status ${room.status}`}>{room.status}</span>
                    </div>
                    {room.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                        {room.description}
                      </p>
                    )}
                    <div className="room-item-meta">
                      <span><User size={13} /> {room.postedByName}</span>
                      <span><Clock size={13} /> {formatTime(room.postedAt)}</span>
                      <span><Users size={13} /> {room.participantCount || 0} joined</span>
                    </div>
                    {room.status === 'waiting' && (
                      <button
                        className="room-join-btn"
                        onClick={() => navigate(`/collab/${room.roomCode}`, {
                          state: { roomCode: room.roomCode, userID, isHost: false }
                        })}
                      >
                        <Sparkles size={14} />
                        Join Room
                      </button>
                    )}
                    {room.status === 'completed' && (
                      <button
                        className="room-join-btn"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                        onClick={() => fetchRoomResults(room.roomCode)}
                      >
                        <Trophy size={14} />
                        View Results
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="members-tab-content">
            {/* Invite Section */}
            <div className="members-invite-section">
              <p>Share this code with friends to invite them</p>
              <div className="invite-code">{groupCode}</div>
              <button className="invite-copy-btn" onClick={copyCode}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
              </button>
            </div>

            {membersLoading ? (
              <div className="tab-loading">
                <div className="btn-spinner" />
                Loading members...
              </div>
            ) : (
              <div className="member-list">
                {members.map((member) => (
                  <div key={member._id} className="member-item">
                    <div
                      className="member-avatar"
                      style={{ cursor: 'pointer' }}
                      onClick={() => member._id !== userID && navigate(`/profile/${member._id}`)}
                      title={member._id !== userID ? 'View profile' : 'Your profile'}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div
                      className="member-info"
                      style={{ cursor: member._id !== userID ? 'pointer' : 'default', flex: 1 }}
                      onClick={() => member._id !== userID && navigate(`/profile/${member._id}`)}
                    >
                      <div className="member-name">{member.name}</div>
                      {member.username && (
                        <div className="member-username">@{member.username}</div>
                      )}
                    </div>
                    {member.isCreator ? (
                      <span className="member-role-badge creator">
                        <Shield size={10} /> Admin
                      </span>
                    ) : member.role === 'admin' ? (
                      <span className="member-role-badge admin">Admin</span>
                    ) : null}
                    {isAdmin && !member.isCreator && member._id !== userID && (
                      <button
                        className="member-remove-btn"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="rooms-tab-content">
            <button className="rooms-post-btn" onClick={() => { setShowCreateModule(true); setModuleError(''); }}>
              <Plus size={18} />
              Start Group Learning Module
            </button>

            {modulesLoading ? (
              <div className="tab-loading">
                <div className="btn-spinner" />
                Loading modules...
              </div>
            ) : modules.length === 0 ? (
              <div className="tab-empty">
                <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <h3>No AI modules yet</h3>
                <p>Start a structured group study path for this group's members to solve on schedule!</p>
              </div>
            ) : (
              <div className="room-list">
                {modules.map((mod: any, idx) => {
                  const myProgress = mod.progress?.find((p: any) => p.user && p.user.toString() === userID);
                  const completedCount = myProgress ? myProgress.completedQuizzes.length : 0;
                  const scoreAvg = myProgress ? myProgress.overallScore : 0;

                  return (
                    <div key={idx} className="room-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/module/${mod._id}`)}>
                      <div className="room-item-header">
                        <span className="room-item-topic">{mod.title}</span>
                        <span className={`room-item-status ${mod.status}`}>{mod.status}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                        {mod.description}
                      </p>
                      <div className="room-item-meta" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <span>🎓 Quizzes: {mod.totalQuizzes}</span>
                        <span>✅ Completed: {completedCount}/{mod.totalQuizzes}</span>
                        <span>📈 My Avg: {scoreAvg}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Room Modal */}
      {showPostRoom && (
        <div className="modal-overlay" onClick={() => setShowPostRoom(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2><Sparkles size={20} /> Post Quiz Room</h2>

            <div className="groups-input-group">
              <label>Quiz Topic</label>
              <input
                type="text"
                className="groups-input"
                placeholder="e.g., Data Structures, Machine Learning..."
                value={roomTopic}
                onChange={e => setRoomTopic(e.target.value)}
              />
            </div>

            <div className="groups-input-group">
              <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                className="groups-input groups-textarea"
                placeholder="What should participants focus on? Any context for the quiz..."
                value={roomDescription}
                onChange={e => setRoomDescription(e.target.value)}
                maxLength={200}
                rows={2}
              />
            </div>

            <div className="post-room-config">
              <div className="groups-input-group">
                <label>Questions</label>
                <select
                  value={roomConfig.count}
                  onChange={e => setRoomConfig({ ...roomConfig, count: Number(e.target.value) })}
                  className="groups-input"
                >
                  {[3, 5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="groups-input-group">
                <label>Difficulty</label>
                <select
                  value={roomConfig.difficulty}
                  onChange={e => setRoomConfig({ ...roomConfig, difficulty: e.target.value })}
                  className="groups-input"
                >
                  <option value="introductory">Introductory</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="groups-input-group">
                <label>Time (min)</label>
                <select
                  value={roomConfig.timeLimit / 60}
                  onChange={e => setRoomConfig({ ...roomConfig, timeLimit: Number(e.target.value) * 60 })}
                  className="groups-input"
                >
                  {[1, 2, 3, 5, 10, 15, 20, 30].map(n => (
                    <option key={n} value={n}>{n} min</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="groups-error">{error}</div>}

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowPostRoom(false)}>
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handlePostRoom}
                disabled={postingRoom || !roomTopic.trim()}
              >
                {postingRoom ? <><div className="btn-spinner" /> Posting...</> : 'Post & Start Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Learning Module Modal */}
      {showCreateModule && (
        <div className="modal-overlay" onClick={() => setShowCreateModule(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2><Sparkles size={20} style={{ color: '#fbbf24' }} /> Start Group Learning Module</h2>

            <div className="groups-input-group">
              <label>Topic to Master</label>
              <input
                type="text"
                className="groups-input"
                placeholder="e.g. Data Structures, Machine Learning Basics, Cell Biology..."
                value={moduleTopic}
                onChange={e => setModuleTopic(e.target.value)}
                disabled={creatingModule}
              />
              <p className="field-help" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Grok AI will design a syllabus of progressive quizzes scheduled dynamically based on topic difficulty.
              </p>
            </div>

            {moduleError && <div className="groups-error">{moduleError}</div>}

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowCreateModule(false)} disabled={creatingModule}>
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleCreateModule}
                disabled={creatingModule || !moduleTopic.trim()}
              >
                {creatingModule ? <><div className="btn-spinner" /> Generating...</> : 'Generate Study Path'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && (
        <div className="modal-overlay" onClick={() => setShowResults(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                <Trophy size={18} style={{ color: '#fbbf24', marginRight: '8px', verticalAlign: 'middle' }} />
                {resultsData?.topic || 'Quiz Results'}
                {resultsData?.completedAt && (
                  <small style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '10px', fontSize: '0.75rem' }}>
                    · {formatTime(resultsData.completedAt)}
                  </small>
                )}
              </h2>
              <button onClick={() => setShowResults(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {resultsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div className="btn-spinner" style={{ margin: '0 auto 0.75rem' }} /> Loading results...
              </div>
            ) : resultsData ? (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', background: 'var(--bg-secondary, #161b22)', borderRadius: '10px', padding: '4px', flexShrink: 0 }}>
                  {(['leaderboard', 'questions'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setResultsTab(tab)}
                      style={{
                        flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                        background: resultsTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent',
                        color: resultsTab === tab ? '#c084fc' : 'var(--text-muted)'
                      }}
                    >
                      {tab === 'leaderboard' ? `🏆 Leaderboard (${resultsData.leaderboard.length})` : `📋 Questions (${resultsData.questions?.length || 0})`}
                    </button>
                  ))}
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>

                  {/* ─── LEADERBOARD TAB ─── */}
                  {resultsTab === 'leaderboard' && (
                    resultsData.leaderboard.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No participant data yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {resultsData.leaderboard.map((entry: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px',
                              alignItems: 'center', padding: '10px 14px',
                              background: entry.userId === userID ? 'rgba(139,92,246,0.1)' : 'var(--bg-tertiary, #21262d)',
                              borderRadius: '10px',
                              border: entry.userId === userID ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                              cursor: entry.userId !== userID ? 'pointer' : 'default'
                            }}
                            onClick={() => entry.userId !== userID && navigate(`/profile/${entry.userId}`)}
                          >
                            <span style={{ fontSize: '1.1rem' }}>
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                            </span>
                            <span style={{ fontWeight: 500 }}>
                              {entry.name}
                              {entry.username && <small style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>@{entry.username}</small>}
                              {entry.userId === userID && <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>You</span>}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.score}/{entry.total}</span>
                            <span style={{ fontWeight: 700, color: '#c084fc' }}>{entry.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* ─── QUESTIONS TAB ─── */}
                  {resultsTab === 'questions' && (
                    !resultsData.questions || resultsData.questions.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Question data not available for this room.</p>
                    ) : (
                      <div className="history-questions-list">
                        {resultsData.questions.map((q: any, qi: number) => {
                          const letters = ['A', 'B', 'C', 'D'];
                          const userSelected = q.userSelectedOption;
                          const userIsCorrect = q.userIsCorrect;
                          return (
                            <div
                              key={qi}
                              className={`history-question-card ${
                                userSelected
                                  ? (userIsCorrect ? 'correct-border' : 'incorrect-border')
                                  : 'unanswered-border'
                              }`}
                            >
                              {/* Question header with result badge */}
                              <div className="history-question-header">
                                <span className="history-question-number">
                                  Q{q.index}
                                </span>
                                <p className="history-question-text">{q.question}</p>
                                {userSelected && (
                                  <span className={`history-result-badge ${userIsCorrect ? 'correct' : 'incorrect'}`}>
                                    {userIsCorrect ? '✓ Correct' : '✗ Wrong'}
                                  </span>
                                )}
                              </div>

                              {/* Options */}
                              <div className={`history-options-list ${q.explanation ? 'has-explanation' : ''}`}>
                                {q.options?.map((opt: any, oi: number) => {
                                  const isUserAnswer = userSelected && opt.text === userSelected;
                                  const isCorrectOpt = opt.isCorrect;

                                  let optClass = 'history-option-item';
                                  if (isCorrectOpt) optClass += ' correct';
                                  else if (isUserAnswer && !isCorrectOpt) optClass += ' incorrect';

                                  return (
                                    <div key={oi} className={optClass}>
                                      <span className="history-option-letter">
                                        {letters[oi]}
                                      </span>
                                      <span className="history-option-text">{opt.text}</span>
                                      {isCorrectOpt && <span className="history-option-status-badge correct-text">✓ Correct</span>}
                                      {isUserAnswer && !isCorrectOpt && <span className="history-option-status-badge incorrect-text">✗ Your Answer</span>}
                                      {isUserAnswer && isCorrectOpt && <span className="history-option-status-badge correct-text">✓ Your Answer</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* No answer indicator */}
                              {!userSelected && (
                                <div className="history-no-answer">
                                  ⏱ You did not answer this question
                                </div>
                              )}

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="history-explanation-section">
                                  <p className="history-explanation-text">💡 {q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <p style={{ color: resultsError ? '#fca5a5' : 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                {resultsError || 'Failed to load results.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
