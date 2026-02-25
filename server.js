const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all products (optional search query)
app.get('/api/products', (req, res) => {
  const { q } = req.query;
  let rows;
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    rows = db.prepare(
      'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? ORDER BY category, name'
    ).all(like, like);
  } else {
    rows = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  }
  res.json(rows);
});

// POST new product
app.post('/api/products', (req, res) => {
  const { name, category, quantity, price, unit } = req.body;
  if (!name || !category || quantity == null || price == null || !unit) {
    return res.status(400).json({ error: 'Kaikki kentät ovat pakollisia.' });
  }
  const info = db.prepare(
    'INSERT INTO products (name, category, quantity, price, unit) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), category.trim(), Number(quantity), Number(price), unit.trim());
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(product);
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, price, unit } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Tuotetta ei löydy.' });

  db.prepare(
    'UPDATE products SET name=?, category=?, quantity=?, price=?, unit=? WHERE id=?'
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    quantity != null ? Number(quantity) : existing.quantity,
    price != null ? Number(price) : existing.price,
    unit ?? existing.unit,
    id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Tuotetta ei löydy.' });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Myynti server running at http://localhost:${PORT}`);
});
