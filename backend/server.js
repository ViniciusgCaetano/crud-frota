// Import necessary modules and packages
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Import Middleware (nomeados, não default)
import { autenticar } from './middleware/authMiddleware.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import beneficiosRoutes from './routes/beneficiosRoutes.js';
import devolucoesRoutes from './routes/devolucoesRoutes.js';
import documentosRoutes from './routes/documentosRoutes.js';
import eventosRoutes from './routes/eventosRoutes.js';
import relatoriosRoutes from './routes/relatoriosRoutes.js';
import reservasRoutes from './routes/reservasRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import veiculosRoutes from './routes/veiculosRoutes.js';

// Load environment variables from .env file
process.env.DOTENV_CONFIG_SILENT = true;
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ========== DATABASE CONNECTION ==========
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// ========== MIDDLEWARE SETUP ==========

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== API KEY MIDDLEWARE ==========
// protege tudo que começa com /api
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
});

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin || 'No Origin'
    }`
  );
  next();
});

// ========== API ROUTES SETUP ==========
// Public (só precisa da API key)
app.use('/api/v1/auth', authRoutes);

// Protected (API key + JWT)
app.use('/api/v1/veiculos', autenticar, veiculosRoutes);
app.use('/api/v1/documentos', autenticar, documentosRoutes);
app.use('/api/v1/beneficios', autenticar, beneficiosRoutes);
app.use('/api/v1/reservas', autenticar, reservasRoutes);
app.use('/api/v1/devolucoes', autenticar, devolucoesRoutes);
app.use('/api/v1/eventos', autenticar, eventosRoutes);
app.use('/api/v1/relatorios', autenticar, relatoriosRoutes);
app.use('/api/v1/usuarios', autenticar, usuariosRoutes);

// ========== BASIC ROUTES ==========
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Frota de Veículos',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      veiculos: '/api/v1/veiculos',
      documentos: '/api/v1/documentos',
      beneficios: '/api/v1/beneficios',
      reservas: '/api/v1/reservas',
      devolucoes: '/api/v1/devolucoes',
      eventos: '/api/v1/eventos',
      relatorios: '/api/v1/relatorios',
      usuarios: '/api/v1/usuarios'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API is operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ========== 404 ==========
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy: Origin not allowed'
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate record found'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========== SERVER STARTUP ==========
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nEncerrando...');
  await mongoose.connection.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('\nEncerrando...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
