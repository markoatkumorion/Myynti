const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kpl'
  )
`);

const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;

if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, category, quantity, price, unit) VALUES (?, ?, ?, ?, ?)'
  );

  const seed = db.transaction(() => {
    const products = [
      // Elektroniikka
      ['Kannettava tietokone', 'Elektroniikka', 12, 899.99, 'kpl'],
      ['Älypuhelin Samsung Galaxy', 'Elektroniikka', 8, 649.00, 'kpl'],
      ['Langaton hiiri', 'Elektroniikka', 3, 39.95, 'kpl'],
      ['USB-C laturi 65W', 'Elektroniikka', 25, 29.90, 'kpl'],
      ['Bluetooth-kuulokkeet', 'Elektroniikka', 2, 129.00, 'kpl'],
      // Ruoka & Juomat
      ['Kahvi, tummapaahto 500g', 'Ruoka', 40, 8.95, 'pss'],
      ['Luomujauho 1kg', 'Ruoka', 18, 2.49, 'kg'],
      ['Oliiviöljy extra virgin 0.5l', 'Ruoka', 11, 7.80, 'l'],
      ['Tummaa suklaata 200g', 'Ruoka', 35, 3.20, 'kpl'],
      ['Mustat pavut 400g', 'Ruoka', 60, 1.45, 'tlk'],
      // Vaatetus
      ['Miesten t-paita L', 'Vaatetus', 4, 19.90, 'kpl'],
      ['Naisten collegepusero M', 'Vaatetus', 7, 44.90, 'kpl'],
      ['Farkut 32/32', 'Vaatetus', 1, 69.90, 'kpl'],
      ['Villasukat 39-42', 'Vaatetus', 22, 9.90, 'pari'],
      // Kodinhoito
      ['Astianpesuaine 1l', 'Kodinhoito', 30, 3.99, 'l'],
      ['Pyykinpesuaine 2kg', 'Kodinhoito', 14, 12.50, 'kg'],
      ['Wc-paperi 8 rll', 'Kodinhoito', 50, 6.90, 'pkt'],
      // Toimistotarvikkeet
      ['A4-paperi 500 arkkia', 'Toimisto', 16, 5.49, 'pkt'],
      ['Kuulakärkikynä sininen 10 kpl', 'Toimisto', 9, 4.20, 'pkt'],
      ['Muistilehtiö A5', 'Toimisto', 6, 3.50, 'kpl'],
    ];
    for (const p of products) insert.run(...p);
  });

  seed();
  console.log('Database seeded with 20 products.');
}

module.exports = db;
