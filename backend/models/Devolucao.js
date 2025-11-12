import mongoose from 'mongoose';

const devolucaoSchema = new mongoose.Schema({
  // vínculo obrigatório
  idReservaDevol: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  idUsuarDevol: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // dados da devolução
  datDevol: { type: Date, required: true },
  dscLocalDevol: { type: String },

  // estado do veículo na volta
  qtdKmPercDevol: { type: Number },
  valCombFinalDevol: { type: Number },

  // checklist de condição
  dscLatariaDevol: { type: String },   // ex.: "ok", "amassado porta direita"
  dscPneusDevol: { type: String },     // ex.: "ok", "pneu dianteiro baixo"
  dscMotorDevol: { type: String },     // ex.: "ok", "barulho ao ligar"

  // observações gerais (o que já existia)
  dscObsDevol: { type: String },

  // NOVO: feedback / recomendação / pedido de manutenção
  // texto livre para o colaborador dizer o que precisa ser feito
  dscFeedbkDevol: { type: String },

  // endereço (prof pediu endereço quando houver no caso)
  dscTipoLogrDevol: { type: String },
  dscNomeLogrDevol: { type: String },
  numLogrDevol: { type: String },
  dscBairroDevol: { type: String },
  dscCidadeDevol: { type: String },
  dscEstadoDevol: { type: String },
  numCepDevol: { type: String },

  datCriDevol: { type: Date, default: Date.now }
}, { collection: 'Devolucao' });

export default mongoose.model('Devolucao', devolucaoSchema, 'Devolucao');
