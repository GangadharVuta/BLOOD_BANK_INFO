/****************************
 REQUEST PARAM SET CONTROLLER
 ****************************/
class Controller {
    boot(req, res, next) {
        this.req = req;
        this.res = res;
        this.next = next;
        return this;
    }

    /**
     * Send a standardized JSON response
     * @param {number} status - 1 for success, 0 for failure
     * @param {string} message - Response message
     * @param {object|array} data - Response data
     * @param {number} statusCode - HTTP status code (default: 200)
     */
    sendResponse(status, message, data = {}, statusCode = 200) {
        return this.res.status(statusCode).json({
            status: status,
            message: message,
            data: data
        });
    }
}

module.exports = Controller;