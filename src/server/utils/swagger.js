import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Media Studio API',
            version: '1.0.0',
            description: 'API documentation for AI Media Studio - Interactive AI Education Platform',
            contact: {
                name: 'Min',
                url: 'https://minbeing.com'
            },
        },
        servers: [
            {
                url: 'https://ai.minbeing.com',
                description: 'Production Server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server'
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
    },
    // Path to the API docs
    apis: [path.join(__dirname, '..', 'server.js'), path.join(__dirname, '..', 'auth', '*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
