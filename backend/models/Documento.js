import mongoose from 'mongoose';

const documentoSchema = new mongoose.Schema({
  idVeicDoc: { type: mongoose.Schema.Types.ObjectId, ref: 'Veiculo', required: true },
  dscTipoDoc: { type: String, enum: ['crlv', 'ipva', 'seguro', 'outros'], required: true },
  dscPathDoc: { type: String, required: true },
  datVencDoc: { type: Date },
  datCriDoc: { type: Date, default: Date.now }
}, { collection: 'Documento' });

documentoSchema.index({ idVeicDoc: 1, dscTipoDoc: 1 });
export default mongoose.model('Documento', documentoSchema, 'Documento');
