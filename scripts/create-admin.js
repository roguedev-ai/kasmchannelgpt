#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('🔧 Create Admin User\n');
  
  const email = await question('Admin email: ');
  const password = await question('Admin password: ');
  const name = await question('Admin name (optional): ') || 'Admin';
  
  const hash = bcrypt.hashSync(password, 10);
  const partnerId = 'admin-' + Date.now();
  
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/app.db';
  const db = new Database(dbPath);
  
  try {
    db.prepare(`
      INSERT INTO partners (id, email, password, name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'admin', 'active', strftime('%s', 'now'), strftime('%s', 'now'))
    `).run(partnerId, email, hash, name);
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`\nLogin credentials:`);
    console.log(`  Partner ID: ${partnerId}`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: (the password you entered)`);
    console.log(`\nYou can now login at your application URL.`);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    db.close();
    rl.close();
  }
}

createAdmin();
