require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
/**
 * Script to create initial admin user
 * Run: node backend/scripts/create-admin.js
 */


const bcrypt = require('bcrypt');
const readline = require('readline');
const { Admin, sequelize } = require('../models');

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function createAdmin() {
  try {
    await sequelize.sync();

    const email = (await prompt('Enter admin email: ')).trim();
    const password = (await prompt('Enter admin password: ')).trim();
    if (!email || !password) {
      console.log('❌ Email and password are required.');
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      console.log(`❌ Admin already exists with email: ${email}`);
      console.log('   Use a different email or delete the existing admin first.');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'super_admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', admin.role);
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
