/**
 * CHECK REGISTERED DONORS COUNT
 * Verifies the actual donor count from database
 */

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');

async function checkDonorStats() {
  try {
    console.log('\n📊 REGISTERED DONORS STATISTICS\n');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.db);
    console.log('✅ Connected');

    // Get Users schema
    const Users = require('./app/modules/User/Schema').Users;

    // Count all users
    const totalUsers = await Users.countDocuments({});
    console.log(`\n2️⃣  Total Users in DB: ${totalUsers}`);

    // Count registered donors
    const registeredDonors = await Users.countDocuments({
      role: 'Donor',
      isActive: true,
      isDeleted: false
    });
    console.log(`\n3️⃣  Registered Active Donors: ${registeredDonors}`);

    // Count registered recipients
    const registeredRecipients = await Users.countDocuments({
      role: 'Recipient',
      isActive: true,
      isDeleted: false
    });
    console.log(`   Registered Active Recipients: ${registeredRecipients}`);

    // Count deleted/inactive
    const inactiveDonors = await Users.countDocuments({
      role: 'Donor',
      $or: [{ isActive: false }, { isDeleted: true }]
    });
    console.log(`   Inactive/Deleted Donors: ${inactiveDonors}`);

    // Show breakdown
    console.log('\n4️⃣  Blood Group Breakdown (Active Donors):');
    const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    
    for (const bg of bloodGroups) {
      const count = await Users.countDocuments({
        role: 'Donor',
        bloodGroup: bg,
        isActive: true,
        isDeleted: false
      });
      if (count > 0) {
        console.log(`   ${bg}: ${count}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ REGISTERED DONORS (API will return): ${registeredDonors}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkDonorStats();
