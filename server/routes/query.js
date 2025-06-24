import express from 'express';

import Query from '../models/Query.js';

const router= express.Router();
router.post('/', async (req, res) => {
  try {
    const { topic, userID } = req.body;  // 👈 match exact field names
    const newQuery = new Query({ topic, userID });
    await newQuery.save();
    res.status(201).json(newQuery);
  } catch (err) {
    console.error('❌ Error saving query:', err); // 👈 LOG THE ERROR
    res.status(500).json({ error: 'Error saving query', details: err.message });
  }

  // console.log(req.topic);

});


// GET all queries


export default router;