import React, { useState, useEffect,useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Quiz.css';
import './Home.tsx';
import { Divide } from 'lucide-react';
import { set } from 'mongoose';
import { Search, User, Sparkles } from 'lucide-react';
import ReactMarkdown from "react-markdown";

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
  const [report, setReport] = useState<string>(''); // New state
  const chatRef = useRef<HTMLDivElement>(null);
  const [chat, setChat] = useState('Ask a Doubt or Explore a Topic');
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string>('');
const [timeLeft, setTimeLeft] = useState<number>(0);
const [time,setTime]=useState<number>(0);
  const [queries, setQueries] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [quizConfig, setQuizConfig] = useState({ count: 5, timeLimit: 5 , difficulty: 'easy' });
  const [showConfig, setShowConfig] = useState(true);
  const [isgenerating, setIsGenerating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [degree, setDegree] = useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [role, setRole]=useState('');
const [res, setRes] = useState(null); // holds the user MCQ result
  useEffect(() => {

    const storedEmail=sessionStorage.getItem('userEmail');
    if (!storedEmail){
      navigate('/');
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 10) {
        setIsChatOpen(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `https://learnx-ed1w.onrender.com/api/profile/email/${encodeURIComponent(email)}`
        );
        setProfileData(response.data);
        if (response.data.education) {
          const { degree, course, institution } = response.data.education;
          setDegree(degree || '');
          setCourse(course || '');
          setInstitution(institution || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    if (email) {
      fetchProfile();
    }
  }, [email]);
useEffect(() => {
  document.title = `LearnX | ${topic}`;
}, [topic]);
  const fetchMCQs = async (count: number,difficulty:string) => {
    setTimeLeft(quizConfig.timeLimit * 60); // convert minutes to seconds
    setTime(timeLeft);
    setLoading(true);
    try {
      const [res, res1] = await Promise.all([
        axios.post('https://learnx-ed1w.onrender.com/quiz/generate', { topic, count ,profileData, difficulty }),
        axios.post('https://learnx-ed1w.onrender.com/api/queries', { topic, userID, email })
      ]);
      setMcqs(res.data.mcqs);
      setQueries([res1.data, ...queries]);

    } catch (err) {
      console.error('❌ Error fetching MCQs:', err);
      setError('Failed to generate questions. Using sample data...');
      const sampleMCQs = generateSampleMCQs(topic);
      setMcqs(sampleMCQs);
    } finally {
      setLoading(false);
    }
  };

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
        if (prevTime === 1) {
          handleSubmitAll();
        }
        return prevTime - 1;
      });

    }, 1000);
    return () => clearInterval(timer);
  }
}, [showConfig, timeLeft, mcqs, showResults]);

   useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setIsChatOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
const saveQuizResult = async (email, topic, score) => {
  try {
    const response = await axios.post('https://learnx-ed1w.onrender.com/api/profile/quiz', {
      email,
      topic,
      score
    });
    console.log('Quiz saved:', response.data);
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
const calculateScore = () => {
  let correct = 0;
  mcqs.forEach((mcq, index) => {
    if (selectedAnswers[index] !== undefined) {
      const selectedOption = mcq.options[selectedAnswers[index]];
      if (selectedOption?.isCorrect) correct++;
    }
  });
  return correct;
};

  const handleSubmitAll = async () => {
    setIsGenerating(true);

    
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
      score:calculateScore(),
      selectedOption: selectedOption?.text || '',
      correctOption: mcq.options.find((opt) => opt.isCorrect)?.text || '',
      explanation: mcq.explanation || '',
      isCorrect: selectedOption?.isCorrect || false,
    };
  });

    const score = calculateScore();
    setRes({
      topic,
      score,
      total: mcqs.length,
      responses,
      time,
      timeLeft,
      profileData
    });
    setIsSubmitted(true);


   const result =await axios.post('https://learnx-ed1w.onrender.com/quiz/report', {
      topic,
      score,
      total: mcqs.length,
      responses,
      time,
      timeLeft,
      profileData
    });
 const generatedReport = result.data.report;
