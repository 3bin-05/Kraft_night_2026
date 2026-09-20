const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Parse .env.local
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

async function setupNewDatabase() {
  console.log('Connecting to target PostgreSQL Database:');
  console.log(process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'MISSING');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log('Connected to target Neon PostgreSQL instance!\n');

  try {
    // 1. Create Tables
    console.log('Creating database tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hospitals (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        phone VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        available_beds INTEGER NOT NULL DEFAULT 14,
        emergency_status VARCHAR(50) NOT NULL DEFAULT 'IDLE',
        handled_severities TEXT[] DEFAULT '{"LOW","MODERATE","HIGH","CRITICAL"}'
      );

      CREATE TABLE IF NOT EXISTS ambulances (
        id VARCHAR(100) PRIMARY KEY,
        vehicle_number VARCHAR(50) NOT NULL,
        driver_id VARCHAR(100) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        driver_phone VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        type VARCHAR(50) DEFAULT 'TYPE_C',
        equipment_level VARCHAR(100),
        call_sign VARCHAR(50),
        base_station VARCHAR(255),
        vehicle_model VARCHAR(100),
        equipment_list TEXT[],
        current_incident_id VARCHAR(100),
        current_hospital_id VARCHAR(100),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        heading DOUBLE PRECISION,
        speed DOUBLE PRECISION DEFAULT 55.0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(100) PRIMARY KEY,
        incident_number VARCHAR(50) NOT NULL,
        reporter_id VARCHAR(100),
        reporter_phone VARCHAR(50),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        accuracy DOUBLE PRECISION,
        address TEXT,
        severity VARCHAR(50) NOT NULL,
        victim_count INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
        assigned_ambulance_id VARCHAR(100),
        target_hospital_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accidents (
        id VARCHAR(100) PRIMARY KEY,
        incident_number VARCHAR(50),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        severity VARCHAR(50) NOT NULL,
        victim_count INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        status VARCHAR(50) DEFAULT 'REPORTED',
        reporter_phone VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ambulance_locations (
        id SERIAL PRIMARY KEY,
        ambulance_id VARCHAR(100) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        speed DOUBLE PRECISION,
        heading DOUBLE PRECISION,
        recorded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tables created successfully.\n');

    // 2. Seed Default Accounts
    console.log('Seeding demo accounts into PostgreSQL...');
    const seedAccounts = [
      {
        id: "usr_admin_001",
        name: "Emergency Command Admin",
        email: "admin@aimless.local",
        phone: "+15550000001",
        role: "ADMIN",
        rawPassword: "adminPassword123!",
      },
      {
        id: "usr_amb_001",
        name: "Unit A-01 Driver (John Miller)",
        email: "ambulance01@aimless.local",
        phone: "+15550000002",
        role: "AMBULANCE",
        rawPassword: "ambulancePassword123!",
      },
      {
        id: "usr_hosp_001",
        name: "City Central Emergency Dept",
        email: "hospital01@aimless.local",
        phone: "+15550000003",
        role: "HOSPITAL",
        rawPassword: "hospitalPassword123!",
      },
      {
        id: "usr_cit_001",
        name: "Jane Doe (Citizen)",
        email: "citizen@aimless.local",
        phone: "+15550000004",
        role: "CITIZEN",
        rawPassword: "citizenPassword123!",
      },
    ];

    for (const acc of seedAccounts) {
      const hash = await bcrypt.hash(acc.rawPassword, 10);
      await client.query(
        `INSERT INTO users (id, name, email, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash;`,
        [acc.id, acc.name, acc.email.toLowerCase(), acc.phone, acc.role, hash]
      );
    }
    console.log('Users seeded successfully.\n');

    // 3. Seed Regional Hospitals
    console.log('Seeding hospitals into PostgreSQL...');
    const defaultHospitals = [
      {
        id: "hosp_001",
        name: "City Central Emergency & Trauma Center",
        code: "CCET-01",
        address: "100 Medical Center Way, Downtown",
        latitude: 8.9182,
        longitude: 76.6354,
        phone: "+1-555-911-0100",
        status: "AVAILABLE",
        available_beds: 14,
        handled_severities: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
      },
      {
        id: "hosp_002",
        name: "Metro Memorial Trauma Hospital",
        code: "MMTH-02",
        address: "450 Health Parkway, North District",
        latitude: 8.9321,
        longitude: 76.6410,
        phone: "+1-555-911-0200",
        status: "AVAILABLE",
        available_beds: 8,
        handled_severities: ["MODERATE", "HIGH", "CRITICAL"],
      },
      {
        id: "hosp_003",
        name: "St. Jude Critical Care Pavilion",
        code: "SJCC-03",
        address: "780 Samaritan Ave, West Sector",
        latitude: 8.9054,
        longitude: 76.6190,
        phone: "+1-555-911-0300",
        status: "AVAILABLE",
        available_beds: 5,
        handled_severities: ["HIGH", "CRITICAL"],
      },
    ];

    for (const h of defaultHospitals) {
      await client.query(
        `INSERT INTO hospitals (id, name, code, address, latitude, longitude, phone, status, available_beds, handled_severities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           code = EXCLUDED.code,
           address = EXCLUDED.address,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           phone = EXCLUDED.phone,
           status = EXCLUDED.status,
           available_beds = EXCLUDED.available_beds,
           handled_severities = EXCLUDED.handled_severities;`,
        [h.id, h.name, h.code, h.address, h.latitude, h.longitude, h.phone, h.status, h.available_beds, h.handled_severities]
      );
    }
    console.log('Hospitals seeded successfully.\n');

    // 4. Seed Ambulances
    console.log('Seeding Level A, B, C, D ambulances into PostgreSQL...');
    const defaultAmbulances = [
      {
        id: "amb_unit_001",
        vehicle_number: "KL-07-CD-1001",
        driver_id: "usr_amb_001",
        driver_name: "John Miller",
        driver_phone: "+15550000002",
        status: "AVAILABLE",
        type: "TYPE_C",
        equipment_level: "Level C • Basic Life Support (BLS)",
        call_sign: "Medic-Alpha-01",
        base_station: "Kochi Central Emergency Bay",
        vehicle_model: "Mercedes-Benz Sprinter 316 CDI",
        equipment_list: ["AED with Live ECG", "BVM Resuscitators", "Spinal Immobilization", "Oxygen Delivery"],
        latitude: 8.9130,
        longitude: 76.6320,
        speed: 58.0,
      },
      {
        id: "amb_unit_002",
        vehicle_number: "KL-07-CD-2002",
        driver_id: "usr_amb_002",
        driver_name: "Sarah Jenkins",
        driver_phone: "+15550000005",
        status: "AVAILABLE",
        type: "TYPE_D",
        equipment_level: "Level D • Advanced Life Support / Mobile ICU (ALS)",
        call_sign: "ICU-Bravo-02",
        base_station: "Metro North Trauma Station",
        vehicle_model: "Ford Transit High-Roof ICU",
        equipment_list: ["Transport Mechanical Ventilator", "12-Lead ECG / Defibrillator", "Syringe Infusion Pumps", "Video Laryngoscope"],
        latitude: 8.9250,
        longitude: 76.6380,
        speed: 62.0,
      },
      {
        id: "amb_unit_003",
        vehicle_number: "KL-07-CD-3003",
        driver_id: "usr_amb_003",
        driver_name: "Rajesh Kumar",
        driver_phone: "+15550000006",
        status: "AVAILABLE",
        type: "TYPE_B",
        equipment_level: "Level B • Patient Transport Ambulance (PTA)",
        call_sign: "Transport-Charlie-03",
        base_station: "Samaritan West Hub",
        vehicle_model: "Force Traveller 3350",
        equipment_list: ["Wheeled Patient Stretcher", "Stair Chair", "10L Oxygen System", "Vitals Monitor"],
        latitude: 8.9080,
        longitude: 76.6210,
        speed: 50.0,
      },
      {
        id: "amb_unit_004",
        vehicle_number: "KL-07-CD-4004",
        driver_id: "usr_amb_004",
        driver_name: "Alex Varghese",
        driver_phone: "+15550000007",
        status: "AVAILABLE",
        type: "TYPE_A",
        equipment_level: "Level A • Medical First Responder (MFR)",
        call_sign: "Rapid-Delta-04",
        base_station: "Downtown Rapid Response Post",
        vehicle_model: "BMW R1250 RT Emergency Response Bike",
        equipment_list: ["AED Defibrillator", "Trauma Hemorrhage Dressing Kit", "Oxygen Resuscitation Kit"],
        latitude: 8.9190,
        longitude: 76.6340,
        speed: 70.0,
      },
    ];

    for (const amb of defaultAmbulances) {
      await client.query(
        `INSERT INTO ambulances (
           id, vehicle_number, driver_id, driver_name, driver_phone,
           status, type, equipment_level, call_sign, base_station, vehicle_model,
           equipment_list, latitude, longitude, speed, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
         ON CONFLICT (id) DO UPDATE SET
           vehicle_number = EXCLUDED.vehicle_number,
           type = EXCLUDED.type,
           equipment_level = EXCLUDED.equipment_level,
           call_sign = EXCLUDED.call_sign,
           base_station = EXCLUDED.base_station,
           vehicle_model = EXCLUDED.vehicle_model,
           equipment_list = EXCLUDED.equipment_list,
           status = EXCLUDED.status,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           speed = EXCLUDED.speed;`,
        [
          amb.id, amb.vehicle_number, amb.driver_id, amb.driver_name, amb.driver_phone,
          amb.status, amb.type, amb.equipment_level, amb.call_sign, amb.base_station, amb.vehicle_model,
          amb.equipment_list, amb.latitude, amb.longitude, amb.speed
        ]
      );
    }
    console.log('Ambulances seeded successfully.\n');

    // 5. Verification Query
    console.log('================ LIVE NEW POSTGRESQL DATABASE REPORT ================');

    const users = await client.query('SELECT id, name, email, role FROM users ORDER BY id;');
    console.log(`\nUsers in PostgreSQL (${users.rows.length}):`);
    console.table(users.rows);

    const hospitals = await client.query('SELECT id, name, code, available_beds, status FROM hospitals ORDER BY id;');
    console.log(`\nHospitals in PostgreSQL (${hospitals.rows.length}):`);
    console.table(hospitals.rows);

    const ambulances = await client.query('SELECT id, vehicle_number, type, call_sign, status FROM ambulances ORDER BY id;');
    console.log(`\nAmbulances in PostgreSQL (${ambulances.rows.length}):`);
    console.table(ambulances.rows);

    console.log('======================================================================\n');
  } catch (err) {
    console.error('Setup error on new database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupNewDatabase();
