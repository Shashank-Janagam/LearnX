import express from 'express';
import { generateMCQs,generateReport ,generateDoubtChatResponse}   from '../utils/generateMCQs.js'; // Adjust the path as needed
import QuizResult from '../models/QuizResult.js';

const router =express.Router();

router.post('/generate',async (req, res) => {
    const {topic ,count,profileData}=req.body;

    try{
        const mcqs=await generateMCQs(topic, count,profileData);
        res.json({success:true,topic, mcqs});
    }catch(err){
            res.status(500).json({ success: false, message: 'Failed to generate MCQs', error: err.message });

    }

});
// routes/quiz.js
router.post('/report', async (req, res) => {
  const { responses, topic, score, total ,time,timeLeft,profileData} = req.body;
  try {
    const report = await generateReport(responses, topic, score, total,time,timeLeft,profileData);
    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate report' });
  }
});

// server/routes/quiz.js or similar

router.post('/save-result', async (req, res) => {
  const { userID, email, topic, score, total, responses, report } = req.body;

  try {
    const result = new QuizResult({
      userID,
      email,
      topic,
      score,
      total,
      responses,
      report, // ✅ Save the report
      createdAt: new Date()
    });

    await result.save();
    res.status(200).json({ message: 'Result saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save quiz result:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/gemini-doubt-chat', async (req, res) => {
  const { messages, userMcqs } = req.body;
  console.log('Incoming messages:', messages);
  console.log('Incoming userMcqs:', userMcqs);
  try {
    const aiReply = await generateDoubtChatResponse(messages, userMcqs);
    res.status(200).json({ content: aiReply });
  } catch (error) {
    console.error('❌ Error generating doubt chat response:', error.message);
    res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});


// res.json({ mcqs });


export default router;