setReport(generatedReport);


  try {
    await axios.post('https://learnx-ed1w.onrender.com/quiz/save-result', {
      userID,
      email,
      topic,
      score,
      total: mcqs.length,
      responses,
      report:generatedReport,
    });

    saveQuizResult(sessionStorage.getItem("userEmail"), topic, Math.floor((score / mcqs.length) * 100));

 
    console.log('✅ Quiz result saved');
  } catch (err) {
    console.error('❌ Failed to save quiz result:', err);
  }




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

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <div className="header-content">
        <div className="logo-container">
          <div className="logo-icon">
            <span className="logo-text">LearnX</span>


                </div>
              </div>

        {isSubmitted && !isChatOpen && (<button className="ai-launch-btn" aria-label="Open AI Chat" onClick={() => setIsChatOpen(true)}>
  <span className="icon">🤖</span>
  <span className="label">Ask AI</span>
  <span className="dot"></span> 
</button>)};



          <div className="quiz-info">



            <span className="topic-badge">{topic}</span>
            {totalAnswered > 0 && (
              <span className="score-badge">Score: {score}/{mcqs.length}</span>
            )}


            {!showConfig && mcqs.length > 0 && (
  <span className="timer-badge">
    Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
  </span>


  
)}

          </div>
        </div>
      </header>

      <main className="quiz-main">
        {showConfig ? (
          <div className="config-section">
            <div className="config-card">
  <h2>Configure Your Quiz</h2>

  <div className="scroll-picker-section">
    <label>Number of Questions</label>
    <div className="scroll-picker">
      <select
        value={quizConfig.count}
        onChange={(e) =>
          setQuizConfig({ ...quizConfig, count: Number(e.target.value) })
        }
      >
        {[...Array(30)].map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1} 
          </option>
        ))}
      </select>
    </div>
  </div>

  <div className="scroll-picker-section">
    <label>Difficulty Level</label>
    <div className="scroll-picker">
      <select
        value={quizConfig.difficulty}
        onChange={(e) =>
          setQuizConfig({ ...quizConfig, difficulty: e.target.value })
        }
      >
        <option value="introductory">Introductory</option>
        <option value="basic">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
        <option value="expert">Expert</option>

      </select>
    </div>
  </div>

  <div className="scroll-picker-section">
    <label>Time Limit</label>
    <div className="time-picker-container">
      <select
        value={Math.floor(quizConfig.timeLimit / 60)}
        onChange={(e) =>
          setQuizConfig({
            ...quizConfig,
            timeLimit:
              Number(e.target.value) * 60 +
              (quizConfig.timeLimit % 60),
          })
        }
      >
        {[...Array(6)].map((_, i) => (
          <option key={i} value={i}>
            {i} hr
          </option>
        ))}
      </select>

      <span>:</span>

      <select
        value={quizConfig.timeLimit % 60}
        onChange={(e) =>
          setQuizConfig({
            ...quizConfig,
            timeLimit:
              Math.floor(quizConfig.timeLimit / 60) * 60 +
              Number(e.target.value),
          })
        }
      >
        {[...Array(60)].map((_, i) => (
          <option key={i} value={i}>
            {i < 10 ? '0' + i : i} min
          </option>
        ))}
      </select>
    </div>
  </div>

  <button
    className="start-button"
    onClick={() => {
      setShowConfig(false);
      fetchMCQs(quizConfig.count, quizConfig.difficulty);
    }}
  >
    Start Quiz
  </button>
    

</div>


          </div>
        ) : loading ? (
          <div className="loading-section">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <h3>Generating Questions...</h3>
              <p>Creating personalized MCQs for "{topic}"</p>
            </div>
          </div>
        ) : error && mcqs.length === 0 ? (
          <div className="error-section">
            <div className="error-card">
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button onClick={handleBackToHome} className="back-button">
                Try Another Topic
              </button>
            </div>
          </div>
        ) : (
          <div className="questions-section">
            <div className="questions-header">
              <h2 className="questions-title">Quiz: {topic}</h2>
                  {Object.keys(showResults).length > 0 && (
                    <button onClick={handleBackToHome} className="back-button">Try Another Topic   
                          <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: '8px', verticalAlign: 'middle', marginLeft:'5px' }}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
             
                    </button>
                  )}
            </div>

