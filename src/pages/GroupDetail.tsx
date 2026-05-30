import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../styles/GroupDetail.css';
import '../styles/Groups.css';
import GroupChat from './GroupChat.tsx';
import {
  ArrowLeft, MessageCircle, BookOpen, Users, Plus, Copy, Check,
  LogOut, Clock, User, Sparkles, Shield
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
  const [roomConfig, setRoomConfig] = useState({ count: 5, timeLimit: 300, difficulty: 'easy' });
  const [postingRoom, setPostingRoom] = useState(false);
  const [error, setError] = useState('');

  // Copy code
  const [copied, setCopied] = useState(false);

  const userID = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) navigate('/');
  }, [navigate]);

  // Initialize socket
  useEffect(() => {
    const s = io(HOST_SERVER);
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

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

  // Fetch rooms when tab changes
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

  // Listen for new rooms via socket
  useEffect(() => {
    if (!socket) return;
    const handleRoomPosted = (room) => {
      setRooms(prev => [room, ...prev]);
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
        config: roomConfig
      });
      setShowPostRoom(false);
      setRoomTopic('');
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
                    <div className="member-avatar">
                      {getInitials(member.name)}
                    </div>
                    <div className="member-info">
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
    </div>
  );
}

export default GroupDetail;
