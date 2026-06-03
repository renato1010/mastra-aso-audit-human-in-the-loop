import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { asoAuditMetadataSchema, stateMetadataSchema } from '@/mastra/schemas';
import { mockFetchAsoMetadata } from '@/mastra/tools/fetch-app-metadata-tool';

// Step 1: Fetch metadata and suspend for confirmation
const fetchMetadata = createStep({
  id: 'fetch-metadata',
  description: 'Fetch app metadata from the provided URL and ask user for confirmation',
  inputSchema: z.object({
    url: z.url()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    metadata: asoAuditMetadataSchema
  }),
  suspendSchema: z.object({
    message: z.string().describe('Message to show the user when asking for confirmation')
  }),
  resumeSchema: z.object({
    approved: z.boolean()
  }),
  stateSchema: z.object({
    metadata: asoAuditMetadataSchema
  }),
  execute: async ({ inputData, resumeData, state, setState, suspend, bail }) => {
    // If resuming after user responded
    if (resumeData?.approved === false) {
      return bail({ message: 'User did not confirm the app listing.' });
    }
    // if have resumeData and it's approved, we can proceed to save the whole metadata in the workflow state for the next step to run the audit
    if (resumeData?.approved === true) {
      // User has confirmed
      // do we have workflow state metadata from the initial fetch?
      if (!state.metadata) {
        return bail({ message: 'Metadata not available after confirmation.' });
      }

      return { approved: true, metadata: state.metadata };
    }
    // First execution — fetch metadata and suspend for confirmation
    const metadata = await mockFetchAsoMetadata(inputData);
    if (!metadata) {
      return bail({ message: 'Failed to fetch app metadata.' });
    }
    await setState({ metadata });
    return await suspend({
      message: `Is this the app you meant?\n
      **${metadata.app.title}** by ${metadata.app.developer}\n
      Category: ${metadata.app.category} | Country: ${metadata.country}`
    });
  }
});

// Step 2: Return the full ASO audit
const runAudit = createStep({
  id: 'run-audit',
  inputSchema: z.object({ approved: z.boolean(), metadata: asoAuditMetadataSchema }),
  outputSchema: z.object({ payload: asoAuditMetadataSchema }),
  execute: async ({ inputData }) => {
    // check if user confirmed the surface metadata
    const isConfirmed = inputData.approved;
    const haveMetadata = inputData.metadata !== null;
    if (!isConfirmed || !haveMetadata) {
      throw new Error('Cannot run audit without confirmed metadata.');
    }
    return { payload: inputData.metadata };
  }
});

// Workflow definition
export const asoAuditWorkflow = createWorkflow({
  id: 'aso-audit-workflow',
  inputSchema: z.object({
    url: z.url().describe('The URL of the app listing to audit')
  }),
  outputSchema: z.object({
    payload: asoAuditMetadataSchema.describe('The full ASO audit metadata and recommendations')
  }),
  stateSchema: stateMetadataSchema
})
  .then(fetchMetadata)
  .then(runAudit)
  .commit();
