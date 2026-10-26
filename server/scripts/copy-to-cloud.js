// Copies everything in this computer's ShopEase database (users, orders, products, coupons ...)
// to a cloud MongoDB (Atlas), so the online store starts with the same data.
//   node scripts/copy-to-cloud.js "<atlas connection string>" [--replace]
// ShopEase must be running on this computer (it owns the local database).
/* eslint-disable no-console -- command-line tool */
import { MongoClient } from 'mongodb';

const LOCAL = `mongodb://127.0.0.1:${process.env.MEMORY_DB_PORT || 27018}/shopease`;
const target = process.argv[2];
const replace = process.argv.includes('--replace');

const fail = (msg) => {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
};

if (!/^mongodb(\+srv)?:\/\//.test(target || '')) fail('Give the MongoDB Atlas connection string (starts with mongodb+srv://).');

// The database name is taken from the string; default "shopease"
const targetUrl = new URL(target.replace(/^mongodb(\+srv)?:/, 'http:'));
const targetDb = targetUrl.pathname.replace(/^\//, '') || 'shopease';

const src = new MongoClient(LOCAL, { serverSelectionTimeoutMS: 5000 });
const dst = new MongoClient(target, { serverSelectionTimeoutMS: 20000 });
try {
  await src.connect();
} catch {
  fail('Could not reach the database on this computer. Start ShopEase first (start.bat).');
}
try {
  await dst.connect();
} catch (err) {
  fail(`Could not connect to the cloud database: ${err.message}\nCheck the password in the string and that Atlas Network Access allows 0.0.0.0/0.`);
}

const from = src.db('shopease');
const to = dst.db(targetDb);
const collections = (await from.listCollections().toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.'));

const existing = await to.collection('users').countDocuments();
if (existing && !replace) {
  console.log(`\nThe cloud database already has ${existing} user(s).`);
  console.log('Nothing was changed. Run again with --replace to overwrite it with the data from this computer.');
  await Promise.all([src.close(), dst.close()]);
  process.exit(2);
}

let total = 0;
for (const name of collections) {
  const docs = await from.collection(name).find().toArray();
  await to.collection(name).deleteMany({});
  if (docs.length) await to.collection(name).insertMany(docs, { ordered: false });
  total += docs.length;
  console.log(`  ${name.padEnd(14)} ${docs.length}`);
}
const local = await from.collection('products').countDocuments({ 'images.url': /\/api\/uploads\// });
console.log(`\nDone: ${total} records copied to "${targetDb}".`);
if (local) {
  console.log(`Note: ${local} product(s) use images uploaded on this computer - upload them again in the online admin panel`);
  console.log('      (or set up Cloudinary). The bundled sample photos work everywhere.');
}
await Promise.all([src.close(), dst.close()]);
