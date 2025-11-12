// routes/beneficiosRoutes.js
import { Router } from 'express';
import {
  criarAlocacao,
  getAlocacoes,
  atualizarAlocacao,
  encerrarAlocacao
} from '../controllers/beneficiosController.js';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';

const router = Router();

// listar (pode filtrar por ?vigente=true)
router.get(
  '/',
  autenticar,
  autorizar('admin', 'gestor_frota'),
  getAlocacoes
);

// criar alocação
router.post(
  '/',
  autenticar,
  autorizar('admin', 'gestor_frota'),
  criarAlocacao
);

// atualizar dados da alocação (motorista, fds, local, prioridade)
router.put(
  '/:id',
  autenticar,
  autorizar('admin', 'gestor_frota'),
  atualizarAlocacao
);

// encerrar
router.post(
  '/:id/encerrar',
  autenticar,
  autorizar('admin', 'gestor_frota'),
  encerrarAlocacao
);

export default router;
