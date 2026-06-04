import { z } from 'zod';

export const envVarsSchema = z.object({
  APPEEKY_API_KEY: z.string().describe('API key for Appeeky services')
});

function getEnvVars() {
  const parsed = envVarsSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${parsed.error.message}`);
  }

  return parsed.data;
}

// typed and validated environment variables
export const { APPEEKY_API_KEY } = getEnvVars();
