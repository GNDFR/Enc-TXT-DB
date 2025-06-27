import dbConnect from '../lib/db.js';
import Note from '../lib/note.js';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  await dbConnect();

  const { identifier, encryptedData } = req.body;
  if (!/^[a-zA-Z0-9]+$/.test(identifier)) return res.status(400).send('Invalid identifier');

  try {
    const exists = await Note.findOne({ identifier });
    if (exists) return res.status(409).send('Identifier exists');

    await Note.create({ identifier, encryptedData });
    res.json({ identifier });
  } catch (err) {
    res.status(500).send('Server error');
  }
};