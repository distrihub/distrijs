import '@testing-library/jest-dom/vitest';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';

// Load integration/.env so e2e tests pick up DISTRI_BASE_URL etc. without
// each file having to source it.
loadDotenv({ path: path.resolve(__dirname, '..', '.env') });
