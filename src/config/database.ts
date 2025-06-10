import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { categories } from '../data/categories';
import { destinations } from '../data/destinations';
import { admin } from '../data/admin';
const db = new Database('data.db');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

//Create routes table
db.exec(`
  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    destinations TEXT NOT NULL,
    duration TEXT NOT NULL,
    price REAL NOT NULL,
    places TEXT NOT NULL,
    routes TEXT NOT NULL,
    backtrack INTEGER DEFAULT 0,
    coordinates TEXT NOT NULL,
    start TEXT NOT NULL,
    startdate TEXT NOT NULL,
    ispublic INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    comment TEXT NOT NULL
  );
`);

// Destinations table
db.exec(`
  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    rating REAL NOT NULL,
    price TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL
  );
`);

// Destination categories (many-to-many relationship)
db.exec(`
  CREATE TABLE IF NOT EXISTS destination_categories (
    destination_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (destination_id, category_id),
    FOREIGN KEY (destination_id) REFERENCES destinations(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Create admin user if not exists
const adminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminUser) {
  const hashedPassword = bcrypt.hashSync(admin.password, 10);
  db.prepare(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
  ).run(admin.email, hashedPassword, admin.name, admin.role);
}


// Insert categories if they don't exist
const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (existingCategories.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (id, name, comment) VALUES (?, ?, ?)');
  categories.forEach(category => {
    insertCategory.run(category.id, category.name, category.comment);
  });
}

// Insert destinations if they don't exist
const existingDestinations = db.prepare('SELECT COUNT(*) as count FROM destinations').get() as { count: number };
if (existingDestinations.count === 0) {
  const insertDestination = db.prepare(`
    INSERT INTO destinations (
      name, location, image, description, rating, 
      price, time, duration, lat, lng
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDestinationCategory = db.prepare(`
    INSERT INTO destination_categories (destination_id, category_id)
    VALUES (?, ?)
  `);

  destinations.forEach(dest => {
    const result = insertDestination.run(
      dest.name,
      dest.location,
      dest.image,
      dest.description,
      dest.rating,
      dest.price,
      dest.time,
      dest.duration,
      dest.lat,
      dest.lng
    );

    // Insert destination categories
    dest.category.forEach(categoryId => {
      insertDestinationCategory.run(result.lastInsertRowid, categoryId);
    });
  });
}


export default db;