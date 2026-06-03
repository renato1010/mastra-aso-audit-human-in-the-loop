'use client';
import { SubmitEventHandler, useMemo, useState } from 'react';
import { DefaultChatTransport, ToolUIPart } from 'ai';
import type { WorkflowDataPart } from '@mastra/ai-sdk';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

import { Message, MessageContent } from '@/components/ai-elements/message';
import { Tool, ToolHeader, ToolContent, ToolOutput } from '@/components/ai-elements/tool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AsoAuditMetadata } from '@/src/mastra/schemas';
import { AsoAuditCard } from './aso-audit-card';

type WorkflowData = WorkflowDataPart['data'];
const STATUS_MAP: Record<WorkflowData['steps'][string]['status'], ToolUIPart['state']> = {
  running: 'input-available',
  paused: 'input-available',
  waiting: 'input-available',
  suspended: 'input-available',
  success: 'output-available',
  failed: 'output-error'
};

const DisplayStep = ({ step, title }: { step: WorkflowData['steps'][string]; title: string }) => {
  return (
    <Tool>
      <ToolHeader title={title} type="tool-data-workflow" state={STATUS_MAP[step.status]} />
      <ToolContent>
        {step.status === 'suspended' && step.suspendPayload && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Awaiting Approval
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-line">
                  {typeof step.suspendPayload === 'object' && 'message' in step.suspendPayload
                    ? String(step.suspendPayload.message)
                    : JSON.stringify(step.suspendPayload)}
                </div>
                {typeof step.suspendPayload === 'object' && 'requestId' in step.suspendPayload && (
                  <Badge variant="outline" className="mt-2">
                    ID: {String(step.suspendPayload.requestId)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        <ToolOutput
          output={step.output}
          errorText={step.status === 'failed' ? 'Step failed' : undefined}
        />
      </ToolContent>
    </Tool>
  );
};

const WorkflowAsoAudit = () => {
  const [url, setUrl] = useState<string>('');

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:4750/workflow/asoAuditWorkflow',
      prepareSendMessagesRequest: ({ messages }) => {
        // inspect the last message and decide whether it's started a new run
        // or resuming a suspended one.
        const lastMessage = messages[messages.length - 1].parts.find(
          (part) => part.type === 'text'
        )?.text;
        const metadata = messages[messages.length - 1].metadata as {
          runId: string;
          url?: string;
        };
        // Resuming: user sent confirmation (yes/no) for the aso-audit-workflow
        if (lastMessage && (lastMessage === 'yes' || lastMessage === 'no')) {
          return {
            body: {
              runId: metadata.runId,
              step: 'fetch-metadata',
              resumeData: { approved: lastMessage === 'yes' }
            }
          };
        }
        // Starting a new run: send inputData
        console.log('will send inputData with url:', metadata.url);
        return {
          body: {
            inputData: {
              url: metadata.url
            }
          }
        };
      }
    })
  });

  const suspendedWorkflow = useMemo(() => {
    const part = messages
      .flatMap((m) => m.parts)
      .find(
        (part): part is WorkflowDataPart =>
          part.type === 'data-workflow' &&
          'data' in part &&
          typeof part.data === 'object' &&
          part.data !== null &&
          'status' in part.data &&
          part.data.status === 'suspended'
      );
    return part ? (part.data as WorkflowData) : null;
  }, [messages]);

  const prevRunId = messages
    .flatMap((m) => m.parts)
    .find((part): part is WorkflowDataPart => part.type === 'data-workflow')?.id;

  const handleStart: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setMessages([]);
    sendMessage({
      text: 'Start',
      metadata: { runId: prevRunId, url: url.trim() }
    });
  };

  const handleApprove = () => {
    if (!suspendedWorkflow) return;
    setMessages([]);
    sendMessage({
      text: 'yes',
      metadata: { runId: prevRunId }
    });
  };

  const handleReject = () => {
    if (!suspendedWorkflow) return;
    setMessages([]);
    sendMessage({
      text: 'no',
      metadata: { runId: prevRunId }
    });
  };

  const isSuspended = suspendedWorkflow !== null;
  const canStart = status === 'ready' && !isSuspended;
  const canResume = isSuspended && status === 'ready';
  return (
    <div className="flex flex-col gap-6 h-full max-h-full lg:w-4/5 mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle className="font-bold text-lg">Confirm App metadata Workflow</CardTitle>
          </div>
          <CardDescription>
            Submit a URL to fetch ASO metadata. The workflow will suspend and ask for confirmation
            before proceeding with the audit. You can approve or reject the request while it&apos;s
            suspended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="requestType" className="text-sm font-medium">
                App URL
              </label>
              <Input
                id="requestType"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580"
                required
                disabled={!canStart}
              />
            </div>
            {isSuspended && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h3 className="font-medium">
                  Confirm App Metadata: Look for &apos;fetch-metadata&apos; step content
                </h3>
              </div>
            )}
            <div className="flex gap-2">
              {canStart && (
                <Button type="submit" disabled={!url.trim()} className="">
                  Submit URL
                </Button>
              )}
              {canResume && (
                <div className="w-full flex justify-around">
                  <Button
                    type="button"
                    onClick={handleApprove}
                    variant="default"
                    className="px-6 py-4"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Yes, this is correct
                  </Button>
                  <Button
                    type="button"
                    onClick={handleReject}
                    variant="destructive"
                    className="px-6 py-4"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    No, this is not correct
                  </Button>
                </div>
              )}
              {isSuspended && !canResume && (
                <div className="text-sm text-muted-foreground p-2">
                  Waiting for workflow to be ready...
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, index) => {
              if (part.type === 'text' && message.role === 'user') {
                return (
                  <Message key={index} from={message.role}>
                    <MessageContent>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>
                );
              }

              if (part.type === 'data-workflow') {
                const workflow = (part as WorkflowDataPart).data as WorkflowData;
                const steps = Object.entries(workflow.steps);

                return (
                  <div key={index} className="space-y-4">
                    {steps.map(([stepId, step]) => (
                      <DisplayStep key={stepId} step={step} title={stepId} />
                    ))}
                    {status === 'ready' && workflow.steps['run-audit']?.status === 'success' && (
                      <Message from="assistant">
                        <MessageContent>
                          {(() => {
                            const output = workflow.steps['run-audit']?.output as  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              | Record<string, any>
                              | undefined;
                            if (output && typeof output['payload'] === 'object') {
                              const asoAuditPayload = output['payload'] as AsoAuditMetadata;
                              if (!asoAuditPayload) {
                                return `ASO Audit completed but no payload available.`;
                              }
                              return <AsoAuditCard data={asoAuditPayload} />;
                            }
                            return `Something went wrong renderind ASO Audit results.`;
                          })()}
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                );
              }

              if (part.type === 'text' && message.role === 'assistant') {
                return (
                  <Message key={index} from={message.role}>
                    <MessageContent>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>
                );
              }

              return null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowAsoAudit;
