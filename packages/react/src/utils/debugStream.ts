// Utility for debugging stream events in real-time

import { Agent, DistriChatMessage, isDistriEvent, isDistriMessage, isDistriArtifact } from '@distri/core';

export interface StreamDebugOptions {
  logEvents?: boolean;
  logMessages?: boolean;
  logTiming?: boolean;
  onEvent?: (event: DistriChatMessage, index: number) => void;
}

export async function debugStreamEvents(
  agent: Agent,
  message: string,
  options: StreamDebugOptions = {}
) {
  const {
    logEvents = true,
    logMessages = true,
    logTiming = true,
    onEvent
  } = options;

  console.log('🧪 Starting stream debug for message:', message);
  const startTime = Date.now();
  let eventCount = 0;
  const events: DistriChatMessage[] = [];

  try {
    // Create the message
    const userMessage = {
      messageId: 'debug-msg-' + Date.now(),
      role: 'user' as const,
      parts: [{ kind: 'text' as const, text: message }],
      kind: 'message' as const,
      contextId: 'debug-context',
      taskId: 'debug-task'
    };

    console.log('📤 Sending message to agent...');

    // Start the stream
    const stream = await agent.invokeStream({
      message: userMessage,
      metadata: {}
    });

    console.log('📡 Stream started, listening for events...');

    // Process each event
    for await (const event of stream) {
      eventCount++;
      const eventTime = Date.now() - startTime;
      
      events.push(event);

      if (logEvents) {
        console.log(`\n📥 Event ${eventCount} (${eventTime}ms):`, {
          type: (event as any).type || 'message',
          id: (event as any).id || 'no-id',
          role: (event as any).role || 'no-role',
          isEvent: isDistriEvent(event),
          isMessage: isDistriMessage(event),
          isArtifact: isDistriArtifact(event)
        });
      }

      // Log event-specific details
      if (isDistriEvent(event)) {
        const distriEvent = event;
        
        if (logEvents) {
          console.log(`   🔍 Event data:`, distriEvent.data);
        }

        // Special handling for text streaming events
        if (distriEvent.type === 'text_message_start') {
          console.log(`   🚀 Started streaming message: ${(distriEvent.data as any).message_id}`);
        } else if (distriEvent.type === 'text_message_content') {
          const data = distriEvent.data as any;
          console.log(`   📝 Content delta: "${data.delta}" (${data.delta?.length} chars)`);
        } else if (distriEvent.type === 'text_message_end') {
          console.log(`   🏁 Finished streaming message: ${(distriEvent.data as any).message_id}`);
        } else if (distriEvent.type === 'tool_calls') {
          const data = distriEvent.data as any;
          console.log(`   🔧 Tool calls: ${data.tool_calls?.length} tools`);
          data.tool_calls?.forEach((tool: any, i: number) => {
            console.log(`      ${i + 1}. ${tool.tool_name} (${tool.tool_call_id})`);
          });
        } else if (distriEvent.type === 'tool_results') {
          const data = distriEvent.data as any;
          console.log(`   ✅ Tool results: ${data.results?.length} results`);
          data.results?.forEach((result: any, i: number) => {
            console.log(`      ${i + 1}. ${result.tool_name}: ${result.success ? 'success' : 'failed'}`);
          });
        }
      } else if (isDistriMessage(event)) {
        const distriMessage = event;
        if (logMessages) {
          const textContent = distriMessage.parts
            ?.filter(p => p.type === 'text')
            ?.map(p => p.text)
            ?.join(' ') || '';
          
          console.log(`   💬 Message: ${distriMessage.role} - "${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}"`);
        }
      }

      // Call custom event handler
      onEvent?.(event, eventCount);
    }

    const totalTime = Date.now() - startTime;
    
    if (logTiming) {
      console.log(`\n⏱️  Stream completed in ${totalTime}ms`);
      console.log(`📊 Total events: ${eventCount}`);
    }

    // Analyze the events
    const analysis = analyzeEvents(events);
    console.log('\n📈 Event Analysis:');
    console.log('   Event types:', analysis.eventTypes);
    console.log('   Messages:', analysis.messageCount);
    console.log('   Streaming events:', analysis.streamingEvents);
    console.log('   Tool events:', analysis.toolEvents);

    if (analysis.issues.length > 0) {
      console.log('\n⚠️  Potential issues:');
      analysis.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    return {
      events,
      eventCount,
      totalTime,
      analysis
    };

  } catch (error) {
    console.error('❌ Stream debug failed:', error);
    throw error;
  }
}

function analyzeEvents(events: DistriChatMessage[]) {
  const eventTypes: Record<string, number> = {};
  let messageCount = 0;
  const streamingEvents: any[] = [];
  const toolEvents: any[] = [];
  const issues: string[] = [];

  // Track streaming message IDs
  const streamingMessages = new Map<string, { start?: boolean, content: number, end?: boolean }>();

  events.forEach(event => {
    if (isDistriEvent(event)) {
      const type = event.type;
      eventTypes[type] = (eventTypes[type] || 0) + 1;

      // Track streaming events
      if (type.startsWith('text_message_')) {
        streamingEvents.push(event);
        
        const messageId = (event.data as any).message_id;
        if (!streamingMessages.has(messageId)) {
          streamingMessages.set(messageId, { content: 0 });
        }
        
        const msgData = streamingMessages.get(messageId)!;
        if (type === 'text_message_start') {
          msgData.start = true;
        } else if (type === 'text_message_content') {
          msgData.content++;
        } else if (type === 'text_message_end') {
          msgData.end = true;
        }
      }

      // Track tool events
      if (type.includes('tool')) {
        toolEvents.push(event);
      }
    } else if (isDistriMessage(event)) {
      messageCount++;
    }
  });

  // Check for streaming issues
  streamingMessages.forEach((data, messageId) => {
    if (data.start && !data.end) {
      issues.push(`Streaming message ${messageId} started but never ended`);
    }
    if (!data.start && data.content > 0) {
      issues.push(`Streaming message ${messageId} has content but no start event`);
    }
    if (data.content === 0 && data.start) {
      issues.push(`Streaming message ${messageId} started but has no content events`);
    }
  });

  return {
    eventTypes,
    messageCount,
    streamingEvents: streamingEvents.length,
    toolEvents: toolEvents.length,
    streamingMessages: Object.fromEntries(streamingMessages),
    issues
  };
}

// Simple debug function for quick testing
export async function quickDebugMessage(agent: Agent, message: string) {
  return debugStreamEvents(agent, message, {
    logEvents: true,
    logMessages: true,
    logTiming: true
  });
}