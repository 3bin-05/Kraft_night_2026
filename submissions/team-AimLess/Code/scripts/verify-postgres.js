const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

async function verifyPostgres() {
  console.log('Testing PostgreSQL connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'MISSING');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('Connected to Neon PostgreSQL instance successfully!\n');

    // 1. Check Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables in PostgreSQL:', tablesRes.rows.map(r => r.table_name));

    // 2. Query Users
    const usersRes = await client.query('SELECT id, name, email, role FROM users;');
    console.log(`\nUsers in PostgreSQL (${usersRes.rows.length}):`);
    console.table(usersRes.rows);

    // 3. Query Hospitals
    const hospitalsRes = await client.query('SELECT id, name, code, available_beds, status FROM hospitals;');
    console.log(`\nHospitals in PostgreSQL (${hospitalsRes.rows.length}):`);
    console.table(hospitalsRes.rows);

    // 4. Query Ambulances
    const ambulancesRes = await client.query('SELECT id, vehicle_number, type, status, driver_name FROM ambulances;');
    console.log(`\nAmbulances in PostgreSQL (${ambulancesRes.rows.length}):`);
    console.table(ambulancesRes.rows);

    // 5. Query Incidents
    const incidentsRes = await client.query('SELECT id, incident_number, severity, status, victim_count, assigned_ambulance_id, target_hospital_id, created_at FROM incidents ORDER BY created_at DESC LIMIT 10;');
    console.log(`\nIncidents in PostgreSQL (${incidentsRes.rows.length}):`);
    console.table(incidentsRes.rows);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('PostgreSQL query error:', err);
    process.exit(1);
  }
}

verifyPostgres();
