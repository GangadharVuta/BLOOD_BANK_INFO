/****************************
 COMMON MODEL
 ****************************/
let _ = require("lodash");

class Model {

    constructor(collection) {
        this.collection = collection;
    }

    // Store Data
    store(data, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const collectionObject = new this.collection(data)
                const createdObject = await collectionObject.save();
                return resolve(createdObject);
            } catch (error) {
                return reject(error);
            }
        });
    }

    bulkInsert(data) {

        return new Promise((resolve, reject) => {
            this.collection.collection.insert(data, (err, result) => {
                if (err) {
                    reject("Find duplicate Users");
                }
                else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = Model;