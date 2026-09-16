// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-jwt-secret-key-checkup360'
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
process.env.PUBLIC_WEB_ORIGIN = process.env.PUBLIC_WEB_ORIGIN || 'http://localhost:5173'
