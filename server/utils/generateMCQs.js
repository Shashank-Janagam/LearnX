// utils/generateMCQs.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Replace with your actual environment variable names
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

export async function generateMCQs(topic, count, profileData) {
  const { name, education, stats, recentQuizzes } = profileData;

  const prompt = `
You are an intelligent quiz generator for a personalized learning platform called LearnX.

Generate "${count}" multiple-choice questions (MCQs) on the topic "${topic}" based on the following student's profile:

Student Name: ${name}
Degree: ${education?.degree || 'Not specified'}
Course: ${education?.course || 'Not specified'}
Institution: ${education?.institution || 'Not specified'}
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
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const rawText = response.data.choices[0].message.content;

    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');
    if (start === -1 || end === -1) {
      throw new Error('🛑 JSON array not found in the model output');
    }

    let jsonString = rawText.substring(start, end + 1);
    jsonString = jsonString
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/“|”/g, '"');

    return JSON.parse(jsonString);

  } catch (error) {
    console.error('❌ Error generating MCQs from Azure OpenAI:', error.response?.data || error.message);
    return [];
  }
}

export async function generateReport(responses, topic, score, total) {
  const prompt = `
You are an intelligent tutor analyzing a student's quiz attempt.

Topic: "${topic}"  
Score: ${score} out of ${total}

Responses:
${JSON.stringify(responses, null, 2)}

Now, write a brief and simple personalized report (10–15 lines only).  
Use short, clear sentences suitable for a student.
Include:  
1. A quick summary of performance  
2. One strong area and one weak area  
3. 1–2 tips for improvement  
4. End with a short, encouraging sentence
`;

  try {
    const response = await axios.post(
      `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`,
      {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('❌ Error generating report from Azure OpenAI:', error.response?.data || error.message);
    return '⚠️ Failed to generate personalized report.';
  }
}
