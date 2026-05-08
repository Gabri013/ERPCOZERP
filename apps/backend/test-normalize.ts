import { body, validationResult } from 'express-validator';
import express from 'express';

const app = express();
app.use(express.json());

const testEmail = 'master@Cozinha.com';

// Simular o middleware
const middleware = body('email').isEmail().normalizeEmail();

// Test it
middleware.run({ email: testEmail } as any).then(() => {
  console.log('Original email:', testEmail);
  console.log('After normalizeEmail(): A ser testado...');
  
  // Fazer request com express-validator
  const result = validationResult({ body: { email: testEmail } } as any);
  console.log('Result:', result);
});
