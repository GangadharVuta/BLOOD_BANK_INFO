
module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const RequestsController = require('./Controller');
    const config = require('../../../configs/configs');

    router.post('/requests/getDonorsList', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.getDonorsList();
    });

    router.post('/requests/requestDonors', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.requestDonors();
    });

    router.get('/requests/accept/:requestId/donor/:donorId', (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.acceptRequest();
    });

    router.get('/requests/reject/:requestId/donor/:donorId', (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.rejectRequest();
    });

    router.get('/requests/cancel/:requestId', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.cancelRequest();
    });

    router.post('/requests/getDonorsListForRequests', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.getDonorsListForRequests();
    });

    router.get('/requests/getRequestIds', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.getRequestIds();
    });

    // new endpoint: donors for a specific request
    router.get('/requests/:id/donors', Globals.isAuthorised, (req, res, next) => {
        const requestObj = (new RequestsController()).boot(req, res);
        return requestObj.getDonorsForRequest();
    });
    app.use(config.baseApiUrl, router);
}