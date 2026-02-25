const request = require('supertest');
const app = require('./server');

describe('GET /api/products', () => {
  it('returns an array of products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('filters products by search query', async () => {
    const res = await request(app).get('/api/products?q=Kahvi');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(p => {
      expect(p.name.toLowerCase() + p.category.toLowerCase()).toContain('kahvi');
    });
  });
});

describe('POST /api/products', () => {
  let createdId;

  it('creates a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Testituote', category: 'Testi', quantity: 5, price: 9.99, unit: 'kpl' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Testituote', category: 'Testi', quantity: 5 });
    createdId = res.body.id;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Puutteellinen' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  afterAll(async () => {
    if (createdId) {
      await request(app).delete(`/api/products/${createdId}`);
    }
  });
});

describe('PUT /api/products/:id', () => {
  let productId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'PäivitysTesti', category: 'Testi', quantity: 1, price: 1.00, unit: 'kpl' });
    productId = res.body.id;
  });

  it('updates an existing product', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .send({ quantity: 42 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(42);
  });

  it('returns 404 for a non-existent product', async () => {
    const res = await request(app)
      .put('/api/products/999999')
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    await request(app).delete(`/api/products/${productId}`);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes an existing product', async () => {
    const created = await request(app)
      .post('/api/products')
      .send({ name: 'PoistaTesti', category: 'Testi', quantity: 1, price: 1.00, unit: 'kpl' });
    const id = created.body.id;

    const res = await request(app).delete(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when product does not exist', async () => {
    const res = await request(app).delete('/api/products/999999');
    expect(res.status).toBe(404);
  });
});
