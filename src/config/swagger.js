const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Financial Dashboard Backend API',
      version: '2.0.0',
      description: 'Role-based financial management and analytics API.\n\n**Roles:** Admin > Analyst > Viewer\n\nAll protected routes require `Authorization: Bearer <token>`.',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            data: { type: 'object', nullable: true, example: null },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Rahul Sharma' },
            email: { type: 'string', format: 'email', example: 'rahul@company.com' },
            role: { type: 'string', enum: ['Admin', 'Analyst', 'Viewer'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'string', example: '45000.0000' },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { type: 'string', example: 'salary' },
            date: { type: 'string', format: 'date', example: '2026-03-30' },
            description: { type: 'string', example: 'Monthly salary for march' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      // ─── AUTH ────────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new account with the default **Viewer** role. No token required.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Rahul Sharma' },
                    email: { type: 'string', format: 'email', example: 'rahul@company.com' },
                    password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Registered successfully',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'User registered successfully.Please login to continue.',
                    data: { user: { id: 'uuid', name: 'Rahul Sharma', role: 'Viewer', status: 'active' } },
                  },
                },
              },
            },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get a JWT token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'rahul@company.com' },
                    password: { type: 'string', example: 'SecurePass123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful — use the returned token in all future requests',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Login successful',
                    data: {
                      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      user: { id: 'uuid', name: 'Rahul Sharma', role: 'Viewer', status: 'active' },
                    },
                  },
                },
              },
            },
            401: { description: 'Wrong email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
            403: { description: 'Account is inactive', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },

      // ─── USERS ───────────────────────────────────────────────────────────
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (Admin only)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 100 } },
          ],
          responses: {
            200: {
              description: 'Paginated user list',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      users: [{ id: 'uuid', name: 'Rahul Sharma', email: 'rahul@company.com', role: 'Viewer', status: 'active', createdAt: '2026-04-03T10:30:00Z' }],
                      pagination: { total: 24, page: 1, limit: 10, totalPages: 3 },
                    },
                  },
                },
              },
            },
            401: { description: 'Missing or invalid token' },
            403: { description: 'Not an Admin' },
          },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update a user\'s role (Admin only)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: { role: { type: 'string', enum: ['Admin', 'Analyst', 'Viewer'] } },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Role updated',
              content: {
                'application/json': {
                  example: { success: true, message: 'User role updated successfully', data: { id: 'uuid', name: 'Rahul Sharma', role: 'Analyst' } },
                },
              },
            },
            404: { description: 'User not found' },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },
      '/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Activate or deactivate a user (Admin only)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: { status: { type: 'string', enum: ['active', 'inactive'] } },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Status updated',
              content: {
                'application/json': {
                  example: { success: true, message: 'User status updated to inactive', data: { id: 'uuid', name: 'Rahul Sharma', status: 'inactive' } },
                },
              },
            },
            404: { description: 'User not found' },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },

      // ─── RECORDS ─────────────────────────────────────────────────────────
      '/records': {
        get: {
          tags: ['Records'],
          summary: 'List records with filters (Analyst, Admin)',
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
            { in: 'query', name: 'category', schema: { type: 'string', example: 'food' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date', example: '2026-03-01' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date', example: '2026-03-30' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 100 } },
          ],
          responses: {
            200: {
              description: 'Paginated records',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      records: [{ id: 'uuid', amount: '1200.0000', type: 'expense', category: 'food', date: '2026-04-01', description: 'Team lunch' }],
                      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
                    },
                  },
                },
              },
            },
            401: { description: 'Missing or invalid token' },
            403: { description: 'Viewer role cannot access records' },
          },
        },
        post: {
          tags: ['Records'],
          summary: 'Create a new record (Admin only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'type', 'category', 'date'],
                  properties: {
                    amount: { type: 'number', example: 45000.00 },
                    type: { type: 'string', enum: ['income', 'expense'] },
                    category: { type: 'string', example: 'salary' },
                    date: { type: 'string', format: 'date', example: '2026-03-30' },
                    description: { type: 'string', example: 'Monthly salary for March' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Record created',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Record created successfully',
                    data: { id: 'uuid', amount: '45000.0000', type: 'income', category: 'salary', date: '2026-02-10', description: 'Monthly salary for Febuary', createdBy: 'admin-uuid', createdAt: '2025-06-01T08:00:00Z' },
                  },
                },
              },
            },
            403: { description: 'Admin only' },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
      },
      '/records/{id}': {
        patch: {
          tags: ['Records'],
          summary: 'Update a record (Admin only)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 45500.00 },
                    type: { type: 'string', enum: ['income', 'expense'] },
                    category: { type: 'string', example: 'salary' },
                    date: { type: 'string', format: 'date' },
                    description: { type: 'string', example: 'Adjusted monthly salary' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Record updated',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Record updated successfully',
                    data: { id: 'uuid', amount: '45500.0000', type: 'income', category: 'salary', date: '2026-03-31', description: 'Adjusted monthly salary', updatedBy: 'admin-uuid', updatedAt: '2026-03-31T10:15:00Z' },
                  },
                },
              },
            },
            403: { description: 'Admin only' },
            404: { description: 'Record not found' },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          },
        },
        delete: {
          tags: ['Records'],
          summary: 'Soft-delete a record (Admin only)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            204: { description: 'Deleted (no body)' },
            403: { description: 'Admin only' },
            404: { description: 'Record not found' },
          },
        },
      },

      // ─── DASHBOARD ───────────────────────────────────────────────────────
      '/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Financial summary — total income, expenses, net balance',
          parameters: [
            { in: 'query', name: 'month', schema: { type: 'string', example: '2026-02' }, description: 'Filter by month (YYYY-MM). Omit for all-time.' },
          ],
          responses: {
            200: {
              description: 'Summary data',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: { totalIncome: '285000.00', totalExpenses: '143500.75', netBalance: '141499.25', totalTransactions: 47, period: 'all-time' },
                  },
                },
              },
            },
          },
        },
      },
      '/dashboard/by-category': {
        get: {
          tags: ['Dashboard'],
          summary: 'Income and expense totals grouped by category',
          responses: {
            200: {
              description: 'Category breakdown',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      income: [{ category: 'salary', total: '245000.00', count: 5 }],
                      expense: [{ category: 'rent', total: '72000.00', count: 6 }, { category: 'food', total: '28500.75', count: 23 }],
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dashboard/trends': {
        get: {
          tags: ['Dashboard'],
          summary: 'Monthly income vs expense trend',
          responses: {
            200: {
              description: 'Monthly trends',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      period: 'monthly',
                      trends: [
                        { month: '2025-01', income: '45000.00', expenses: '22000.00', net: '23000.00' },
                        { month: '2025-02', income: '45000.00', expenses: '19500.00', net: '25500.00' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/dashboard/recent': {
        get: {
          tags: ['Dashboard'],
          summary: 'Latest N transactions',
          parameters: [
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 50 }, description: 'Number of records to return' },
          ],
          responses: {
            200: {
              description: 'Recent transactions',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      recent: [
                        { id: 'uuid', amount: '1200.00', type: 'expense', category: 'food', description: 'Team lunch', date: '2026-03-28' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
