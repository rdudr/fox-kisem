// Sample data seeder for testing
// Run with: node scripts/seed-sample-data.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy-audit';

const sampleUser = {
  username: 'demo',
  password: 'demo123',
  createdAt: new Date(),
};

const sampleCompanyInfo = {
  companyName: 'Mahadev Silk Mills',
  companyAddress: '123 Industrial Area, Textile City, State - 400001',
  auditorName: 'John Doe',
};

const sampleMachineData = [
  {
    userId: 'demo',
    username: 'demo',
    companyInfo: sampleCompanyInfo,
    plant: 'Plant A - Dyeing',
    machineType: 'Jet Machine',
    machineName: 'Jet Machine 1',
    frequency: 50,
    ratedKW: 7.5,
    ratedHP: 10,
    voltage: 415,
    current: 10.5,
    kva: 7.55,
    powerFactor: 0.98,
    kvar: 1.5,
    kw: 7.4,
    calculatedPower: 7.4,
    loadFactor: 0.987,
    timestamp: new Date(),
    notes: 'Sample data - Jet Machine 1',
  },
  {
    userId: 'demo',
    username: 'demo',
    companyInfo: sampleCompanyInfo,
    plant: 'Plant A - Dyeing',
    machineType: 'Jet Machine',
    machineName: 'Jet Machine 2',
    frequency: 43,
    ratedKW: 7.5,
    ratedHP: 10,
    voltage: 412.1,
    current: 9.37,
    kva: 6.63,
    powerFactor: 0.997,
    kvar: 0.46,
    kw: 6.62,
    calculatedPower: 6.67,
    loadFactor: 0.883,
    timestamp: new Date(Date.now() - 3600000),
    notes: 'Sample data - Jet Machine 2',
  },
  {
    userId: 'demo',
    username: 'demo',
    companyInfo: sampleCompanyInfo,
    plant: 'Plant B - Finishing',
    machineType: 'Stenter Machine',
    machineName: 'Stenter Machine 1',
    frequency: 50,
    ratedKW: 15,
    ratedHP: 20,
    voltage: 420,
    current: 22.5,
    kva: 16.35,
    powerFactor: 0.95,
    kvar: 5.1,
    kw: 15.53,
    calculatedPower: 15.53,
    loadFactor: 1.035,
    timestamp: new Date(Date.now() - 7200000),
    notes: 'Sample data - Stenter Machine',
  },
];

async function seedData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('energy-audit');

    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('machine-data').deleteMany({});
    console.log('Cleared existing data');

    // Insert sample user
    await db.collection('users').insertOne(sampleUser);
    console.log('✓ Created demo user (username: demo, password: demo123)');

    // Insert sample machine data
    await db.collection('machine-data').insertMany(sampleMachineData);
    console.log(`✓ Created ${sampleMachineData.length} sample machine records`);

    console.log('\n🎉 Sample data seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: demo');
    console.log('  Password: demo123');
    console.log('\nCompany Info:');
    console.log(`  Company: ${sampleCompanyInfo.companyName}`);
    console.log(`  Auditor: ${sampleCompanyInfo.auditorName}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seedData();
