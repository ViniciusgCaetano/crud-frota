import { Router } from 'express';
import {
  createReserva,
  getReservas,
  aprovarReserva,
  rejeitarReserva,
  cancelarReserva,
  deleteReserva
} from '../controllers/reservasController.js';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';

const router = Router();

// listar reservas
router.get('/', autenticar, getReservas);

// criar
router.post('/', autenticar, createReserva);

// aprovar
router.post('/:id/aprovar', autenticar, autorizar('supervisor', 'gestor_frota', 'admin'), aprovarReserva);

// rejeitar
router.post('/:id/rejeitar', autenticar, autorizar('supervisor', 'gestor_frota', 'admin'), rejeitarReserva);

// cancelar e DELETAR (vai apagar do banco)
router.post('/:id/cancelar', autenticar, cancelarReserva);

// delete direto (pra usar no front com DELETE)
router.delete('/:id', autenticar, autorizar('admin', 'gestor_frota', 'supervisor'), deleteReserva);

export default router;
