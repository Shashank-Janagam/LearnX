  // // utils/generateMCQs.js
  // import axios from 'axios';
  // import dotenv from 'dotenv';
  // dotenv.config();

  // // Replace with your actual environment variable names
  // const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
  // const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
  // const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
  // const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

  // export async function generateMCQs(topic, count, profileData) {
  //   const { name, education, stats, recentQuizzes } = profileData;

  //   const prompt = `
  // You are an intelligent quiz generator for a personalized learning platform called LearnX.

  // Generate "${count}" multiple-choice questions (MCQs) on the topic "${topic}" based on the following student's profile:

  // Student Name: ${name}
  // Degree: ${education?.degree || 'Not specified'}
  // Course: ${education?.course || 'Not specified'}
  // Institution: ${education?.institution || 'Not specified'}
  // Country: India
  // Role: ${education?.role || 'Student'}
  // Total Quizzes Taken: ${stats?.totalQuizzes || 0}
  // Average Score: ${stats?.averageScore || 0}%
  // Most Recent Topic Attempted: ${stats?.recentTopic || 'None'}
  // Recent Quizzes attempted: ${JSON.stringify(recentQuizzes || [])}

  // Instructions:
  // - Focus on fundamental and practical understanding suitable for a student with this background.
  // - Questions should gradually increase in difficulty.
  // - Use simple language but ensure conceptual depth.
  // - Avoid repeating previous recent topics.
  // - Add short, helpful explanations for correct answers.

  // Output the MCQs in this exact JSON format:
  // [
  //   {
  //     "question": "What is ...?",
  //     "options": [
  //       { "text": "Option A", "isCorrect": false },
  //       { "text": "Option B", "isCorrect": true },
  //       { "text": "Option C", "isCorrect": false },
  //       { "text": "Option D", "isCorrect": false }
  //     ],
  //     "explanation": "..."
  //   }
  // ]
  // `;

  //   try {
  //     const response = await axios.post(
  //       `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
  //       {
  //         messages: [{ role: 'user', content: prompt }],
  //         temperature: 0.7
  //       },
  //       {
  //         headers: {
  //           'api-key': AZURE_OPENAI_KEY,
  //           'Content-Type': 'application/json'
  //         },
  //         timeout: 30000
  //       }
  //     );

  //     const rawText = response.data.choices[0].message.content;

  //     const start = rawText.indexOf('[');
  //     const end = rawText.lastIndexOf(']');
  //     if (start === -1 || end === -1) {
  //       throw new Error('🛑 JSON array not found in the model output');
  //     }

  //     let jsonString = rawText.substring(start, end + 1);
  //     jsonString = jsonString
  //       .replace(/,\s*}/g, '}')
  //       .replace(/,\s*]/g, ']')
  //       .replace(/“|”/g, '"');

  //     return JSON.parse(jsonString);

  //   } catch (error) {
  //     console.error('❌ Error generating MCQs from Azure OpenAI:', error.response?.data || error.message);
  //     return [];
  //   }
  // }
  // export async function generateReport(responses, topic, score, total, time, timeLeft, profileData) {
  //   const { name, education, stats, recentQuizzes } = profileData;

  //   const prompt = `
  // You are an AI tutor reviewing a student's quiz submission.

  // 👤 Student Profile:
  // - Name: ${name}
  // - Degree: ${education?.degree || 'Not specified'}
  // - Course: ${education?.course || 'Not specified'}
  // - Institution: ${education?.institution || 'Not specified'}
  // - Role: ${education?.role || 'Student'}

  // 📈 Previous Stats:
  // - Total Quizzes: ${stats?.totalQuizzes || 0}
  // - Avg. Score: ${stats?.averageScore || 0}%
  // - Last Topic: ${stats?.recentTopic || 'None'}

  // 📝 Current Quiz:
  // - Topic: "${topic}"
  // - Score: ${score}/${total}
  // - Time Given: ${time} sec
  // - Time Left: ${timeLeft} sec

  // 📤 Answers:
  // ${JSON.stringify(responses, null, 2)}

  // Write a short report in plain English. Format with subtitles using emojis and be concise (8–10 lines). Include:

  // 1. 🔍 A possible reason why the student answered some questions incorrectly.
  // 2. 📊 A short performance summary (compare with average score).
  // 3. ✅ One strong area and ❌ one weak area.
  // 4. ⏱️ A brief time management comment (if timeLeft < 20% or > 80%).
  // 5. 💡 1 tip to improve weak areas.
  // 6. 🎯 End with an encouraging message.

  // not in point wise

  // Do not repeat the instructions or raw data.
  // `;

  //   try {
  //     const response = await axios.post(
  //       `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
  //       {
  //         messages: [{ role: 'user', content: prompt }],
  //         temperature: 0.7
  //       },
  //       {
  //         headers: {
  //           'api-key': AZURE_OPENAI_KEY,
  //           'Content-Type': 'application/json'
  //         },
  //         timeout: 30000
  //       }
  //     );

  //     return response.data.choices[0].message.content;

  //   } catch (error) {
  //     console.error('❌ Error generating report from Azure OpenAI:', error.response?.data || error.message);
  //     return '⚠️ Failed to generate personalized report.';
  //   }
  // }
