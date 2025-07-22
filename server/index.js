const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (better for processing files)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// API Endpoint for File Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File received:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during file upload' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});