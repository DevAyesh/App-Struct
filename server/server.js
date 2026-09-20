const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file (optional in production)
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️  No .env file found - using environment variables from hosting platform');
  console.log('This is normal for production deployments (Railway, Render, etc.)');
} else {
  console.log('✅ .env file loaded successfully');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const authRoutes = require('./routes/auth');
const Blueprint = require('./models/Blueprint');
const { generateBlueprint } = require('./services/deepseek');
const auth = require('./middleware/auth');

const app = express();

// Trust proxy for Railway/production deployments
// This allows express-rate-limit to correctly identify users via X-Forwarded-For header
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Railway)
}

// Debug environment variables (without exposing sensitive data)
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI_exists: !!process.env.MONGODB_URI,
  PORT_exists: !!process.env.PORT,
  GEMINI_API_KEY_exists: !!process.env.GEMINI_API_KEY,
  JWT_SECRET_exists: !!process.env.JWT_SECRET,
  current_dir: __dirname,
  env_path: envPath,
  env_loaded: !!result.parsed
});

// Verify required environment variables
const requiredEnvVars = ['MONGODB_URI', 'GEMINI_API_KEY', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('📝 Please check your Railway/hosting platform environment variables');
  console.error('Required variables:', requiredEnvVars.join(', '));
  process.exit(1);
}

// Middleware
// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"].filter(Boolean)
    }
  },
  crossOriginEmbedderPolicy: false // Allow external resources
}));

// Configure CORS with strict allowlist
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
// Blueprints can be large markdown payloads (generation often exceeds 10kb).
app.use(express.json({ limit: '2mb' }));

const isTestEnv = (req) => process.env.NODE_ENV === 'test' || (process.env.NODE_ENV !== 'production' && req.headers['x-test-suite'] === 'true');

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: true, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
});

// Stricter rate limiting for generation endpoints
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 generation requests per 15 minutes
  message: { error: true, message: 'Too many generation requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: true, message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTestEnv,
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve static files from the public directory
app.use(express.static('public'));

// Connect to MongoDB with detailed logging
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    if (process.env.NODE_ENV !== 'production') {
      console.log('Database URL:', config.mongodb.uri.replace(
        /(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.+)/,
        '$1[HIDDEN]$3'
      ));
    }

    // Add mongoose debug logging only in development
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', true);
    }

    await mongoose.connect(config.mongodb.uri, {
      dbName: 'appstruct'
    });

    // Log collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Log database name
    console.log('Connected to database:', mongoose.connection.db.databaseName);

    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
};

// Initialize database connection
connectDB().catch(console.error);

// Add request logging middleware (only in development, with sensitive data sanitization)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Create sanitized body copy to prevent password leaks
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '[HIDDEN]';
    if (sanitizedBody.oldPassword) sanitizedBody.oldPassword = '[HIDDEN]';
    
    console.log(`${req.method} ${req.path}`, {
      body: sanitizedBody,
      query: req.query,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[HIDDEN]' : undefined,
        cookie: req.headers.cookie ? '[HIDDEN]' : undefined
      }
    });
    next();
  });
}

// Health check route for Render and monitoring
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/verify-email', verifyLimiter);
app.use('/api/auth', authRoutes);

// DNS test endpoint (for debugging - only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dns-test', async (req, res) => {
    const dns = require('dns').promises;
    try {
      const addresses = await dns.resolve4('generativelanguage.googleapis.com');
      res.json({
        success: true,
        hostname: 'generativelanguage.googleapis.com',
        addresses: addresses,
        message: 'DNS resolution successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        message: 'DNS resolution failed'
      });
    }
  });
}

// User generation concurrency lock
const activeGenerations = new Set();

// Protected routes
app.post('/api/generate', generateLimiter, auth, async (req, res) => {
  const userIdStr = req.user._id.toString();

  if (activeGenerations.has(userIdStr)) {
    return res.status(409).json({
      error: true,
      message: 'A blueprint generation is already in progress for your account. Please wait for it to complete.'
    });
  }

  activeGenerations.add(userIdStr);

  try {
    const { idea, platform, detailLevel } = req.body;
    
    // Strict input validation
    if (!idea || !platform || typeof idea !== 'string' || typeof platform !== 'string') {
      return res.status(400).json({ 
        error: true,
        message: 'Idea and platform must be valid strings' 
      });
    }

    if (idea.trim().length < 10) {
      return res.status(400).json({ 
        error: true,
        message: 'Idea must be at least 10 characters long' 
      });
    }

    if (idea.length > 5000) {
      return res.status(400).json({ 
        error: true,
        message: 'Idea is too long (maximum 5000 characters)' 
      });
    }

    const validPlatforms = ['web', 'mobile', 'both'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        error: true,
        message: 'Invalid platform. Must be one of: web, mobile, both' 
      });
    }

    if (detailLevel && (typeof detailLevel !== 'string' || !['brief', 'full'].includes(detailLevel))) {
      return res.status(400).json({
        error: true,
        message: 'Invalid detail level. Must be one of: brief, full'
      });
    }

    const markdown = await generateBlueprint(idea, platform, detailLevel);
    res.json({ markdown });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Generate API Error:', error.message);
    }

    res.status(500).json({
      error: true,
      message: 'Error generating blueprint'
    });
  } finally {
    activeGenerations.delete(userIdStr);
  }
});