// utils/generateMCQs.js// server/utils/generateMCQs.js
// server/utils/generateMCQs.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateMCQs(topic, count, profileData,difficulty = 'easy') {
  const { name, education, stats, recentQuizzes } = profileData;

  const prompt = `
You are an intelligent quiz generator for a personalized learning platform called LearnX.

Generate "${count}" multiple-choice questions (MCQs) on the topic "${topic}" based on the following student's profile:
from 
Introductory

Basic

Intermediate

Advanced

Expert

difficulty: ${difficulty} choosen by user

Student Name: ${name}
Degree: ${education?.degree || 'Not specified'}
Course: ${education?.course || 'Not specified'}
Institution: ${education?.institution || 'Not specified'}
Country: India
Role: ${education?.role || 'Student'}
Total Quizzes Taken: ${stats?.totalQuizzes || 0}
Average Score: ${stats?.averageScore || 0}%
Most Recent Topic Attempted: ${stats?.recentTopic || 'None'}
Recent Quizzes attempted: ${JSON.stringify(recentQuizzes || [])}

Instructions:
- Focus on fundamental and practical understanding suitable for a student with this background.
- Questions should gradually increase in difficulty.
- Use simple language but ensure conceptual depth.
- Avoid repeating previous recent topics.
- Add short, helpful explanations for correct answers.

Output the MCQs in this exact JSON format:
[
  {
    "question": "What is ...?",
    "options": [
      { "text": "Option A", "isCorrect": false },
      { "text": "Option B", "isCorrect": true },
      { "text": "Option C", "isCorrect": false },
      { "text": "Option D", "isCorrect": false }
    ],
    "explanation": "..."
  }
]
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash'}); // ✅ correct
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) {
      throw new Error('🛑 JSON array not found in the model output');
    }

    let jsonString = text.substring(start, end + 1);
    jsonString = jsonString
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/“|”/g, '"');

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Error generating MCQs from Gemini:', error.message);
    return [];
  }
}

export async function generateReport(responses, topic, score, total, time, timeLeft, profileData) {
  const { name, education, stats } = profileData;

  const prompt = `
You are an AI tutor reviewing a student's quiz submission.

👤 Student Profile:
- Name: ${name}
- Degree: ${education?.degree || 'Not specified'}
- Course: ${education?.course || 'Not specified'}
- Institution: ${education?.institution || 'Not specified'}
- Role: ${education?.role || 'Student'}

📈 Previous Stats:
- Total Quizzes: ${stats?.totalQuizzes || 0}
- Avg. Score: ${stats?.averageScore || 0}%
- Last Topic: ${stats?.recentTopic || 'None'}

📝 Current Quiz:
- Topic: "${topic}"
- Score: ${score}/${total}
- Time Given: ${time} sec
- Time Left: ${timeLeft} sec

📤 Answers:
${JSON.stringify(responses, null, 2)}

Write a short report in plain English. Format with subtitles using emojis and be concise (8–10 lines). Include:

1. 🔍 A possible reason why the student answered some questions incorrectly.
2. 📊 A short performance summary (compare with average score).
3. ✅ One strong area and ❌ one weak area.
4. ⏱️ A brief time management comment (if timeLeft < 20% or > 80%).
5. 💡 1 tip to improve weak areas.
6. 🎯 End with an encouraging message.

Do not repeat the instructions or raw data.
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' }); // ✅ correct
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Error generating report from Gemini:', error.message);
    return '⚠️ Failed to generate personalized report.';
  }
}


function fmt(val, fallback = 'Not specified') {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string' && val.trim() === '') return fallback;
  return val;
}

