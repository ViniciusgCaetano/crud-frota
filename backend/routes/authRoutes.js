import express from 'express';
import { login, validarToken, seedAdmin } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/seed-admin', seedAdmin);

// rota para o front recuperar o usuário completo depois
router.get('/validar', authMiddleware, validarToken);

export default router;
