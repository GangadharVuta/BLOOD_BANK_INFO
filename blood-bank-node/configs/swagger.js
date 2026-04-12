/**
 * ============================================
 * SWAGGER/OPENAPI CONFIGURATION
 * ============================================
 * Auto-generates API documentation
 * Accessible at /api/docs
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blood Bank Information System API',
      description: 'Comprehensive API documentation for Blood Bank Information System.',
      version: '2.0.0',
      contact: {
        name: 'Blood Bank Support',
        email: 'support@bloodbank.local'
      },
      license: {
        name: 'ISC'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? `https://${process.env.API_DOMAIN || 'api.bloodbank.com'}`
          : 'http://localhost:4000',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF protection token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['emailId', 'password', 'userName', 'phoneNumber'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB ObjectId'
            },
            emailId: {
              type: 'string',
              format: 'email'
            },
            userName: {
              type: 'string'
            },
            phoneNumber: {
              type: 'string'
            },
            bloodGroup: {
              type: 'string',
              enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
            },
            role: {
              type: 'string',
              enum: ['Donor', 'Recipient']
            },
            pincode: {
              type: 'string'
            },
            isActive: {
              type: 'boolean',
              default: true
            },
            isDeleted: {
              type: 'boolean',
              default: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['status', 'message'],
          properties: {
            status: {
              type: 'integer',
              example: 0
            },
            message: {
              type: 'string'
            },
            error: {
              type: 'string'
            }
          }
        },
        Success: {
          type: 'object',
          required: ['status', 'message'],
          properties: {
            status: {
              type: 'integer',
              example: 1
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            },
            token: {
              type: 'string'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid'
        },
        ForbiddenError: {
          description: 'Insufficient permissions'
        },
        NotFoundError: {
          description: 'Requested resource not found'
        },
        ValidationError: {
          description: 'Request validation failed'
        },
        ServerError: {
          description: 'Internal server error'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        csrfToken: []
      }
    ]
  },
  apis: [
    './app/modules/*/Routes.js',
    './swagger/**/*.js'
  ]
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI documentation
 * Mount at /api/docs
 */
const setupSwagger = (app) => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Blood Bank API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: false
      }
    })
  );

  // JSON specs endpoint
  app.get('/api/docs.json', (req, res) => {
    res.json(specs);
  });
};

module.exports = {
  swaggerJsdoc,
  swaggerUi,
  setupSwagger,
  specs
};
