import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  identifier: { type: String, unique: true },
  encryptedData: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);