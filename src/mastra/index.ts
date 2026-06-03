import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter
} from '@mastra/observability';
import { asoAuditWorkflow } from '@/mastra/workflows/aso-audit-workflow';
import { approvalWorkflow } from '@/mastra/workflows/approval-workflow';
import { workflowRoute } from '@mastra/ai-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const mastra = new Mastra({
  workflows: { asoAuditWorkflow, approvalWorkflow },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: `file:${resolve(__dirname, '../..', 'mastra.db')}`
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability')
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter() // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter() // Redacts sensitive data like passwords, tokens, keys
        ]
      }
    }
  }),
  server: {
    port: 4750,
    cors: {
      origin: '*',
      allowMethods: ['*'],
      allowHeaders: ['*']
    },
    apiRoutes: [
      workflowRoute({
        path: '/workflow/:workflowId',
        sendReasoning: true
      })
    ]
  }
});
