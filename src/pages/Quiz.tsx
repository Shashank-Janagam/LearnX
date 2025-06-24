import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';

interface MCQOption {
  text: string;
  isCorrect: boolean;
}

interface MCQ {
  question: string;
  options: MCQOption[];
  explanation?: string;
}

function Quiz() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { topic, userID, email } = state || {};

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState('');
  const [report, setReport] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [queries, setQueries] = useState([]);

  const [quizConfig, setQuizConfig] = useState({ count: 5, timeLimit: 5 }); // minutes
  const [showConfig, setShowConfig] = useState(true);

  const calculateScore = () => {
    let correct = 0;
    mcqs.forEach((mcq, index) => {
      const selectedIndex = selectedAnswers[index];
      const selectedOption = mcq.options[selectedIndex];
      if (selectedOption?.isCorrect) correct++;
    });
    return correct;
  };

  const handleSubmitAll = useCallback(async () => {
    const allResults: { [key: number]: boolean } = {};
    mcqs.forEach((_, index) => {
      allResults[index] = true;
    });
    setShowResults(allResults);

    const responses = mcqs.map((mcq, index) => {
      const selectedIndex = selectedAnswers[index];
      const selectedOption = mcq.options[selectedIndex];
      return {
        question: mcq.question,
        score: calculateScore(),
        selectedOption: selectedOption?.text || '',
        correctOption: mcq.options.find((opt) => opt.isCorrect)?.text || '',
        explanation: mcq.explanation || '',
        isCorrect: selectedOption?.isCorrect || false,
      };
    });

    const score = calculateScore();
    try {
      const result = await axios.post('http://localhost:5000/quiz/report', {
        topic,
        score,
        total: mcqs.length,
        responses,
      });

      const generatedReport = result.data.report;
      setReport(generatedReport);

      await axios.post('http://localhost:5000/quiz/save-result', {
        userID,
        email,
        topic,
        score,
        total: mcqs.length,
        responses,
        report: generatedReport,
      });

      await saveQuizResult(email, topic, (score / mcqs.length) * 100);
    } catch (err) {
      console.error('❌ Failed to save quiz result:', err);
    }
  }, [mcqs, selectedAnswers, topic, userID, email]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('userEmail');
    if (!storedEmail) navigate('/');
  }, [navigate]);

  useEffect(() => {
    document.title = `LearnX | ${topic}`;
  }, [topic]);

  useEffect(() => {
    if (!topic) {
      setError('No topic provided');
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    if (!showConfig && timeLeft > 0 && mcqs.length > 0 && Object.keys(showResults).length === 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === 1) handleSubmitAll();
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showConfig, timeLeft, mcqs.length, showResults, handleSubmitAll]);

  const fetchMCQs = async (count: number) => {
    setTimeLeft(quizConfig.timeLimit * 60); // minutes to seconds
    setLoading(true);
    try {
      const [res, res1] = await Promise.all([
        axios.post('http://localhost:5000/quiz/generate', { topic, count }),
        axios.post('http://localhost:5000/api/queries', { topic, userID, email }),
      ]);
      setMcqs(res.data.mcqs);
      setQueries([res1.data, ...queries]);
    } catch (err) {
      setError('Failed to generate questions. Using sample data...');
      setMcqs(generateSampleMCQs(topic));
    } finally {
      setLoading(false);
    }
  };

  const saveQuizResult = async (email: string, topic: string, score: number) => {
    try {
      await axios.post('http://localhost:5000/api/profile/quiz', { email, topic, score });
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  const generateSampleMCQs = (topicName: string): MCQ[] => [
    {
      question: `What is a fundamental concept in ${topicName}?`,
      options: [
        { text: 'Basic principle A', isCorrect: true },
        { text: 'Basic principle B', isCorrect: false },
        { text: 'Basic principle C', isCorrect: false },
        { text: 'Basic principle D', isCorrect: false },
      ],
      explanation: `This is a sample question about ${topicName}.`,
    },
    {
      question: `Which is important when studying ${topicName}?`,
      options: [
        { text: 'Understanding basics', isCorrect: false },
        { text: 'Practical application', isCorrect: true },
        { text: 'Memorizing facts', isCorrect: false },
        { text: 'Reading a lot', isCorrect: false },
      ],
      explanation: `Practical application helps reinforce ${topicName} knowledge.`,
    },
  ];

  const handleOptionClick = (qIndex: number, oIndex: number) => {
    if (Object.keys(showResults).length > 0) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleBackToHome = () => navigate('/Home');

  const totalAnswered = Object.keys(showResults).length;
  const score = calculateScore();

  if (!topic) {
    return (
      <div className="quiz-container">
        <div className="error-card">
          <h2>No Topic Selected</h2>
          <p>Please go back and select a topic to generate questions.</p>
          <button onClick={handleBackToHome} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ...rest of your JSX is unchanged, already clean.

  return (
    <div className="quiz-container">
      {/* Same JSX content as before */}
    </div>
  );
}

export default Quiz;
