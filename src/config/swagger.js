const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sportz United API',
      version: '1.0.0',
      description: 'API documentation for the Sportz United booking platform',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local server',
      },
      {
        url: 'http://192.168.1.30:3000/api',
        description: 'Internal  server',
      },
      {
        url: 'http://13.203.242.238:4001/api',
        description: 'Internal  server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
