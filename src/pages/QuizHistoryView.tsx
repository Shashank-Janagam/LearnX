import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizHistoryView.css';

interface QuizResponse {
  question: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizResult {
  topic: string;
  score: number;
  total: number;
  responses: QuizResponse[];
  report?: string;
}

function QuizHistoryView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { userID, topic } = state || {};

  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `LearnX | ${topic}`;
  }, [topic]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('userEmail');
    if (!storedEmail) {
      navigate('/');
      return;
    }

    if (!userID || !topic) {
      setError('Missing user ID or topic.');
      return;
    }

    const fetchQuizResult = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/history/${userID}/${topic}`
        );
        setResult(res.data.result);
        console.log('Fetched result:', res.data.result);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Unable to fetch quiz result.');
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchQuizResult();
  }, [navigate, userID, topic]);

  if (error) {
    return (
      <div className="quiz-history-view">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/home')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  if (!result) {
    return <div className="quiz-history-view">Loading...</div>;
  }

  return (
    <div className="quiz-history-view">
      <header className="quiz-header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-text">LearnX</span>
            </div>
          </div>
        </div>
      </header>

      <h2>Quiz on: {result.topic}</h2>
      <p>Score: {result.score} / {result.total}</p>

      {result.report && (
        <div className="report-section">
          <h3>🧠 AI Feedback Report</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{result.report}</p>
        </div>
      )}

      {result.responses.map((resp, i) => (
        <div key={i} className="question-card">
          <h4 className="question-text">Q{i + 1}: {resp.question}</h4>
          <div className="option-item">
            <strong>Selected:</strong> {resp.selectedOption || 'Not answered'}
          </div>
          <div className={`option-item ${resp.isCorrect ? 'correct' : 'incorrect'}`}>
            <strong>Correct:</strong> {resp.correctOption}
          </div>
          {resp.explanation && (
            <div className="explanation">
              <strong>Explanation:</strong> {resp.explanation}
            </div>
          )}
        </div>
      ))}

      <button className="back-button" onClick={() => navigate('/home')}>
        ⬅ Back to Home
      </button>
    </div>
  );
}

export default QuizHistoryView;
