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
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Function: Generate MCQs
export async function generateMCQs(topic, count, profileData) {
  const { name, education, stats, recentQuizzes } = profileData;

  const prompt = `
You are an intelligent quiz generator for a personalized learning platform called LearnX.

Generate "${count}" multiple-choice questions (MCQs) on the topic "${topic}" based on the following student's profile:

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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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

// 🔹 Function: Generate Quiz Report
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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Error generating report from Gemini:', error.message);
    return '⚠️ Failed to generate personalized report.';
  }
}