{isSubmitted && (
  <DoubtChat
    quizData={res}
    isChatOpen={isChatOpen}
    setIsChatOpen={setIsChatOpen}
  />
)}

        {report === '' && isgenerating ? (
  <div className="report-loading">
    <h3>🔍 Generating AI Report...</h3>
    <div className="spinner"></div>
  </div>
) : report!==''?(
  <div className="report-section">
    <h3>🧠 AI Feedback Report</h3>
    <p style={{ whiteSpace: 'pre-line' }}>{report}</p>
  </div>
):null}





            <div className="questions-grid">
              {mcqs.map((mcq, qIndex) => (
                <div key={qIndex} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Question {qIndex + 1}</span>
                    {showResults[qIndex] && (
                      <span className={`result-badge ${
                        mcq.options[selectedAnswers[qIndex]]?.isCorrect
                          ? 'correct'
                          : 'incorrect'
                      }`}>
                        {mcq.options[selectedAnswers[qIndex]]?.isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  <h4 className="question-text">{mcq.question}</h4>

                  <div className="options-list">
                    {mcq.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => handleOptionClick(qIndex, oIndex)}
                        disabled={!!showResults[qIndex]}
                        className={`option-button ${
                          selectedAnswers[qIndex] === oIndex ? 'selected' : ''
                        } ${
                          showResults[qIndex]
                            ? option.isCorrect
                              ? 'correct'
                              : selectedAnswers[qIndex] === oIndex
                              ? 'incorrect'
                              : ''
                            : ''
                        }`}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + oIndex)}</span>
                        <span className="option-text">{option.text}</span>
                      </button>
                    ))}
                  </div>

                  {showResults[qIndex] && mcq.explanation && (
                    <div className="explanation-section">
                      <h5 className="explanation-title">Explanation:</h5>
                      <p className="explanation-text">{mcq.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!Object.keys(showResults).length && (
              <div className="submit-all-container">
                <button
                  onClick={handleSubmitAll}
                  // disabled={Object.keys(selectedAnswers).length !== mcqs.length}
                  className="submit-button"
                >
                  Submit All Answers
                </button>
              </div>
            )}
          </div>
        )}


      </main>
      
    </div>

    
  );
}


const DoubtChat = ({ quizData, isChatOpen, setIsChatOpen }) => {
    // You can now use quizData inside this component
    // console.log("Received MCQs:", quizData); // ✅ For testing

    const chatRef = useRef<HTMLDivElement>(null);
    const [chat, setChat] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(true);



  

  const [messages, setMessages] = useState([  ]);
  const handleDoubt = async (e) => {
    e.preventDefault();

    const newUserMessage = { role: "user", content: chat.trim() };
    const updatedMessages = [...messages, newUserMessage];

    setMessages(updatedMessages); // ✅ Add user message
    setChat('');
    console.log(quizData, "from frontend");
    try {
      const res = await fetch('https://learnx-ed1w.onrender.com/quiz/gemini-doubt-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, userMcqs: quizData }), // ✅ Use updatedMessages, not old messages
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      console.log('AI response:', data.content);

      // ✅ Add AI response to chat
      const aiMessage = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (err) {
      console.error('❌ Fetch error:', err.message);
    }
  };
useEffect(() => {
  if (isChatOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  return () => {
    document.body.style.overflow = 'auto'; // Always reset on unmount
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
    }, []);
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (e.clientX <= 10) {
          setIsChatOpen(true);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
const messagesRef = useRef(null);
const endRef = useRef(null);

useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

    return (
      <>
        {isSubmitted ? (
          <div
            ref={chatRef}
            className={`history-sidebar ${isChatOpen ? 'open' : ''}`}
          >
            <div className="logos">
              <div className="logo-container" id="slider">
                <div className="logo-icon">
                  <span className="logo-text">LearnX</span>
                </div>
              </div>
              <h2 className="history-title">AI Doubt Session</h2>


              <div className="chat-wrapper">

  <div className="chat-messages">
      {messages.map((msg, index) => (
    <div key={index} className={`msg ${msg.role === 'user' ? 'user-msg' : 'bot-msg'}`}>
      <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    ))}
      <div ref={endRef} />   {/* anchor */}



    </div>
              <form className="search-form" onSubmit={handleDoubt} >
                <div className="search-wrapper">
                  <input
                    type="text"
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    placeholder="Ask a Doubt or Explore a Topic"
                    className="search-input"
                  />
                  <button
                    type="submit"
                    className="search-submit"
                    disabled={!chat.trim()}
                  >
                    <Search className="search-icon" />
                  </button>
                </div>
              </form>
            </div></div>
          </div>
        ) : null}
      </>
    );
  };
  export default Quiz;




  
