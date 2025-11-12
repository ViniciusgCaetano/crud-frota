import Veiculo from '../models/Veiculo.js';
import Auditoria from '../models/Auditoria.js';

export const listDocumentos = async (req, res) => {
  try {
    const { id } = req.params;
    const veic = await Veiculo.findById(id).lean();
    if (!veic) return res.status(404).json({ erro: 'Veículo não encontrado' });
    res.json(veic.documentos || []);
  } catch (e) {
    console.error('Erro listando documentos:', e);
    res.status(500).json({ erro: 'Erro ao listar documentos' });
  }
};

export const addDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { indTipoDoc, dscUrlDoc, dscArqDoc, datValDoc } = req.body;

    const veic = await Veiculo.findById(id);
    if (!veic) return res.status(404).json({ erro: 'Veículo não encontrado' });

    const doc = {
      indTipoDoc,
      dscUrlDoc,
      dscArqDoc,
      datValDoc: datValDoc ? new Date(datValDoc) : undefined,
      datCriDoc: new Date()
    };

    veic.documentos = veic.documentos || [];
    veic.documentos.push(doc);
    await veic.save();

    await Auditoria.create({
      idUsuarAudit: req.user?._id, // se middleware popular
      idEntidAudit: veic._id,
      dscTipoEntidAudit: 'Documento',
      dscAcaoAudit: 'DOCUMENTO_ADICIONADO',
      dscDetalAudit: `Documento ${indTipoDoc || 'N/D'} adicionado`,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error('Erro adicionando documento:', e);
    res.status(500).json({ erro: 'Erro ao adicionar documento' });
  }
};

export const deleteDocumento = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const veic = await Veiculo.findById(id);
    if (!veic) return res.status(404).json({ erro: 'Veículo não encontrado' });

    const before = veic.documentos?.length || 0;
    veic.documentos = (veic.documentos || []).filter(d => String(d._id) !== String(docId));
    if (veic.documentos.length === before) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }
    await veic.save();

    await Auditoria.create({
      idUsuarAudit: req.user?._id,
      idEntidAudit: veic._id,
      dscTipoEntidAudit: 'Documento',
      dscAcaoAudit: 'VEICULO_ATUALIZADO',
      dscDetalAudit: `Documento ${docId} removido`,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Erro removendo documento:', e);
    res.status(500).json({ erro: 'Erro ao remover documento' });
  }
};
