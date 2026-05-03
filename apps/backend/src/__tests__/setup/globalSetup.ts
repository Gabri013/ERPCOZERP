import { vi } from 'vitest';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('LOG_LEVEL', 'silent');
