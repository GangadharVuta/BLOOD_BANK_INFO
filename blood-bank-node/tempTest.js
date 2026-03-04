require('dotenv').config({path:'.env.dev'});
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.db);
    const R = require('./app/modules/Request/Schema').Requests;
    const userId = '698b1f5248cf2eb7becf9c5b';
    const pipeline = [
        { $match: { $and: [{ requestedBy: mongoose.Types.ObjectId(userId) }] } },
        { $lookup: { from: 'users', localField: 'donorId', foreignField: '_id', as: 'userDetails' } },
        { $lookup: { from: 'donors', localField: 'donorId', foreignField: '_id', as: 'donorDetails' } },
        { $addFields: {
            merged: {
                $cond: [
                    { $gt: [{ $size: '$userDetails' }, 0] },
                    { $arrayElemAt: ['$userDetails', 0] },
                    { $arrayElemAt: ['$donorDetails', 0] }
                ]
            }
        } },
        { $unwind: '$merged' },
        { $project: {
            requestId: '$requestId',
            userId: '$merged._id',
            userName: { $ifNull: ['$merged.userName', '$merged.name'] },
            phoneNumber: { $ifNull: ['$merged.phoneNumber', '$merged.phone'] },
            pincode: '$merged.pincode',
            bloodGroup: { $ifNull: ['$merged.bloodGroup', '$merged.bloodGroup'] }
        } },
        { $sort: { _id: -1 } }
    ];

    const res = await R.aggregate(pipeline);
    console.log('agg result', res);
    process.exit(0);
}

run().catch(console.error);
