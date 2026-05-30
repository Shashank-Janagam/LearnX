import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/CollabQuiz.css';
import { Users, Crown, Copy, Check, Trophy, Clock, ArrowLeft, Loader } from 'lucide-react';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

function CollabQuiz() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const socketRef = useRef(null);

  const userID = state?.userID || sessionStorage.getItem('userID');
  const userName = sessionStorage.getItem('userName');

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
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizTopic, setQuizTopic] = useState('');

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

  // Timer
  useEffect(() => {
    if (phase !== 'quiz' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!submitted) handleSubmit();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft, submitted]);

  const handleStart = () => {
    setLoading(true);
    socketRef.current?.emit('room:start', { roomCode });
  };

  const handleOptionClick = (qIndex, oIndex) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    socketRef.current?.emit('room:submit', {
      roomCode,
      answers: selectedAnswers,
      userID
    });
  }, [submitted, roomCode, selectedAnswers, userID]);

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

  // ===== QUIZ PHASE =====
  if (phase === 'quiz') {
    const score = calculateScore();
    return (
      <div className="collab-quiz-container">
        <header className="collab-q-header">
          <div className="logo-container">
            <div className="logo-icon"><span className="logo-text">LearnX</span></div>
          </div>
          <div className="quiz-header-info">
            <span className="room-badge">Room: {roomCode}</span>
            <span className={"timer-badge" + (timeLeft < 30 ? ' urgent' : '')}>
              <Clock size={14} /> {formatTime(timeLeft)}
            </span>
            {submitted && <span className="submitted-badge">✓ Submitted</span>}
          </div>
        </header>

        <main className="collab-q-main quiz-phase">
          <div className="quiz-status-bar">
            <span>{submittedCount}/{totalParticipants} submitted</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: (totalParticipants > 0 ? (submittedCount / totalParticipants) * 100 : 0) + '%' }}
              />
            </div>
          </div>

          <div className="questions-grid">
            {mcqs.map((mcq, qIndex) => (
              <div key={qIndex} className={"question-card" + (submitted ? ' revealed' : '')}>
                <div className="question-header">
                  <span className="question-number">Q{qIndex + 1}</span>
                  {submitted && (
                    <span className={"result-badge " + (mcq.options[selectedAnswers[qIndex]]?.isCorrect ? 'correct' : 'incorrect')}>
                      {mcq.options[selectedAnswers[qIndex]]?.isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  )}
                </div>
                <h4 className="question-text">{mcq.question}</h4>
                <div className="options-list">
                  {mcq.options.map((opt, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => handleOptionClick(qIndex, oIndex)}
                      disabled={submitted}
                      className={"option-button" +
                        (selectedAnswers[qIndex] === oIndex ? ' selected' : '') +
                        (submitted && opt.isCorrect ? ' correct' : '') +
                        (submitted && selectedAnswers[qIndex] === oIndex && !opt.isCorrect ? ' incorrect' : '')}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + oIndex)}</span>
                      <span className="option-text">{opt.text}</span>
                    </button>
                  ))}
                </div>
                {submitted && mcq.explanation && (
                  <div className="explanation-section">
                    <p className="explanation-text">{mcq.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!submitted && (
            <div className="submit-container">
              <button className="submit-btn" onClick={handleSubmit}>
                Submit Answers ({Object.keys(selectedAnswers).length}/{mcqs.length} answered)
              </button>
            </div>
          )}

          {submitted && (
            <div className="waiting-results">
              <Loader size={20} className="spin-icon" />
              <span>Your score: {score}/{mcqs.length} — Waiting for others to finish...</span>
            </div>
          )}
        </main>
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
                <div className="podium-avatar">{leaderboard[1].name.charAt(0)}</div>
                <span className="podium-name">{leaderboard[1].name}</span>
                <span className="podium-score">{leaderboard[1].percentage}%</span>
                <div className="podium-bar">2nd</div>
              </div>
            )}
            <div className="podium-place first">
              <Crown size={24} className="podium-crown" />
              <div className="podium-avatar gold">{leaderboard[0].name.charAt(0)}</div>
              <span className="podium-name">{leaderboard[0].name}</span>
              <span className="podium-score">{leaderboard[0].percentage}%</span>
              <div className="podium-bar">1st</div>
            </div>
            {leaderboard.length >= 3 && (
              <div className="podium-place third">
                <div className="podium-avatar">{leaderboard[2].name.charAt(0)}</div>
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
            <div key={i} className={"lb-row" + (entry.userId === userID ? ' is-me' : '')}>
              <span className="lb-rank">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '#' + entry.rank}
              </span>
              <span className="lb-name">
                {entry.name}
                {entry.username && <small> @{entry.username}</small>}
                {entry.userId === userID && <span className="you-tag">You</span>}
              </span>
              <span className="lb-score">{entry.score}/{entry.total}</span>
              <span className="lb-pct">{entry.percentage}%</span>
            </div>
          ))}
        </div>

        <div className="lb-actions">
          <button className="collab-btn primary" onClick={() => navigate('/collab')}>
            Play Again
          </button>
          <button className="collab-btn secondary" onClick={() => navigate('/Home')}>
            <ArrowLeft size={16} /> Home
          </button>
        </div>
      </main>
    </div>
  );
}

export default CollabQuiz;
