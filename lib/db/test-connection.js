import pg from 'pg';

const { Client } = pg;

const client = new Client({
  user: 'postgres',
  password: '1',
  host: 'localhost',
  port: 5432,
  database: 'sk_media',
  connectionTimeoutMillis: 5000,
  commandTimeoutMillis: 10000,
});

console.log('Attempting to connect to PostgreSQL...');
console.log('Connection details:');
console.log('  Host: localhost:5432');
console.log('  Database: sk_media');
console.log('  User: postgres');

client
  .connect()
  .then(() => {
    console.log('✓ Connection successful!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✓ Query successful! Current time:', result.rows[0]);
    return client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations__'
      )`
    );
  })
  .then((result) => {
    console.log(
      '✓ Drizzle migrations table exists:',
      result.rows[0].exists
    );
    return client.end();
  })
  .catch((err) => {
    console.error('✗ Connection failed:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  });
