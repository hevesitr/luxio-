/**
 * Database Seed Script
 * Populates database with test data
 */
require('dotenv').config();
const { pool } = require('./pool');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create test users
    const testUsers = [
      {
        email: 'test1@example.com',
        name: 'Test User 1',
        birthDate: '1995-01-15',
        gender: 'male',
        lookingFor: ['female'],
        password: 'Test123!@#',
      },
      {
        email: 'test2@example.com',
        name: 'Test User 2',
        birthDate: '1998-05-20',
        gender: 'female',
        lookingFor: ['male'],
        password: 'Test123!@#',
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠ User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Insert user
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, birth_date, gender, looking_for, email_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
         RETURNING id`,
        [
          userData.email,
          passwordHash,
          userData.name,
          userData.birthDate,
          userData.gender,
          userData.lookingFor,
        ]
      );

      const userId = userResult.rows[0].id;

      // Create user settings
      await pool.query(
        `INSERT INTO user_settings (user_id) VALUES ($1)`,
        [userId]
      );

      // Create profile
      await pool.query(
        `INSERT INTO profiles (user_id, bio, interests, relationship_goal, location_latitude, location_longitude, location_city, location_country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          `Szia! Érdekelnek az ${userData.gender === 'male' ? 'utazás' : 'olvasás'} és a ${userData.gender === 'male' ? 'sport' : 'fotózás'}.`,
          userData.gender === 'male' ? ['Utazás', 'Sport'] : ['Olvasás', 'Fotózás'],
          'serious',
          47.4979, // Budapest
          19.0402,
          'Budapest',
          'Hungary',
        ]
      );

      console.log(`✓ Created user: ${userData.email}`);
    }

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();