// Streaming endpoint for real-time blueprint generation with explicit completion protocol
app.post('/api/generate-stream', generateLimiter, auth, async (req, res) => {
  const userIdStr = req.user._id.toString();

  // Server-side concurrency lock
  if (activeGenerations.has(userIdStr)) {
    return res.status(409).json({
      error: true,
      message: 'A blueprint generation is already in progress for your account. Please wait for it to complete.'
    });
  }

  activeGenerations.add(userIdStr);

  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
    activeGenerations.delete(userIdStr);
  });

  try {
    const { idea, platform, detailLevel } = req.body;
    
    // Strict input validation
    if (!idea || !platform || typeof idea !== 'string' || typeof platform !== 'string') {
      return res.status(400).json({ 
        error: true,
        message: 'Idea and platform must be valid strings' 
      });
    }

    if (idea.trim().length < 10) {
      return res.status(400).json({ 
        error: true,
        message: 'Idea must be at least 10 characters long' 
      });
    }

    if (idea.length > 5000) {
      return res.status(400).json({ 
        error: true,
        message: 'Idea is too long (maximum 5000 characters)' 
      });
    }

    const validPlatforms = ['web', 'mobile', 'both'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        error: true,
        message: 'Invalid platform. Must be one of: web, mobile, both' 
      });
    }

    if (detailLevel && (typeof detailLevel !== 'string' || !['brief', 'full'].includes(detailLevel))) {
      return res.status(400).json({ 
        error: true,
        message: 'Invalid detail level. Must be one of: brief, full' 
      });
    }

    // Set headers for SSE stream
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Call the streaming version of generateBlueprint with structured SSE framing
    const { generateBlueprintStream } = require('./services/deepseek');
    const fullResult = await generateBlueprintStream(idea, platform, detailLevel, (chunk) => {
      if (!isAborted) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }
    });
    
    if (!isAborted) {
      // Explicit completion protocol signal
      res.write(`data: ${JSON.stringify({ type: 'done', fullMarkdown: fullResult })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Streaming Generate API Error:', error.message);
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: true,
        message: 'Error generating blueprint'
      });
    } else if (!isAborted) {
      // Send explicit error message frame before ending stream
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Stream generation failed midway.' })}\n\n`);
      res.end();
    }
  } finally {
    activeGenerations.delete(userIdStr);
  }
});

app.post('/api/blueprints', auth, async (req, res) => {
  try {
    const { ideaInput, platform, generatedMarkdown, detailLevel, title } = req.body;

    if (!ideaInput || !platform || !generatedMarkdown) {
      return res.status(400).json({
        error: true,
        message: 'ideaInput, platform, and generatedMarkdown are required'
      });
    }

    if (
      typeof ideaInput !== 'string' || 
      typeof platform !== 'string' || 
      typeof generatedMarkdown !== 'string' ||
      (title && typeof title !== 'string') ||
      (detailLevel && typeof detailLevel !== 'string')
    ) {
      return res.status(400).json({
        error: true,
        message: 'Invalid blueprint payload format'
      });
    }

    const validPlatforms = ['web', 'mobile', 'both'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        error: true,
        message: 'Invalid platform. Must be one of: web, mobile, both'
      });
    }

    const blueprint = new Blueprint({
      ideaInput: ideaInput.trim(),
      title: (title || ideaInput).trim().slice(0, 80),
      detailLevel: ['brief', 'full'].includes(detailLevel) ? detailLevel : 'full',
      platform: platform.toLowerCase(),
      generatedMarkdown,
      userId: req.user._id
    });
    await blueprint.save();
    res.status(201).json(blueprint);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Save blueprint error:', error.message);
    }
    res.status(400).json({ 
      error: true,
      message: 'Error saving blueprint'
    });
  }
});

app.get('/api/blueprints', auth, async (req, res) => {
  try {
    const blueprints = await Blueprint.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(blueprints);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Get blueprints error:', error.message);
    }
    res.status(500).json({ 
      error: true,
      message: 'Error fetching blueprints'
    });
  }
});

// Delete blueprint endpoint with ObjectId validation
app.delete('/api/blueprints/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid blueprint ID format. Must be a valid 24-character hexadecimal ID.'
      });
    }

    const blueprint = await Blueprint.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!blueprint) {
      return res.status(404).json({ error: true, message: 'Blueprint not found' });
    }
    res.json({ success: true, message: 'Blueprint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error deleting blueprint' });
  }
});

// Rename blueprint endpoint with ObjectId validation
app.put('/api/blueprints/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid blueprint ID format. Must be a valid 24-character hexadecimal ID.'
      });
    }

    const { title, ideaInput } = req.body;

    if ((title && typeof title !== 'string') || (ideaInput && typeof ideaInput !== 'string')) {
      return res.status(400).json({
        error: true,
        message: 'Title and ideaInput must be valid strings'
      });
    }

    const newName = (title || ideaInput || '').trim();
    if (!newName) {
      return res.status(400).json({ error: true, message: 'Title or ideaInput is required' });
    }
    const blueprint = await Blueprint.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { title: newName, ideaInput: newName } },
      { new: true }
    );
    if (!blueprint) {
      return res.status(404).json({ error: true, message: 'Blueprint not found' });
    }
    res.json(blueprint);
  } catch (error) {
    res.status(500).json({ error: true, message: 'Error updating blueprint' });
  }
});

// Global process error handlers to prevent sudden server termination
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
