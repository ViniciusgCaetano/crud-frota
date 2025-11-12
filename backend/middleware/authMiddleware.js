// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

// usa EXATAMENTE o mesmo segredo do controller
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

/**
 * Autentica o usuário via Bearer token.
 * Coloca em req.user:
 *  - userId
 *  - indPerfUsuar (normalizado, mesmo que o token venha com "perfil")
 *  - dscEmailUsuar
 *  - nomUsuar (se vier)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ erro: 'Token malformado' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ erro: 'Token malformado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // o controller está assinando com { userId, perfil, email }
    req.user = {
      userId: decoded.userId,
      indPerfUsuar: decoded.indPerfUsuar || decoded.perfil || null,
      dscEmailUsuar: decoded.dscEmailUsuar || decoded.email || null,
      nomUsuar: decoded.nomUsuar || null,
    };

    return next();
  } catch (error) {
    console.error('Erro ao validar token:', error.message);
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

/**
 * Autoriza por perfil.
 */
function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    if (perfisPermitidos.length === 0) {
      return next();
    }

    const perfil = req.user.indPerfUsuar;
    if (!perfil || !perfisPermitidos.includes(perfil)) {
      return res.status(403).json({ erro: 'Usuário sem permissão para esta ação' });
    }

    return next();
  };
}

export default authMiddleware;
export const autenticar = authMiddleware;
export { autorizar };
