/**
 * TEST FEEDBACK SYSTEM
 * Diagnoses feedback API issues
 */

require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');
const http = require('http');

async function testFeedback() {
  try {
    console.log('\n🔍 FEEDBACK SYSTEM DIAGNOSTIC\n');
    console.log('='.repeat(60));

    // 1. Connect to database
    console.log('\n1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.db);
    console.log('✅ MongoDB connected');

    // 2. Check Feedback schema and count
    console.log('\n2️⃣  Checking Feedback Collection...');
    const Feedback = require('./app/modules/Feedback/Schema');
    const totalFeedback = await Feedback.countDocuments({});
    const approvedFeedback = await Feedback.countDocuments({ isApproved: true });
    const pendingFeedback = await Feedback.countDocuments({ isApproved: false });

    console.log(`   Total feedback in DB: ${totalFeedback}`);
    console.log(`   Approved feedback: ${approvedFeedback}`);
    console.log(`   Pending feedback: ${pendingFeedback}`);

    // 3. Show sample feedback
    if (approvedFeedback > 0) {
      console.log('\n3️⃣  Sample Approved Feedback:');
      const samples = await Feedback.find({ isApproved: true }).limit(3).lean();
      samples.forEach((fb, i) => {
        console.log(`   [${i + 1}] ${fb.role} (${fb.bloodGroup}): "${fb.message.substring(0, 50)}..."`);
      });
    } else {
      console.log('\n3️⃣  ⚠️  NO APPROVED FEEDBACK FOUND - This is why nothing shows on homepage!');
    }

    // 4. Simulate API response by directly checking database query
    console.log('\n4️⃣  Simulating /api/feedback/public query...');
    try {
      const publicFeedback = await Feedback.find({
        isApproved: true,
        isDeleted: false
      }).sort({ createdAt: -1 }).limit(10).lean();
      
      console.log(`   ✅ Query executed successfully`);
      console.log(`   Data returned: ${publicFeedback.length} items`);
      if (publicFeedback.length > 0) {
        console.log(`   ✅ Sample: ${publicFeedback[0].role} - "${publicFeedback[0].message.substring(0, 40)}..."`);
      } else {
        console.log(`   ⚠️  No approved feedback found (this will show on homepage as empty)`);
      }
    } catch (err) {
      console.log(`   ❌ Query Error: ${err.message}`);
    }

    // 5. Check stats
    console.log('\n5️⃣  Calculating platform statistics...');
    try {
      const avgRating = await Feedback.aggregate([
        { $match: { isApproved: true, isDeleted: false } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      
      console.log(`   ✅ Stats calculated`);
      if (avgRating.length > 0) {
        console.log(`   Average Rating: ${avgRating[0].avgRating.toFixed(1)}`);
      }
    } catch (err) {
      console.log(`   ❌ Stats Error: ${err.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    
    if (approvedFeedback === 0) {
      console.log(`
   ❌ ISSUE FOUND:
   No approved feedback in the database.
   
   👉 SOLUTION:
   Admin needs to approve feedback first!
   
   Steps:
   1. Login as admin
   2. Go to /admin/feedback-moderation
   3. Approve pending feedback items
   4. Feedback will then appear on homepage
      `);
    } else {
      console.log(`
   ✅ Feedback system is working!
   ${approvedFeedback} approved feedback items should display.
   
   If not showing on homepage:
   - Check browser console for API errors
   - Clear browser cache
   - Check if FeedbackCarousel component is imported in HomePage
      `);
    }

    console.log('='.repeat(60) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run test
testFeedback();
