import mongoose from 'mongoose';
let conn = null;

export default async function dbConnect() {
  if (conn) return;
  conn = await mongoose.connect(process.env.MONGODB_URI);
}