import { Router } from 'express';
import {
  createUsuario,
  getAllUsuarios,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuariosController.js';
import { autenticar, autorizar } from '../middleware/authMiddleware.js';

const router = Router();

// lista usuários (admin, gestor_frota, supervisor podem ver)
router.get('/', autenticar, getAllUsuarios);

// cria usuário (só admin)
router.post('/', autenticar, autorizar('admin'), createUsuario);

// atualiza usuário (admin)
router.put('/:id', autenticar, autorizar('admin'), updateUsuario);

// remove usuário (admin)
router.delete('/:id', autenticar, autorizar('admin'), deleteUsuario);

export default router;
