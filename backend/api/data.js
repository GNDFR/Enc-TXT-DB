import dbConnect from '../lib/db.js';
import Note from '../lib/note.js';

export default async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  await dbConnect();

  const { identifier } = req.query;
  try {
    const note = await Note.findOne({ identifier });
    if (!note) return res.status(404).send('Not found');
    res.json({ encryptedData: note.encryptedData });
  } catch {
    res.status(500).send('Server error');
  }
};