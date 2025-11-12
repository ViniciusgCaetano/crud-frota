import { Router } from 'express';
import {
  registrarEvento,
  getEventos,
  getEventoById
} from '../controllers/eventosController.js';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';

const router = Router();

// listar eventos
router.get('/', autenticar, autorizar('admin', 'gestor_frota'), getEventos);

// obter evento
router.get('/:id', autenticar, autorizar('admin', 'gestor_frota'), getEventoById);

// registrar evento (gestor_frota, admin)
router.post('/', autenticar, autorizar('admin', 'gestor_frota'), registrarEvento);

export default router;
