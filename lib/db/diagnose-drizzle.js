import pg from 'pg';

const { Client } = pg;

async function diagnose() {
  const client = new Client({
    user: 'postgres',
    password: '1',
    host: 'localhost',
    port: 5432,
    // Connect without specifying database first
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('=== Drizzle Kit Timeout Diagnosis ===\n');

    console.log('Step 1: Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');

    console.log('Step 2: Checking existing databases...');
    const dbResult = await client.query(
      "SELECT datname FROM pg_database WHERE datname = 'sk_media';"
    );
    console.log('Existing databases:', dbResult.rows);

    if (dbResult.rows.length === 0) {
      console.log('✗ Database "sk_media" DOES NOT EXIST\n');
      console.log('ROOT CAUSE: The database must be created before running drizzle-kit push\n');
      console.log('SOLUTION: Create the database with:\n');
      console.log('  psql -U postgres -c "CREATE DATABASE sk_media;"');
      console.log('  or in psql:');
      console.log('  CREATE DATABASE sk_media;\n');
    } else {
      console.log('✓ Database "sk_media" exists\n');
    }

    console.log('Step 3: Checking all databases:');
    const allDbs = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    );
    console.log('Available databases:', allDbs.rows.map((r) => r.datname).join(', '));

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    console.error('Error code:', err.code);
  }
}

diagnose();
