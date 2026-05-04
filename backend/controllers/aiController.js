const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize only if key exists
const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

exports.generate = async (req, res) => {
  const { prompt } = req.body;
  
  const genAI = getGeminiClient();
  if (!genAI) {
    return res.status(503).json({ 
      msg: 'AI service not configured', 
      error: 'GEMINI_API_KEY is missing in server environment variables.' 
    });
  }

  if (!prompt) {
    return res.status(400).json({ msg: 'Prompt is required' });
  }

  try {
    // Try using gemini-1.5-flash first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini primary model failed, trying fallback:', err.message);
    try {
      // Fallback to gemini-pro if flash is unavailable
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      res.json({ result: text });
    } catch (fallbackErr) {
      console.error('Gemini fallback failed:', fallbackErr.message);
      res.status(500).json({ msg: 'Failed to generate content', error: fallbackErr.message });
    }
  }
};
