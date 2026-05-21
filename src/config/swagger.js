
import swaggerJsdoc     from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'DSHub Graduation Showcase API',
      version:     '1.0.0',
      description: `
## DSHub Cohort A 2026 — Graduation Showcase REST API

Built with **Node.js**, **Express**, and **MongoDB**.

### Authentication
This API uses **JWT Bearer tokens**.
1. Register via \`POST /api/v1/auth/register\` or log in via \`POST /api/v1/auth/login\`
2. Copy the \`accessToken\` from the response
3. Click **Authorize** above and enter: \`Bearer <your_token>\`

### Roles
| Role | Access |
|------|--------|
| \`intern\` | Public data + own profile |
| \`mentor\` | Intern access + approve testimonials |
| \`admin\`  | Full access |

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| All routes | 100 req / 15 min |
| register, login | 10 req / 15 min |
| forgot-password | 3 req / 1 hour |
      `,
      contact: {
        name:  'DSHub Backend Team',
        email: 'admin@dshub.com',
      },
    },
    servers: [
      {
        url:         `http://localhost:${process.env.PORT || 9000}/api/v1`,
        description: 'Development server',
      },
      {
        url:         `${process.env.SERVER_URL || 'https://your-api.onrender.com'}/api/v1`,
        description: 'Production server (Render)',
      },
    ],
    components: {
      // ── Security Scheme ─────────────────────────────────────────────────
      securitySchemes: {
        BearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Enter your JWT access token',
        },
      },

      // ── Reusable Schemas ─────────────────────────────────────────────────
      schemas: {

        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'Operation successful.' },
            data:    { type: 'object' },
          },
        },

        // Paginated Response
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data:    { type: 'object' },
            pagination: {
              type: 'object',
              properties: {
                currentPage:  { type: 'integer', example: 1 },
                totalPages:   { type: 'integer', example: 5 },
                totalCount:   { type: 'integer', example: 48 },
                limit:        { type: 'integer', example: 10 },
                hasNextPage:  { type: 'boolean', example: true },
                hasPrevPage:  { type: 'boolean', example: false },
              },
            },
          },
        },

        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Something went wrong.' },
            errors:  {
              type: 'object',
              additionalProperties: { type: 'string' },
              example: { email: 'Invalid email', password: 'Too short' },
            },
          },
        },

        // User
        User: {
          type: 'object',
          properties: {
            _id:           { type: 'string',  example: '665a1b2c3d4e5f6a7b8c9d0e' },
            fullName:      { type: 'string',  example: 'Chukwuemeka Obi' },
            email:         { type: 'string',  example: 'emeka@dshub.com' },
            role:          { type: 'string',  enum: ['intern', 'mentor', 'admin'] },
            avatar:        { type: 'string',  example: 'https://example.com/avatar.jpg' },
            isActive:      { type: 'boolean', example: true },
            emailVerified: { type: 'boolean', example: true },
            lastLogin:     { type: 'string',  format: 'date-time' },
            createdAt:     { type: 'string',  format: 'date-time' },
          },
        },

        // Auth Response
        AuthResponse: {
          type: 'object',
          properties: {
            success:      { type: 'boolean', example: true },
            message:      { type: 'string',  example: 'Login successful.' },
            data: {
              type: 'object',
              properties: {
                accessToken:  { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user:         { $ref: '#/components/schemas/User' },
              },
            },
          },
        },

        // Intern
        Intern: {
          type: 'object',
          properties: {
            _id:              { type: 'string' },
            user:             { $ref: '#/components/schemas/User' },
            cohort:           { type: 'string',  example: 'Cohort A 2026' },
            track:            { type: 'string',  example: 'backend' },
            bio:              { type: 'string' },
            profileImage:     { type: 'string' },
            githubUrl:        { type: 'string' },
            linkedinUrl:      { type: 'string' },
            portfolioUrl:     { type: 'string' },
            achievements:     { type: 'array', items: { type: 'string' } },
            projects:         { type: 'array', items: { type: 'object' } },
            gradScore:        { type: 'number', example: 85 },
            weeklySubmissions:{ type: 'number', example: 9 },
            isGraduating:     { type: 'boolean', example: true },
            isVisible:        { type: 'boolean', example: true },
            projectCount:     { type: 'number', example: 2 },
            isProfileComplete:{ type: 'boolean', example: true },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },

        // Testimonial
        Testimonial: {
          type: 'object',
          properties: {
            _id:              { type: 'string' },
            author:           { $ref: '#/components/schemas/User' },
            content:          { type: 'string' },
            track:            { type: 'string', example: 'backend' },
            rating:           { type: 'number', example: 5 },
            isApproved:       { type: 'boolean' },
            isFeatured:       { type: 'boolean' },
            moderationStatus: { type: 'string', enum: ['pending', 'approved', 'featured'] },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },

        // Milestone
        Milestone: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            title:        { type: 'string',  example: 'Cohort A 2026 Kickoff' },
            description:  { type: 'string' },
            week:         { type: 'integer', example: 1 },
            date:         { type: 'string',  format: 'date-time' },
            track:        { type: 'string',  nullable: true },
            type:         { type: 'string',  enum: ['technical', 'collaboration', 'achievement'] },
            icon:         { type: 'string',  example: '🚀' },
            isHighlight:  { type: 'boolean' },
            formattedDate:{ type: 'string',  example: 'Tuesday, 6 January 2026' },
            isUpcoming:   { type: 'boolean' },
          },
        },

        // Media
        Media: {
          type: 'object',
          properties: {
            _id:                { type: 'string' },
            title:              { type: 'string' },
            description:        { type: 'string' },
            url:                { type: 'string' },
            mimeType:           { type: 'string', example: 'image/jpeg' },
            fileSize:           { type: 'number' },
            fileSizeFormatted:  { type: 'string', example: '512.0 KB' },
            type:               { type: 'string', enum: ['image', 'video'] },
            category:           { type: 'string', enum: ['ceremony', 'project', 'team', 'individual'] },
            uploadedBy:         { $ref: '#/components/schemas/User' },
            isPublic:           { type: 'boolean' },
            isFeatured:         { type: 'boolean' },
            altText:            { type: 'string' },
            createdAt:          { type: 'string', format: 'date-time' },
          },
        },

        // Analytics
        Analytics: {
          type: 'object',
          properties: {
            cohort:               { type: 'string',  example: 'Cohort A 2026' },
            totalInterns:         { type: 'integer', example: 32 },
            totalGraduating:      { type: 'integer', example: 30 },
            completionRate:       { type: 'number',  example: 93.75 },
            avgGradScore:         { type: 'number',  example: 81.5 },
            totalSubmissions:     { type: 'integer', example: 288 },
            byTrack:              { type: 'object' },
            weeklyActivity:       { type: 'array', items: { type: 'object' } },
            topPerformers:        { type: 'array', items: { type: 'object' } },
            graduationRate:       { type: 'string',  example: '93.8%' },
            lastUpdatedLabel:     { type: 'string',  example: '2 hours ago' },
            generatedAt:          { type: 'string',  format: 'date-time' },
          },
        },
      },

      // ── Reusable Parameters ──────────────────────────────────────────────
      parameters: {
        pageParam: {
          in: 'query', name: 'page', schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        limitParam: {
          in: 'query', name: 'limit', schema: { type: 'integer', default: 10, maximum: 50 },
          description: 'Items per page (max 50)',
        },
        idParam: {
          in: 'path', name: 'id', required: true, schema: { type: 'string' },
          description: 'MongoDB ObjectId',
        },
      },

      // ── Reusable Responses ───────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Authentication required or token invalid',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        BadRequest: {
          description: 'Validation error or bad input',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServerError: {
          description: 'Internal server error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },

    // Global security — all endpoints require Bearer auth by default
    // Individual public endpoints override with security: []
    security: [{ BearerAuth: [] }],

    // ── Tags (sidebar grouping in Swagger UI) ────────────────────────────
    tags: [
      { name: 'Auth',         description: 'Authentication — register, login, tokens, password reset' },
      { name: 'Interns',      description: 'Intern profile management' },
      { name: 'Testimonials', description: 'Testimonial submission and moderation' },
      { name: 'Milestones',   description: 'Program milestone timeline' },
      { name: 'Media',        description: 'Media upload and management' },
      { name: 'Analytics',    description: 'Cohort analytics and dashboard metrics' },
      { name: 'Health',       description: 'Server health check' },
    ],
  },

  // Scan these files for JSDoc @swagger annotations
  apis: [
    './src/routes/*.js',
    './app.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// ---------------------------------------------------------------------------
// Setup Function
// ---------------------------------------------------------------------------

/**
 * Mount Swagger UI on the Express app.
 * Called once in app.js.
 *
 * Usage in app.js:
 *   import setupSwagger from './src/config/swagger.js';
 *   setupSwagger(app);
 *
 * Access at: http://localhost:9000/api-docs
 *
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  // Serve the raw OpenAPI JSON spec at /api-docs.json
  // Useful for importing into Postman or other API tools
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve the Swagger UI
  app.use(
    '/api-docs',
    swaggerUiExpress.serve,
    swaggerUiExpress.setup(swaggerSpec, {
      customSiteTitle: 'DSHub Graduation API Docs',
      customfavIcon:   '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true, // keeps token between page refreshes
        displayRequestDuration: true,
        filter: true,               // enables search bar in Swagger UI
        tryItOutEnabled: true,      // "Try it out" enabled by default
      },
    })
  );

  console.log(`[Swagger] Docs available at http://localhost:${process.env.PORT || 9000}/api-docs`);
};

export default setupSwagger;