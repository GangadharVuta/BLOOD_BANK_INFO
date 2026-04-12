/**
 * AUTO-APPROVE PENDING FEEDBACK
 * Approves pending feedback for display on homepage
 */

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');

async function approvePendingFeedback() {
  try {
    console.log('\n🔄 APPROVING PENDING FEEDBACK\n');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.db);
    console.log('✅ Connected');

    // Get Feedback schema
    const Feedback = require('./app/modules/Feedback/Schema');

    // Find pending feedback
    console.log('\n2️⃣  Finding pending feedback...');
    const pendingFeedback = await Feedback.find({ isApproved: false, isDeleted: false });
    console.log(`   Found ${pendingFeedback.length} pending feedback items`);

    if (pendingFeedback.length === 0) {
      console.log('\n✅ No pending feedback to approve!');
      process.exit(0);
    }

    // Approve all pending feedback
    console.log('\n3️⃣  Approving feedback...');
    const result = await Feedback.updateMany(
      { isApproved: false, isDeleted: false },
      { 
        isApproved: true,
        approvedBy: new mongoose.Types.ObjectId('000000000000000000000000') // System approval
      }
    );

    console.log(`   ✅ Approved ${result.modifiedCount} feedback items`);

    // Verify
    console.log('\n4️⃣  Verifying...');
    const approvedCount = await Feedback.countDocuments({ isApproved: true });
    const pendingCount = await Feedback.countDocuments({ isApproved: false });
    
    console.log(`   Total Approved: ${approvedCount}`);
    console.log(`   Total Pending: ${pendingCount}`);

    // Show sample
    const samples = await Feedback.find({ isApproved: true }).limit(3).lean();
    if (samples.length > 0) {
      console.log('\n5️⃣  Sample approved feedback:');
      samples.forEach((fb, i) => {
        console.log(`   [${i + 1}] ${fb.role} (${fb.bloodGroup}): "${fb.message.substring(0, 50)}..."`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FEEDBACK NOW APPROVED - Will display on homepage!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

approvePendingFeedback();
