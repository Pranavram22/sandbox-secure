import express from 'express';
import cors from 'cors';
import { scanCodeWithApiKey, generateFixWithApiKey } from '../lib/api';

const router = express.Router();

// Enable CORS for VS Code extension
router.use(cors());
router.use(express.json());

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers.authorization?.split('Bearer ')[1];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  // Store API key in request for later use
  req.apiKey = apiKey;
  next();
};

// Endpoint to scan code
router.post('/scan', validateApiKey, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }
    
    const result = await scanCodeWithApiKey(code, language, req.apiKey);
    
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while scanning code' });
  }
});

// Endpoint to generate fix
router.post('/fix', validateApiKey, async (req, res) => {
  try {
    const { scan_id, vulnerability_index } = req.body;
    
    if (!scan_id || vulnerability_index === undefined) {
      return res.status(400).json({ error: 'Scan ID and vulnerability index are required' });
    }
    
    const fixedCode = await generateFixWithApiKey(scan_id, vulnerability_index, req.apiKey);
    
    res.json({ fixed_code: fixedCode, applied: false });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while generating fix' });
  }
});

export default router;