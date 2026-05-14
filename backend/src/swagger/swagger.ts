const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "A11y Platform API",
      version: "1.0.0",
      description: "REST API для платформы доступности интерфейсов",
    },
    servers: [{ url: "http://localhost:4000/api", description: "Development server" }],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
