import { v4 as uuidv4 } from 'uuid';
import db, { initDatabase, clearDatabase } from '../src/app/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test Data Seeder
 * Seeds the database with sample data for testing
 */

interface SeedOptions {
  users?: number;
  products?: number;
  orders?: number;
}

const defaultOptions: SeedOptions = {
  users: 5,
  products: 20,
  orders: 10,
};

// Sample product data
const productTemplates = [
  { name: 'MacBook Pro 16"', description: 'Powerful laptop for professionals', price: 2499.99, category: 'electronics' },
  { name: 'iPhone 15 Pro', description: 'Latest smartphone with amazing camera', price: 1199.99, category: 'electronics' },
  { name: 'AirPods Pro', description: 'Premium wireless earbuds', price: 249.99, category: 'electronics' },
  { name: 'iPad Air', description: 'Versatile tablet for work and play', price: 799.99, category: 'electronics' },
  { name: 'Apple Watch Series 9', description: 'Advanced health and fitness tracker', price: 429.99, category: 'electronics' },
  { name: 'Classic Polo Shirt', description: 'Comfortable cotton polo shirt', price: 49.99, category: 'clothing' },
  { name: 'Slim Fit Jeans', description: 'Modern slim fit denim jeans', price: 79.99, category: 'clothing' },
  { name: 'Running Sneakers', description: 'Lightweight athletic shoes', price: 129.99, category: 'clothing' },
  { name: 'Winter Jacket', description: 'Warm and stylish winter coat', price: 199.99, category: 'clothing' },
  { name: 'Cotton T-Shirt Pack', description: 'Set of 3 basic t-shirts', price: 39.99, category: 'clothing' },
  { name: 'The Great Gatsby', description: 'Classic novel by F. Scott Fitzgerald', price: 14.99, category: 'books' },
  { name: 'Clean Code', description: 'A handbook of agile software craftsmanship', price: 44.99, category: 'books' },
  { name: 'Atomic Habits', description: 'Build good habits, break bad ones', price: 24.99, category: 'books' },
  { name: 'The Psychology of Money', description: 'Timeless lessons on wealth', price: 19.99, category: 'books' },
  { name: 'Design Patterns', description: 'Elements of reusable object-oriented software', price: 54.99, category: 'books' },
  { name: 'Smart LED Bulbs', description: 'Color-changing smart bulbs (4-pack)', price: 59.99, category: 'home' },
  { name: 'Ergonomic Office Chair', description: 'Comfortable chair for long work sessions', price: 349.99, category: 'home' },
  { name: 'Indoor Plant Set', description: 'Collection of easy-care houseplants', price: 79.99, category: 'home' },
  { name: 'Coffee Maker', description: 'Programmable drip coffee machine', price: 89.99, category: 'home' },
  { name: 'Robot Vacuum', description: 'Smart cleaning robot with mapping', price: 449.99, category: 'home' },
];

// Sample user data
const userTemplates = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Smith', email: 'jane@example.com' },
  { name: 'Bob Wilson', email: 'bob@example.com' },
  { name: 'Alice Brown', email: 'alice@example.com' },
  { name: 'Charlie Davis', email: 'charlie@example.com' },
  { name: 'Test User', email: 'test@example.com' },
  { name: 'Demo User', email: 'demo@example.com' },
];

async function seedDatabase(options: SeedOptions = defaultOptions): Promise<void> {
  console.log('🌱 Starting database seeding...\n');

  const { users = 5, products = 20, orders = 10 } = options;
  const createdUsers: string[] = [];
  const createdProducts: string[] = [];

  // Initialize database
  initDatabase();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  clearDatabase();

  // Seed users
  console.log(`👤 Creating ${users} users...`);
  const userStmt = db.prepare(
    'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)'
  );

  for (let i = 0; i < users; i++) {
    const template = userTemplates[i % userTemplates.length];
    const id = uuidv4();
    const email = i < userTemplates.length ? template.email : `user${i}@example.com`;
    const name = i < userTemplates.length ? template.name : `User ${i}`;
    const role = i === 0 ? 'admin' : 'user';

    try {
      userStmt.run(id, email, name, 'password123', role);
      createdUsers.push(id);
      console.log(`   ✓ Created user: ${name} (${email})`);
    } catch (error) {
      console.log(`   ⚠ Skipped duplicate: ${email}`);
    }
  }

  // Seed products
  console.log(`\n📦 Creating ${products} products...`);
  const productStmt = db.prepare(
    'INSERT INTO products (id, name, description, price, stock, category) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (let i = 0; i < products; i++) {
    const template = productTemplates[i % productTemplates.length];
    const id = uuidv4();
    const stock = Math.floor(Math.random() * 50) + 10;
    const priceVariation = 1 + (Math.random() * 0.2 - 0.1); // ±10% price variation
    const price = Math.round(template.price * priceVariation * 100) / 100;
    const name = i < productTemplates.length ? template.name : `${template.name} v${Math.floor(i / productTemplates.length) + 1}`;

    productStmt.run(id, name, template.description, price, stock, template.category);
    createdProducts.push(id);
    console.log(`   ✓ Created product: ${name} ($${price})`);
  }

  // Seed orders
  console.log(`\n📋 Creating ${orders} orders...`);
  
  for (let i = 0; i < orders && createdUsers.length > 0 && createdProducts.length > 0; i++) {
    const userId = createdUsers[i % createdUsers.length];
    const orderId = uuidv4();
    
    // Random number of items (1-4)
    const numItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = new Set<string>();
    let total = 0;

    const orderItemStmt = db.prepare(
      'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)'
    );

    // Select random products
    while (selectedProducts.size < numItems && selectedProducts.size < createdProducts.length) {
      const productId = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      selectedProducts.add(productId);
    }

    // Calculate total and create order items
    const items: { productId: string; quantity: number; price: number }[] = [];
    for (const productId of selectedProducts) {
      const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemTotal = product.price * quantity;
      total += itemTotal;
      items.push({ productId, quantity, price: product.price });
    }

    // Create order
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const addresses = [
      '123 Main St, New York, NY 10001',
      '456 Oak Ave, Los Angeles, CA 90001',
      '789 Pine Rd, Chicago, IL 60601',
      '321 Elm Blvd, Houston, TX 77001',
    ];
    const address = addresses[Math.floor(Math.random() * addresses.length)];

    db.prepare(
      'INSERT INTO orders (id, user_id, total, status, shipping_address) VALUES (?, ?, ?, ?, ?)'
    ).run(orderId, userId, Math.round(total * 100) / 100, status, address);

    // Create order items
    for (const item of items) {
      orderItemStmt.run(uuidv4(), orderId, item.productId, item.quantity, item.price);
    }

    console.log(`   ✓ Created order: ${orderId.slice(0, 8)}... (${items.length} items, $${total.toFixed(2)}, ${status})`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Database seeding complete!');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Products: ${createdProducts.length}`);
  console.log(`   Orders: ${orders}`);
  console.log('='.repeat(50));
}

// Run seeding if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
