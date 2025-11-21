const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dead Stock Asset Management System API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Dead Stock Asset Management System',
      contact: {
        name: 'API Support',
        email: 'support@assetmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://online-dead-stock-register.onrender.com'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            employeeId: { type: 'string', example: 'EMP-2025-0001' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john.doe@company.com' },
            role: { 
              type: 'string', 
              enum: ['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR', 'VENDOR'],
              example: 'AUDITOR'
            },
            department: {
              type: 'string',
              enum: ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'],
              example: 'IT'
            },
            phone: { type: 'string', example: '+1234567890' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Asset: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            assetId: { type: 'string', example: 'AST-2025-0001' },
            name: { type: 'string', example: 'Dell Laptop' },
            category: { 
              type: 'string',
              enum: ['IT Equipment', 'Furniture', 'Vehicles', 'Machinery', 'Office Supplies', 'Other'],
              example: 'IT Equipment'
            },
            serialNumber: { type: 'string', example: 'SN123456789' },
            purchaseDate: { type: 'string', format: 'date' },
            purchasePrice: { type: 'number', example: 1200.00 },
            currentValue: { type: 'number', example: 800.00 },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'IN_USE', 'MAINTENANCE', 'DISPOSED', 'LOST'],
              example: 'IN_USE'
            },
            location: { type: 'string', example: 'Office Building A' },
            assignedTo: { type: 'string', example: '507f1f77bcf86cd799439011' },
            condition: {
              type: 'string',
              enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
              example: 'GOOD'
            },
            warrantyExpiry: { type: 'string', format: 'date' },
            lastAuditDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            vendorId: { type: 'string', example: 'VEN-2025-0001' },
            name: { type: 'string', example: 'ABC Supplies Inc.' },
            email: { type: 'string', example: 'contact@abcsupplies.com' },
            phone: { type: 'string', example: '+1234567890' },
            address: { type: 'string', example: '123 Business St, City, Country' },
            category: {
              type: 'string',
              enum: ['IT Equipment', 'Furniture', 'Vehicles', 'Machinery', 'Office Supplies', 'Other'],
              example: 'IT Equipment'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'],
              example: 'ACTIVE'
            },
            rating: { type: 'number', minimum: 0, maximum: 5, example: 4.5 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error information' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Assets', description: 'Asset management endpoints' },
      { name: 'Vendors', description: 'Vendor management endpoints' },
      { name: 'Transactions', description: 'Transaction management endpoints' },
      { name: 'Audits', description: 'Audit management endpoints' },
      { name: 'Reports', description: 'Reporting endpoints' },
      { name: 'Dashboard', description: 'Dashboard statistics endpoints' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'] // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
