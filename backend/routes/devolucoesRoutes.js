import { Router } from 'express';
import { registrarDevolucao, getDevolucoes } from '../controllers/devolucoesController.js';
import { autenticar } from '../middleware/authMiddleware.js';

const router = Router();

// listar devoluções
router.get('/', autenticar, getDevolucoes);

// registrar devolução
router.post('/', autenticar, registrarDevolucao);

export default router;
