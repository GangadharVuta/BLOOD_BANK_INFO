/****************************
 MONGOOSE SCHEMAS
 ****************************/
const config = require('./configs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = function () {
    const db = mongoose.connect(config.db, {
        useNewUrlParser: true,
    }).then(
        (connect) => { console.log('MongoDB connected') },
        (err) => { console.log('MongoDB connection error', err) }
    );
    return db;
};
