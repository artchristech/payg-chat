const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for now
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size } = req.file;
    
    console.log('File uploaded successfully:');
    console.log(`- Name: ${originalname}`);
    console.log(`- Type: ${mimetype}`);
    console.log(`- Size: ${size} bytes`);
    
    // For now, just confirm receipt
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: originalname,
        type: mimetype,
        size: size
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'RAG Backend Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`RAG Backend Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint available at http://localhost:${PORT}/api/upload`);
});