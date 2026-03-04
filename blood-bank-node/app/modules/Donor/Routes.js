module.exports = (app, express) => {

    const router = express.Router();
    const Globals = require("../../../configs/Globals");
    const DonorsController = require('./Controller');

    // POST - Create a new donor
    router.post('/api/donors', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.addDonor();
    });

    // GET - Get merged list of registered & added donors (must be before other GET routes)
    router.get('/api/donors/merged/all', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.getMergedDonors();
    });

    // GET - Get all donors (admin only - must be before /:id route)
    router.get('/api/donors/admin/all', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.getAllDonors();
    });

    // GET - Get single donor by ID (must be before query-based route)
    router.get('/api/donors/:id', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.getDonorById();
    });

    // GET - Get donors by addedBy user (requires query param: addedBy=userId)
    // This must check for query parameters, not path params
    router.get('/api/donors', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        if (req.query.addedBy) {
            return donorObj.getDonorsByUser();
        } else {
            return donorObj.getAllDonors();
        }
    });

    // PUT - Update a donor
    router.put('/api/donors/:id', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.updateDonor();
    });

    // DELETE - Delete a donor
    router.delete('/api/donors/:id', Globals.isAuthorised, (req, res, next) => {
        const donorObj = (new DonorsController()).boot(req, res);
        return donorObj.deleteDonor();
    });

    app.use('/', router);
};
