/****************************
 MONGOOSE SCHEMAS
 ****************************/
const config = require('./configs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = function () {
    const db = mongoose.connect(config.db).then(
        (connect) => { console.log('✅ MongoDB connected') },
        (err) => { console.error('❌ MongoDB connection error:', err.message) }
    );
    return db;
};
