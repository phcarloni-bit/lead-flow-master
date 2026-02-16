// src/__tests__/setup.ts

import dotenv from 'dotenv';

dotenv.config();

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.WHATSAPP_APP_SECRET = 'test-secret';
