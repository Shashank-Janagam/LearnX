import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ArrowLeft, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ThemeToggle from '../components/ThemeToggle.tsx';
import '../styles/ModuleQuiz.css';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

interface MCQOption {
  text: string;
  isCorrect: boolean;
}

interface MCQ {
  question: string;
  options: MCQOption[];
  explanation?: string;
}

function ModuleQuiz() {
  const { moduleId, quizIndex } = useParams<{ moduleId: string; quizIndex: string }>();
  const navigate = useNavigate();
  const userID = sessionStorage.getItem('userID');
  const userEmail = sessionStorage.getItem('userEmail');

  const [topic, setTopic] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes standard
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const calculateScore = useCallback(() => {
    let score = 0;
    mcqs.forEach((mcq, idx) => {
      const selected = selectedAnswers[idx];
      if (selected !== undefined && mcq.options[selected]?.isCorrect) {
        score++;
      }
    });
    return score;
  }, [mcqs, selectedAnswers]);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(
        `${HOST_SERVER}/api/modules/${moduleId}/quiz/${quizIndex}/questions`,
        { params: { userId: userID } }
      );
      if (res.data.success) {
        setMcqs(res.data.mcqs);
        setTopic(res.data.topic);
        setQuizTitle(res.data.title);
      } else {
        setError('Failed to fetch questions.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error generating/loading quiz questions.');
    } finally {
      setLoading(false);
    }
  }, [moduleId, quizIndex, userID]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    setIsGeneratingReport(true);

    const score = calculateScore();
    const responses = mcqs.map((mcq, idx) => {
      const selectedIdx = selectedAnswers[idx];
      const selectedOption = selectedIdx !== undefined ? mcq.options[selectedIdx] : null;
      return {
        question: mcq.question,
        selectedOption: selectedOption ? selectedOption.text : '',
        correctOption: mcq.options.find((o) => o.isCorrect)?.text || '',
        isCorrect: selectedOption ? selectedOption.isCorrect : false,
        explanation: mcq.explanation || ''
      };
    });

    const timeTaken = 300 - timeLeft;

    // Show results instantly
    const resultReveal: { [key: number]: boolean } = {};
    mcqs.forEach((_, i) => {
      resultReveal[i] = true;
    });
    setShowResults(resultReveal);

    try {
      const res = await axios.post(`${HOST_SERVER}/api/modules/${moduleId}/quiz/${quizIndex}/submit`, {
        userId: userID,
        responses,
        score,
        total: mcqs.length,
        timeTaken
      });

      if (res.data.success) {
        setReport(res.data.report);
        setSubmittedData({
          topic: `${quizTitle} - ${topic}`,
          score,
          total: mcqs.length,
          responses,
          time: 300,
          timeLeft,
          profileData: { name: sessionStorage.getItem('userName') || 'Student' }
        });
      } else {
        setError('Error submitting quiz answers.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not submit results to the backend.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [isSubmitted, calculateScore, mcqs, selectedAnswers, timeLeft, moduleId, quizIndex, userID, quizTitle, topic]);

  useEffect(() => {
    if (!userID || !userEmail) {
      navigate('/');
      return;
    }
    fetchQuestions();
  }, [userID, userEmail, navigate, fetchQuestions]);

  // Timer countdown
  useEffect(() => {
    if (loading || isSubmitted || error || mcqs.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, error, mcqs, handleSubmit]);

  const handleOptionClick = (qIndex: number, oIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  };

  if (loading) {
    return (
      <div className="module-quiz-loading">
        <div className="spinner"></div>
        <h3>Generating Quiz Questions...</h3>
        <p>Grok AI is crafting questions on demand for this subtopic.</p>
      </div>
    );
  }

  if (error && mcqs.length === 0) {
    return (
      <div className="module-quiz-error">
        <h2>Quiz Unavailable</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/module/${moduleId}`)} className="back-module-btn">
          <ArrowLeft size={16} /> Back to Module Timeline
        </button>
      </div>
    );
  }

  const score = calculateScore();

  return (
    <div className="module-quiz-container">
      <header className="module-quiz-header">
        <div className="header-left">
          <button onClick={() => navigate(`/module/${moduleId}`)} className="back-nav-btn">
            <ArrowLeft size={18} />
          </button>
          <span className="quiz-title-badge">{quizTitle || 'Module Quiz'}</span>
        </div>
        <div className="header-right">
          {isSubmitted && !isChatOpen && (
            <button className="ai-chat-trigger" onClick={() => setIsChatOpen(true)}>
              🤖 Ask AI
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="module-quiz-main">
        {/* Status Bar */}
        <div className="quiz-status-bar">
          <span className="topic-badge">{topic}</span>
          {!isSubmitted ? (
            <span className="timer-badge">
              Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          ) : (
            <span className="score-badge">Score: {score}/{mcqs.length}</span>
          )}
        </div>

        {/* AI Report Card */}
        {isSubmitted && (
          <div className="quiz-report-container">
            {isGeneratingReport ? (
              <div className="report-loading-pulse">
                <span>Generating AI tutor feedback...</span>
                <div className="pulse-spinner"></div>
              </div>
            ) : (
              report && (
                <div className="ai-report-card">
                  <div className="report-title">
                    <Brain className="brain-icon" size={18} />
                    <h3>AI Tutor Review</h3>
                  </div>
                  <div className="report-body">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              )
            )}
          </div>
        )}
        {/* Question Navigation Keys */}
        <div className="quiz-navigation-keys">
          {mcqs.map((_, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCorrect = showResults[idx] && mcqs[idx].options[selectedAnswers[idx]]?.isCorrect;
            const isIncorrect = showResults[idx] && !mcqs[idx].options[selectedAnswers[idx]]?.isCorrect;

            let btnClass = 'nav-key';
            if (isCurrent) btnClass += ' active';
            if (isAnswered) btnClass += ' answered';
            if (showResults[idx]) {
              if (isCorrect) btnClass += ' correct';
              if (isIncorrect) btnClass += ' incorrect';
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
        {mcqs[currentQuestionIndex] && (
          <div className={`question-card active-question ${showResults[currentQuestionIndex] ? 'revealed' : ''}`}>
            <div className="q-card-header">
              <span className="q-number">Question {currentQuestionIndex + 1} of {mcqs.length}</span>
              {showResults[currentQuestionIndex] && (
                <span className={`correctness-tag ${
                  mcqs[currentQuestionIndex].options[selectedAnswers[currentQuestionIndex]]?.isCorrect ? 'correct' : 'incorrect'
                }`}>
                  {mcqs[currentQuestionIndex].options[selectedAnswers[currentQuestionIndex]]?.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
            <h3 className="q-text">{mcqs[currentQuestionIndex].question}</h3>
            <div className="options-grid">
              {mcqs[currentQuestionIndex].options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                const isCorrect = opt.isCorrect;
                const hasSubmitted = showResults[currentQuestionIndex];

                let optClass = '';
                if (isSelected) optClass += 'selected ';
                if (hasSubmitted) {
                  if (isCorrect) optClass += 'correct-answer ';
                  else if (isSelected) optClass += 'wrong-answer ';
                  optClass += 'disabled ';
                }

                return (
                  <button
                    key={oIdx}
                    className={`option-btn ${optClass}`}
                    onClick={() => handleOptionClick(currentQuestionIndex, oIdx)}
                    disabled={hasSubmitted}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                    <span className="opt-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {showResults[currentQuestionIndex] && mcqs[currentQuestionIndex].explanation && (
              <div className="explanation-box">
                <strong>Explanation:</strong>
                <p>{mcqs[currentQuestionIndex].explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Prev/Next and Submit Controls */}
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
            !isSubmitted ? (
              <button className="submit-quiz-btn" onClick={handleSubmit}>
                Submit Quiz
              </button>
            ) : (
              <button className="finish-quiz-btn" onClick={() => navigate(`/module/${moduleId}`)}>
                Back to Module Timeline
              </button>
            )
          )}
        </div>
      </main>

      {/* AI Doubt Sidebar */}
      {isSubmitted && submittedData && (
        <DoubtChatSidebar
          quizData={submittedData}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}

interface DoubtChatSidebarProps {
  quizData: any;
  isOpen: boolean;
  onClose: () => void;
}

const DoubtChatSidebar: React.FC<DoubtChatSidebarProps> = ({ quizData, isOpen, onClose }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${HOST_SERVER}/quiz/grok-doubt-chat`, {
        messages: updatedMessages,
        userMcqs: quizData
      });
      if (res.data.content) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.content }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error sending message to AI Tutor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`doubt-sidebar-overlay ${isOpen ? 'active' : ''}`}>
      <div className={`doubt-sidebar ${isOpen ? 'open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🤖</span>
            <h3>AI Tutor doubts</h3>
          </div>
          <button className="close-sidebar-btn" onClick={onClose}>×</button>
        </div>

        <div className="sidebar-chat-body">
          {messages.length === 0 && (
            <div className="empty-chat-state">
              <p>Ask questions about any concepts or incorrect answers in this quiz. The AI tutor is ready!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="bubble-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai pulse">
              <div className="bubble-content">Thinking...</div>
            </div>
          )}
          <div ref={scrollAnchorRef}></div>
        </div>

        <form className="sidebar-chat-footer" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type your doubt..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}>
            <Search size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModuleQuiz;