function summarizeResponses(responses = [], limit = 8) {
  const safe = Array.isArray(responses) ? responses : [];
  const total = safe.length;
  const incorrect = safe.filter(r => !r?.isCorrect);
  const correct = safe.filter(r => r?.isCorrect);

  const pick = safe.slice(0, limit).map((r, i) => {
    const q = (r?.question || '').replace(/\s+/g, ' ').trim();
    const sel = fmt(r?.selectedOption, '—');
    const cor = fmt(r?.correctOption, '—');
    const exp = fmt(r?.explanation, '—');
    return `Q${i + 1}: ${q}
- Selected: ${sel}
- Correct: ${cor}
- Correct? ${r?.isCorrect ? '✅' : '❌'}
- Explanation: ${exp}`;
  }).join('\n\n');

  return {
    total,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
    sampleBlock: pick
  };
}

function lastUserMessage(messages = []) {
  const m = Array.isArray(messages) ? messages : [];
  for (let i = m.length - 1; i >= 0; i--) {
    if (m[i]?.role === 'user' && m[i]?.content) return m[i].content;
  }
  return '';
}

function compactConversation(messages = [], limit = 8) {
  const m = Array.isArray(messages) ? messages : [];
  const tail = m.slice(-limit);
  return tail.map(msg => {
    const who = msg.role === 'user' ? '🧑 User' : '🤖 AI';
    const text = (msg.content || '').toString().trim();
    return `${who}: ${text}`;
  }).join('\n');
}

export async function generateDoubtChatResponse(messages = [], userMcqs = {}) {
  // Extract & sanitize user context
  const profile = userMcqs?.profileData || {};
  const stats = profile?.stats || userMcqs?.stats || {};
  const name = fmt(profile?.name, 'Student');
  const degree = fmt(profile?.education?.degree);
  const course = fmt(profile?.education?.course);
  const institution = fmt(profile?.education?.institution);
  const role = fmt(profile?.education?.role || profile?.role || 'Student');

  const topic = fmt(userMcqs?.topic, '');
  const score = Number.isFinite(userMcqs?.score) ? userMcqs.score : undefined;
  const total = Number.isFinite(userMcqs?.total) ? userMcqs.total : undefined;
  const time = Number.isFinite(userMcqs?.time) ? userMcqs.time : undefined;
  const timeLeft = Number.isFinite(userMcqs?.timeLeft) ? userMcqs.timeLeft : undefined;

  const { sampleBlock, correctCount, incorrectCount, total: answered } =
    summarizeResponses(userMcqs?.responses, 8);

  const conv = compactConversation(messages, 10);
  const userLast = lastUserMessage(messages);

  // Build a rich, structured prompt
  const prompt = `
You are a helpful, respectful AI tutor for LearnX. Analyze the student's full context and respond appropriately.

=== STUDENT PROFILE ===
Name: ${name}
Role: ${role}
Degree: ${degree}
Course: ${course}
Institution: ${institution}

=== PAST PERFORMANCE (if available) ===
Total Quizzes: ${fmt(stats?.totalQuizzes, 'Unknown')}
Average Score: ${fmt(stats?.averageScore, 'Unknown')}%
Recent Topic: ${fmt(stats?.recentTopic, 'Unknown')}

=== CURRENT QUIZ (if available) ===
Topic: ${fmt(topic, '—')}
Score: ${Number.isFinite(score) && Number.isFinite(total) ? `${score}/${total}` : '—'}
Time Given: ${fmt(time, '—')} sec
Time Left: ${fmt(timeLeft, '—')} sec
Answered: ${answered ?? 0}, Correct: ${correctCount ?? 0}, Incorrect: ${incorrectCount ?? 0}

=== SAMPLE OF RESPONSES (truncated) ===
${sampleBlock || '—'}

=== CONVERSATION (truncated) ===
${conv}

=== TASK ===
1) You can answer ANY subject or topic the student asks, not just quiz questions. Use your general knowledge to teach clearly.
2) IF the question relates to the quiz/topic or their performance, personalize using the data above (responses, score, explanations, timing).
3) If the user asks “what is my name?”, answer with "${name}".
4) If information is missing, acknowledge the gap briefly rather than guessing.
5) Keep responses concise. Prefer:
   - TL;DR (one line)
   - Key ideas (bullets)
   - Tiny example (code/math if relevant)
   - Common mistakes
   - 1–2 quick practice tasks or next steps
6) If the question is ambiguous, ask a brief clarifying question first.

=== USER'S LATEST MESSAGE ===
"${userLast}"
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Error generating doubt chat response:', error.message);
    return '⚠️ Sorry, I could not process your question right now.';
  }
}
