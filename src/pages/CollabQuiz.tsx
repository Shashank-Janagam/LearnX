import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/CollabQuiz.css';
import { Users, Crown, Copy, Check, Trophy, Clock, ArrowLeft, Loader, BookOpen, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function CollabQuiz() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const socketRef = useRef(null);

  const userID = state?.userID || sessionStorage.getItem('userID');

  const [phase, setPhase] = useState('waiting'); // waiting | quiz | leaderboard
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isHost, setIsHost] = useState(state?.isHost || false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quiz state
  const [mcqs, setMcqs] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false); // fired by timer
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizTopic, setQuizTopic] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!sessionStorage.getItem('userEmail')) {
      navigate('/');
      return;
    }

    document.title = 'LearnX | Room ' + roomCode;

    const socket = io(HOST_SERVER, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket');
      socket.emit('room:join', { roomCode, userID });
    });

    socket.on('room:state', (data) => {
      setParticipants(data.participants || []);
      setRoomInfo(data);
      setIsHost(data.host === userID);
      setQuizTopic(data.topic);
      setTotalParticipants(data.participants?.length || 0);
    });

    socket.on('room:participant-joined', (data) => {
      console.log('Participant joined:', data.user.name);
    });

    socket.on('room:participant-left', (data) => {
      setParticipants(prev => prev.filter(p =>
        p.user?.toString() !== data.userId && p.user?._id?.toString() !== data.userId
      ));
    });

    socket.on('room:started', (data) => {
      setMcqs(data.mcqs || []);
      const endTime = new Date(data.endTime).getTime();
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      setPhase('quiz');
      setCurrentQuestionIndex(0);
      setLoading(false);
    });

    socket.on('room:participant-submitted', (data) => {
      setSubmittedCount(data.submittedCount || 0);
      setTotalParticipants(data.totalParticipants || 0);
    });

    socket.on('room:completed', (data) => {
      setLeaderboard(data.leaderboard || []);
      setQuizTopic(data.topic);
      setPhase('leaderboard');
    });

    socket.on('room:error', (data) => {
      setError(data.message);
      setLoading(false);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.emit('room:leave', { roomCode });
      socket.disconnect();
    };
  }, [roomCode, userID, navigate]);

  const handleSubmit = useCallback((isAuto = false) => {
    if (submitted) return;
    setSubmitted(true);
    if (isAuto) setAutoSubmitted(true);
    socketRef.current?.emit('room:submit', {
      roomCode,
      answers: selectedAnswers,
      userID
    });
  }, [submitted, roomCode, selectedAnswers, userID]);

  // Keep an always-fresh ref to the submit handler so the interval doesn't go stale
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Single stable timer — does NOT re-run on every tick, avoids stale-closure bugs
  const isQuizActive = phase === 'quiz' && timeLeft > 0;
  useEffect(() => {
    if (!isQuizActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit with latest answers (ref is always current, pass isAuto=true)
          handleSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizActive]);

  const email = sessionStorage.getItem('userEmail') || '';
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${HOST_SERVER}/api/profile/email/${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (email) {
      fetchProfile();
    }
  }, [email]);

  const handleStart = () => {
    setLoading(true);
    socketRef.current?.emit('room:start', { roomCode });
  };

  const handleOptionClick = (qIndex, oIndex) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateScore = () => {
    let score = 0;
    mcqs.forEach((mcq, i) => {
      if (selectedAnswers[i] !== undefined) {
        if (mcq.options[selectedAnswers[i]]?.isCorrect) score++;
      }
    });
    return score;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + String(s).padStart(2, '0');
  };

  // Build quiz result context for the AI doubt chat (available after submission in any phase)
  const quizResponses = mcqs.map((mcq: any, index: number) => {
    const selectedIndex = selectedAnswers[index];
    const selectedOption = mcq.options[selectedIndex];
    return {
      question: mcq.question,
      score: calculateScore(),
      selectedOption: selectedOption?.text || '',
      correctOption: mcq.options.find((opt: any) => opt.isCorrect)?.text || '',
      explanation: mcq.explanation || '',
      isCorrect: selectedOption?.isCorrect || false,
    };
  });

  const quizResultContext = {
    topic: quizTopic || roomInfo?.topic || '',
    score: calculateScore(),
    total: mcqs.length,
    responses: quizResponses,
    time: roomInfo?.config?.timeLimit || 300,
    timeLeft: 0,
    profileData
  };

  // ===== WAITING ROOM =====
  if (phase === 'waiting') {
    return (
      <div className="collab-quiz-container">
        <header className="collab-q-header">
          <div className="logo-container" onClick={() => navigate('/Home')}>
            <div className="logo-icon"><span className="logo-text">LearnX</span></div>
          </div>
          <span className="room-badge">Room: {roomCode}</span>
        </header>

        <main className="collab-q-main">
          <div className="waiting-room">
            <div className="room-code-display">
              <div className="room-glow" />
              <h2>Waiting Room</h2>
              <p className="room-topic">{roomInfo?.topic}</p>
              <div className="room-code-box" onClick={copyRoomCode}>
                <span className="code-chars">{roomCode}</span>
                {copied ? <Check size={18} className="copy-icon done" /> : <Copy size={18} className="copy-icon" />}
              </div>
              <p className="share-hint">Share this code with your friends to join</p>
            </div>

            <div className="participants-section">
              <h3><Users size={18} /> Participants ({participants.length}/10)</h3>
              <div className="participants-grid">
                {participants.map((p, i) => (
                  <div key={i} className="participant-card">
                    <div className="participant-avatar">
                      {(p.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <span className="p-name">{p.name}</span>
                      {p.username && <span className="p-username">@{p.username}</span>}
                    </div>
                    {roomInfo?.host === (p.user?.toString() || p.user) && (
                      <Crown size={14} className="host-crown" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="config-summary">
              <span>{roomInfo?.config?.count} questions</span>
              <span>{roomInfo?.config?.difficulty}</span>
              <span>{Math.floor((roomInfo?.config?.timeLimit || 300) / 60)} min</span>
            </div>

            {isHost ? (
              <button className="start-quiz-btn" onClick={handleStart} disabled={loading || participants.length < 1}>
                {loading ? (
                  <><Loader size={18} className="spin-icon" /> Generating Questions...</>
                ) : (
                  <><Trophy size={18} /> Start Quiz</>
                )}
              </button>
            ) : (
              <div className="waiting-message">
                <Loader size={18} className="spin-icon" />
                <span>Waiting for host to start the quiz...</span>
              </div>
            )}

            {error && <div className="collab-error">{error}</div>}
          </div>
        </main>
      </div>
    );
  }

  // ===== QUIZ PHASE — ONE QUESTION AT A TIME =====
  if (phase === 'quiz') {
    const score = calculateScore();
    const currentMcq = mcqs[currentQuestionIndex];

    return (
      <div className="collab-quiz-container">
        <header className="collab-q-header">
          <div className="logo-container">
            <div className="logo-icon"><span className="logo-text">LearnX</span></div>
          </div>
          <div className="quiz-header-info">
            <span className="room-badge">Room: {roomCode}</span>
            {timeLeft > 0 && (
              <span className={'timer-badge' + (timeLeft < 30 ? ' urgent' : '')}>
                <Clock size={14} /> {formatTime(timeLeft)}
              </span>
            )}
            {submitted && !autoSubmitted && <span className="submitted-badge">✓ Submitted</span>}
            {autoSubmitted && <span className="submitted-badge" style={{ background: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.4)', color: '#fb923c' }}>⏱ Auto-submitted</span>}
          </div>
          {submitted && !isChatOpen && (
            <button className="ai-launch-btn" aria-label="Open AI Chat" onClick={() => setIsChatOpen(true)}>
              <span className="icon">🤖</span>
              <span className="label">Ask AI</span>
              <span className="dot"></span>
            </button>
          )}
        </header>

        {/* Auto-submitted banner */}
        {autoSubmitted && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(239,68,68,0.08))',
            border: '1px solid rgba(251,146,60,0.3)',
            borderRadius: '10px',
            padding: '10px 20px',
            margin: '0.75rem 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fb923c',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <span style={{ fontSize: '1.1rem' }}>⏱</span>
            Time's Up! Your selected answers were automatically submitted.
          </div>
        )}

        <main className="collab-q-main quiz-phase">
          {/* Progress bar */}
          <div className="quiz-status-bar">
            <span>{submittedCount}/{totalParticipants} submitted</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: (totalParticipants > 0 ? (submittedCount / totalParticipants) * 100 : 0) + '%' }}
              />
            </div>
          </div>

          {/* Question nav palette */}
          <div className="quiz-navigation-keys">
            {mcqs.map((_, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isAnswered = selectedAnswers[idx] !== undefined;
              const isCorrect = submitted && mcqs[idx].options[selectedAnswers[idx]]?.isCorrect;
              const isIncorrect = submitted && selectedAnswers[idx] !== undefined && !mcqs[idx].options[selectedAnswers[idx]]?.isCorrect;

              let btnClass = 'nav-key';
              if (isCurrent) btnClass += ' active';
              if (isAnswered && !submitted) btnClass += ' answered';
              if (submitted) {
                if (isCorrect) btnClass += ' correct';
                else if (isIncorrect) btnClass += ' incorrect';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={btnClass}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {currentMcq && (
            <div className={`question-card active-question${submitted ? ' revealed' : ''}`}>
              <div className="question-header">
                <span className="question-number">
                  Question {currentQuestionIndex + 1} of {mcqs.length}
                </span>
                {submitted && (
                  <span className={`result-badge ${currentMcq.options[selectedAnswers[currentQuestionIndex]]?.isCorrect ? 'correct' : 'incorrect'}`}>
                    {currentMcq.options[selectedAnswers[currentQuestionIndex]]?.isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>
                )}
              </div>

              <h4 className="question-text">{currentMcq.question}</h4>

              <div className="options-list">
                {currentMcq.options.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() => handleOptionClick(currentQuestionIndex, oIndex)}
                    disabled={submitted}
                    className={
                      'option-button' +
                      (selectedAnswers[currentQuestionIndex] === oIndex ? ' selected' : '') +
                      (submitted && opt.isCorrect ? ' correct' : '') +
                      (submitted && selectedAnswers[currentQuestionIndex] === oIndex && !opt.isCorrect ? ' incorrect' : '')
                    }
                  >
                    <span className="option-letter">{String.fromCharCode(65 + oIndex)}</span>
                    <span className="option-text">{opt.text}</span>
                  </button>
                ))}
              </div>

              {submitted && currentMcq.explanation && (
                <div className="explanation-section">
                  <p className="explanation-text">{currentMcq.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Prev / Next / Submit Controls */}
          <div className="quiz-controls">
            <button
              type="button"
              className="control-btn prev-btn"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>

            {currentQuestionIndex < mcqs.length - 1 ? (
              <button
                type="button"
                className="control-btn next-btn"
                onClick={() => setCurrentQuestionIndex(prev => Math.min(mcqs.length - 1, prev + 1))}
              >
                Next
              </button>
            ) : (
              !submitted && (
                <button className="submit-btn" onClick={handleSubmit}>
                  Submit Answers ({Object.keys(selectedAnswers).length}/{mcqs.length} answered)
                </button>
              )
            )}
          </div>

          {submitted && (
            <div className={`waiting-results${autoSubmitted ? ' auto-submitted' : ''}`}>
              {autoSubmitted ? (
                <>
                  <span style={{ fontSize: '1.2rem' }}>⏱</span>
                  <span>
                    Time's up! Score: <strong>{score}/{mcqs.length}</strong> answered
                    &nbsp;&mdash;&nbsp;Waiting for the leaderboard...
                  </span>
                </>
              ) : (
                <>
                  <Loader size={20} className="spin-icon" />
                  <span>Your score: <strong>{score}/{mcqs.length}</strong> — Waiting for others to finish...</span>
                </>
              )}
            </div>
          )}
        </main>
        {submitted && (
          <DoubtChat
            quizData={quizResultContext}
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
          />
        )}
      </div>
    );
  }

  // ===== LEADERBOARD =====

  return (
    <div className="collab-quiz-container">
      <header className="collab-q-header">
        <div className="logo-container" onClick={() => navigate('/Home')}>
          <div className="logo-icon"><span className="logo-text">LearnX</span></div>
        </div>
        {phase === 'leaderboard' && !isChatOpen && (
          <button className="ai-launch-btn" aria-label="Open AI Chat" onClick={() => setIsChatOpen(true)}>
            <span className="icon">🤖</span>
            <span className="label">Ask AI</span>
            <span className="dot"></span> 
          </button>
        )}
        <span className="room-badge">Room: {roomCode}</span>
      </header>

      <main className="collab-q-main leaderboard-phase">
        <div className="leaderboard-hero">
          <Trophy size={48} className="trophy-icon" />
          <h1>Quiz Complete!</h1>
          <p className="lb-topic">{quizTopic}</p>
        </div>

        {/* Podium */}
        {leaderboard.length >= 1 && (
          <div className="podium">
            {leaderboard.length >= 2 && (
              <div className="podium-place second">
                <div
                  className="podium-avatar"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${leaderboard[1].userId}`)}
                  title="View profile"
                >
                  {leaderboard[1].name.charAt(0)}
                </div>
                <span className="podium-name">{leaderboard[1].name}</span>
                <span className="podium-score">{leaderboard[1].percentage}%</span>
                <div className="podium-bar">2nd</div>
              </div>
            )}
            <div className="podium-place first">
              <Crown size={24} className="podium-crown" />
              <div
                className="podium-avatar gold"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${leaderboard[0].userId}`)}
                title="View profile"
              >
                {leaderboard[0].name.charAt(0)}
              </div>
              <span className="podium-name">{leaderboard[0].name}</span>
              <span className="podium-score">{leaderboard[0].percentage}%</span>
              <div className="podium-bar">1st</div>
            </div>
            {leaderboard.length >= 3 && (
              <div className="podium-place third">
                <div
                  className="podium-avatar"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${leaderboard[2].userId}`)}
                  title="View profile"
                >
                  {leaderboard[2].name.charAt(0)}
                </div>
                <span className="podium-name">{leaderboard[2].name}</span>
                <span className="podium-score">{leaderboard[2].percentage}%</span>
                <div className="podium-bar">3rd</div>
              </div>
            )}
          </div>
        )}

        {/* Full table */}
        <div className="leaderboard-table">
          <div className="lb-header-row">
            <span>Rank</span>
            <span>Player</span>
            <span>Score</span>
            <span>Accuracy</span>
          </div>
          {leaderboard.map((entry, i) => (
            <div key={i} className={`lb-row${entry.userId === userID ? ' is-me' : ''}`}>
              <span className="lb-rank">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '#' + entry.rank}
              </span>
              <span
                className="lb-name"
                style={{ cursor: entry.userId !== userID ? 'pointer' : 'default' }}
                onClick={() => entry.userId !== userID && navigate(`/profile/${entry.userId}`)}
              >
                {entry.name}
                {entry.username && <small> @{entry.username}</small>}
                {entry.userId === userID && <span className="you-tag">You</span>}
              </span>
              <span className="lb-score">{entry.score}/{entry.total}</span>
              <span className="lb-pct">{entry.percentage}%</span>
            </div>
          ))}
        </div>

        {/* Question Review Section */}
        {mcqs.length > 0 && (
          <div className="quiz-review-section">
            <h2 className="review-title">
              <BookOpen size={20} className="review-title-icon" />
              Review Questions
            </h2>
            <div className="review-cards-list">
              {mcqs.map((q, qIndex) => {
                const selectedOptIdx = selectedAnswers[qIndex];
                const isAnswered = selectedOptIdx !== undefined;
                const isCorrect = isAnswered && q.options[selectedOptIdx]?.isCorrect;

                return (
                  <div key={qIndex} className={`review-card ${isAnswered ? (isCorrect ? 'correct-border' : 'incorrect-border') : 'unanswered-border'}`}>
                    <div className="review-card-header">
                      <span className="review-question-number">Question {qIndex + 1} of {mcqs.length}</span>
                      <span className={`review-badge ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'}`}>
                        {isAnswered ? (isCorrect ? '✓ Correct' : '✗ Incorrect') : '⏱ Unanswered'}
                      </span>
                    </div>

                    <h3 className="review-question-text">{q.question}</h3>

                    <div className="review-options-list">
                      {q.options.map((opt, oIndex) => {
                        const isSelected = selectedOptIdx === oIndex;
                        const isCorrectOpt = opt.isCorrect;

                        let optClass = 'review-option-item';
                        if (isCorrectOpt) optClass += ' correct';
                        else if (isSelected && !isCorrectOpt) optClass += ' incorrect';

                        return (
                          <div key={oIndex} className={optClass}>
                            <span className="review-option-letter">{String.fromCharCode(65 + oIndex)}</span>
                            <span className="review-option-text">{opt.text}</span>
                            {isCorrectOpt && <span className="review-option-status-badge correct-text">✓ Correct Answer</span>}
                            {isSelected && !isCorrectOpt && <span className="review-option-status-badge incorrect-text">✗ Your Answer</span>}
                            {isSelected && isCorrectOpt && <span className="review-option-status-badge correct-text">✓ Your Answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="review-explanation-section">
                        <p className="review-explanation-text">
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="lb-actions">
          <button className="collab-btn primary" onClick={() => navigate('/collab')}>
            Play Again
          </button>
          <button className="collab-btn secondary" onClick={() => navigate('/groups')}>
            <ArrowLeft size={16} /> Back to Groups
          </button>
        </div>
      </main>
      <DoubtChat
        quizData={quizResultContext}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
    </div>
  );
}

interface DoubtChatProps {
  quizData: any;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const DoubtChat = ({ quizData, isChatOpen, setIsChatOpen }: DoubtChatProps) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const handleDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat.trim() || loading) return;

    const newUserMessage = { role: 'user', content: chat.trim() };
    const updatedMessages = [...messages, newUserMessage];

    setMessages(updatedMessages);
    setChat('');
    setLoading(true);

    try {
      const res = await fetch(`${HOST_SERVER}/quiz/grok-doubt-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, userMcqs: quizData }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('❌ Fetch error:', err.message);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Sorry, could not reach the AI tutor right now. Try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isChatOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsChatOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <div
        ref={chatRef}
        className={`history-sidebar ${isChatOpen ? 'open' : ''}`}
      >
        <div className="logos">
          <div className="sidebar-header-row">
            <div className="logo-container" id="slider">
              <div className="logo-icon">
                <span className="logo-text">LearnX</span>
              </div>
            </div>
            <h2 className="history-title">AI Doubt Session</h2>
            <button className="close-sidebar-btn" onClick={() => setIsChatOpen(false)}>×</button>
          </div>

          <div className="chat-wrapper">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-chat-state">
                  <p>Ask questions about any concepts or incorrect answers in this quiz. The AI tutor has full context of your quiz performance! 🧠</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`msg ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}
              {loading && (
                <div className="msg bot-msg thinking-msg">
                  <span className="thinking-dots">Thinking</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form className="doubt-chat-form" onSubmit={handleDoubt}>
              <div className="doubt-chat-wrapper">
                <input
                  type="text"
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  placeholder="Ask a Doubt or Explore a Topic"
                  className="doubt-chat-input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="doubt-chat-submit"
                  disabled={!chat.trim() || loading}
                >
                  <Search className="doubt-chat-search-icon" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollabQuiz;

