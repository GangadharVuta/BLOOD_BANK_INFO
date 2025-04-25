/****************************
 EXPRESS AND ROUTING HANDLING
 ****************************/
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');


module.exports = function () {
  console.log('env - ' + process.env.NODE_ENV)

  app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true
  }));

  app.use(bodyParser.json());
  app.use(cors());

  // =======   Settings for CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use((err, req, res, next) => {
    return res.send({
      status: 0,
      statusCode: 500,
      message: err.message,
      error: err
    });
  })
  app.use(express.json());

  // =======   Routing
  require('../app/modules/User/Routes.js')(app, express);
  require('../app/modules/Request/Routes.js')(app, express);
  return app;
};
