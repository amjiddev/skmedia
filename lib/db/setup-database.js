#!/usr/bin/env node
/**
 * Setup script to create the sk_media database
 * Run this before `npm run push`
 */

import pg from 'pg';

const { Client } = pg;

async function setupDatabase() {
  const client = new Client({
    user: 'postgres',
    password: '1',
    host: 'localhost',
    port: 5432,
    // Connect to default postgres database
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected\n');

    console.log('🗄️  Creating database "sk_media"...');
    try {
      await client.query('CREATE DATABASE sk_media;');
      console.log('✓ Database created\n');
    } catch (err) {
      if (err.code === '42P04') {
        // Database already exists
        console.log('ℹ️  Database "sk_media" already exists\n');
      } else {
        throw err;
      }
    }

    console.log('📊 Verifying database...');
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datname = 'sk_media';"
    );

    if (result.rows.length > 0) {
      console.log('✓ Database verified\n');
      console.log('✅ Setup complete! You can now run: npm run push\n');
    } else {
      console.error('✗ Database verification failed\n');
      process.exit(1);
    }

    await client.end();
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  - Is PostgreSQL running on localhost:5432?');
    console.error('  - Is the postgres user password correct (currently "1")?');
    console.error('  - Check your .env file DATABASE_URL setting');
    process.exit(1);
  }
}

setupDatabase();
