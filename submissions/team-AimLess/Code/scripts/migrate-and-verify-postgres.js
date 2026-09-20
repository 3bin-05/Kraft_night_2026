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

async function runMigration() {
  console.log('Connecting to Neon PostgreSQL...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log('Connected! Executing schema migrations...\n');

  try {
    // 1. Ensure columns on hospitals table
    await client.query(`
      ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS handled_severities TEXT[] DEFAULT '{"LOW","MODERATE","HIGH","CRITICAL"}';
      ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS emergency_status VARCHAR(50) DEFAULT 'IDLE';
    `);

    // 2. Ensure columns on ambulances table
    await client.query(`
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'TYPE_C';
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS equipment_level VARCHAR(50);
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS call_sign VARCHAR(50);
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS base_station VARCHAR(255);
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100);
      ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS equipment_list TEXT[];
    `);

    console.log('Schema migration completed successfully!\n');

    // 3. Populate default ambulances if missing
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
    console.log('Ambulances seeded in PostgreSQL.\n');

    // 4. Check all live data in PostgreSQL
    console.log('================ LIVE POSTGRESQL DATABASE VERIFICATION ================');

    const users = await client.query('SELECT id, name, email, role FROM users ORDER BY id;');
    console.log(`\n1. Users in PostgreSQL (${users.rows.length}):`);
    console.table(users.rows);

    const hospitals = await client.query('SELECT id, name, code, available_beds, status, handled_severities FROM hospitals ORDER BY id;');
    console.log(`\n2. Hospitals in PostgreSQL (${hospitals.rows.length}):`);
    console.table(hospitals.rows);

    const ambulances = await client.query('SELECT id, vehicle_number, type, call_sign, status, speed FROM ambulances ORDER BY id;');
    console.log(`\n3. Ambulances in PostgreSQL (${ambulances.rows.length}):`);
    console.table(ambulances.rows);

    const incidents = await client.query('SELECT id, incident_number, severity, status, victim_count, assigned_ambulance_id, target_hospital_id FROM incidents ORDER BY created_at DESC LIMIT 10;');
    console.log(`\n4. Incidents in PostgreSQL (${incidents.rows.length}):`);
    console.table(incidents.rows);

    console.log('========================================================================\n');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
