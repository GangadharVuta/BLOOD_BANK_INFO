const BloodBankController = require('./Controller');

module.exports = function (app, express) {
  const router = express.Router();

  // Get nearby blood banks
  router.get('/nearby', BloodBankController.getNearbyBloodBanks);

  // Get all blood banks (admin)
  router.get('/all', BloodBankController.getAllBloodBanks);

  // Get blood bank by ID
  router.get('/:id', BloodBankController.getBloodBankById);

  // Add new blood bank (manual entry)
  router.post('/add', BloodBankController.addBloodBank);

  // Update blood bank availability
  router.put('/:id/availability', BloodBankController.updateAvailability);

  // Search by city
  router.get('/search/city', BloodBankController.searchByCity);

  // Mount router
  app.use('/api/blood-banks', router);
};
