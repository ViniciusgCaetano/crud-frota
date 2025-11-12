import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema({
  idSolicitUsuar: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  idSupervAprov: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // quem aprova
  idVeicReserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },

  datUsoReserva: { type: Date, required: true },
  datDevPrevReserva: { type: Date },
  dscDestinoReserva: { type: String, required: true },
  qtdKmEstReserva: { type: Number },
  valCombEstReserva: { type: Number },
  dscFinalidReserva: { type: String, required: true },

  indStatReserva: {
    type: String,
    enum: ['pendente', 'aprovada', 'rejeitada', 'em_uso', 'concluida', 'cancelada'],
    default: 'pendente'
  },

  dscObsReserva: { type: String },
  datCriReserva: { type: Date, default: Date.now },
  datAtualReserva: { type: Date, default: Date.now }
}, { collection: 'Reserva' });

reservaSchema.index({ idVeicReserva: 1, indStatReserva: 1 });
export default mongoose.model('Reserva', reservaSchema, 'Reserva');
