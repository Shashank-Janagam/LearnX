import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Lock, CheckCircle, Calendar, Award, Clock, ArrowLeft, Users, Trophy } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle.tsx';
import '../styles/ModuleDetail.css';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

interface CompletedQuiz {
  quizIndex: number;
  score: number;
  total: number;
  completedAt: string;
  wasOnTime: boolean;
}

interface MemberProgress {
  user: string;
  userName: string;
  completedQuizzes: CompletedQuiz[];
  overallScore: number;
  punctualityRate: number;
}

interface QuizItem {
  index: number;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  questionCount: number;
  unlockOffsetDays: number;
  unlockDate: string;
}

interface GroupData {
  _id: string;
  name: string;
  code: string;
  creator: string;
  members: Array<{
    user: string;
    role: string;
  }>;
}

interface ModuleData {
  _id: string;
  title: string;
  description: string;
  topic: string;
  creator: string;
  type: 'individual' | 'group';
  group: GroupData | null;
  startDate: string;
  quizzes: QuizItem[];
  progress: MemberProgress[];
  status: string;
  totalQuizzes: number;
}

const ModuleDetail: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUserId = sessionStorage.getItem('userID');

  useEffect(() => {
    if (!currentUserId) {
      navigate('/');
      return;
    }
    fetchModuleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, currentUserId]);

  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${HOST_SERVER}/api/modules/${moduleId}`);
      if (res.data.success) {
        setModule(res.data.module);
      } else {
        setError('Failed to load module details.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching module.');
    } finally {
      setLoading(false);
    }
  };

  const isGroupAdmin = !!(
    module &&
    (
      (module.type === 'group' && module.group && typeof module.group === 'object' && (
        module.group.creator?.toString() === currentUserId?.toString() ||
        (Array.isArray(module.group.members) && module.group.members.some(
          (m) => m.user?.toString() === currentUserId?.toString() && m.role === 'admin'
        ))
      )) ||
      (module.creator?.toString() === currentUserId?.toString())
    )
  );

  const handleUnlockEarly = async (quizIndex: number) => {
    if (!window.confirm('Are you sure you want to unlock this quiz early for all group members?')) return;
    try {
      const res = await axios.post(`${HOST_SERVER}/api/modules/${moduleId}/quiz/${quizIndex}/unlock-early`, {
        userId: currentUserId
      });
      if (res.data.success) {
        fetchModuleDetails();
      } else {
        alert(res.data.message || 'Failed to unlock quiz early.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error unlocking quiz early.');
    }
  };

  if (loading) {
    return (
      <div className="module-detail-loading">
        <div className="spinner"></div>
        <p>Loading your AI Learning Module...</p>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="module-detail-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Module not found.'}</p>
        <button onClick={() => navigate('/home')} className="back-home-btn">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  // Get current user's progress
  const userProgress = module.progress?.find((p) => p.user?.toString() === currentUserId?.toString());
  const completedCount = userProgress ? userProgress.completedQuizzes.length : 0;
  const progressPercent = Math.round((completedCount / module.totalQuizzes) * 100);

  // Leaderboard sorting
  const sortedLeaderboard = [...module.progress].sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    return b.punctualityRate - a.punctualityRate;
  });

  return (
    <div className="module-detail-container">
      {/* Header */}
      <header className="module-detail-header">
        <button onClick={() => navigate('/home')} className="back-btn">
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>
        <div className="header-right">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="module-hero">
        <div className="module-badge-type">
          {module.type === 'group' ? <Users size={14} /> : null}
          <span>{module.type === 'group' ? 'Group Learning Module' : 'Personal Study Path'}</span>
        </div>
        <h1 className="module-title">{module.title}</h1>
        <p className="module-desc">{module.description}</p>
        
        {/* Progress Card */}
        <div className="progress-summary-card">
          <div className="progress-text-row">
            <span className="progress-label">Syllabus Progress</span>
            <span className="progress-value">{completedCount} of {module.totalQuizzes} Quizzes Done ({progressPercent}%)</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          {userProgress && (
            <div className="stats-row">
              <div className="stat-box">
                <Award size={18} className="stat-icon-gold" />
                <div>
                  <div className="stat-num">{userProgress.overallScore}%</div>
                  <div className="stat-name">Avg. Score</div>
                </div>
              </div>
              <div className="stat-box">
                <Clock size={18} className="stat-icon-blue" />
                <div>
                  <div className="stat-num">{userProgress.punctualityRate}%</div>
                  <div className="stat-name">Punctuality</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="module-grid">
        {/* Timeline (Syllabus) */}
        <div className="timeline-section">
          <h2 className="section-title">Module Timeline</h2>
          <div className="timeline-flow">
            {module.quizzes.map((quiz, index) => {
              const unlockDate = new Date(quiz.unlockDate);
              const isLocked = new Date() < unlockDate;
              
              const userCompleted = userProgress?.completedQuizzes.find((cq) => cq.quizIndex === quiz.index);
              const formattedDate = unlockDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={quiz.index} className={`timeline-card ${isLocked ? 'locked' : ''} ${userCompleted ? 'completed' : ''}`}>
                  <div className="card-left">
                    <div className="step-badge">
                      {userCompleted ? (
                        <CheckCircle size={20} className="check-success" />
                      ) : isLocked ? (
                        <Lock size={18} className="lock-muted" />
                      ) : (
                        <span className="step-num">{index + 1}</span>
                      )}
                    </div>
                    {index < module.quizzes.length - 1 && <div className="timeline-connector"></div>}
                  </div>

                  <div className="card-right">
                    <div className="quiz-card-header">
                      <h3 className="quiz-title">{quiz.title}</h3>
                      <span className={`diff-badge ${quiz.difficulty}`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <p className="quiz-desc">{quiz.description}</p>
                    
                    <div className="quiz-meta-row">
                      <span className="meta-item">
                        <strong>Topic:</strong> {quiz.topic}
                      </span>
                      <span className="meta-item">
                        <strong>Questions:</strong> {quiz.questionCount}
                      </span>
                    </div>

                    <div className="quiz-actions-row">
                      {isLocked ? (
                        <div className="unlock-info-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <div className="unlock-info">
                            <Calendar size={14} />
                            <span>Unlocks on {formattedDate}</span>
                          </div>
                          {isGroupAdmin && (
                            <button
                              onClick={() => handleUnlockEarly(quiz.index)}
                              className="unlock-early-btn"
                              style={{
                                padding: '4px 10px',
                                background: 'rgba(108, 92, 231, 0.15)',
                                border: '1px solid rgba(108, 92, 231, 0.3)',
                                borderRadius: '6px',
                                color: '#c084fc',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                            >
                              🔓 Unlock Early
                            </button>
                          )}
                        </div>
                      ) : userCompleted ? (
                        <div className="completed-info">
                          <Award size={14} />
                          <span>Scored {userCompleted.score}/{userCompleted.total}</span>
                          <span className={`time-badge ${userCompleted.wasOnTime ? 'ontime' : 'late'}`}>
                            {userCompleted.wasOnTime ? 'On Time ⏱️' : 'Late'}
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => navigate(`/module/${module._id}/quiz/${quiz.index}`)} 
                          className="start-quiz-btn"
                        >
                          <Play size={14} fill="currentColor" /> Start Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Leaderboard (only if group module) */}
        {module.type === 'group' && (
          <div className="leaderboard-section">
            <div className="leaderboard-header-row">
              <Trophy size={20} className="trophy-icon" />
              <h2 className="section-title">Group Leaderboard</h2>
            </div>
            
            <div className="leaderboard-card">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Member</th>
                    <th>Done</th>
                    <th>Avg. Score</th>
                    <th>Punctuality</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((member, idx) => {
                    const isSelf = member.user?.toString() === currentUserId?.toString();
                    return (
                      <tr key={member.user} className={isSelf ? 'highlight-self' : ''}>
                        <td className="rank-col">
                          <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                        </td>
                        <td className="name-col">
                          <span className="member-name">{member.userName}</span>
                          {isSelf && <span className="you-label">(You)</span>}
                        </td>
                        <td>{member.completedQuizzes.length}/{module.totalQuizzes}</td>
                        <td className="score-col">{member.overallScore}%</td>
                        <td className="punctual-col">{member.punctualityRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;
