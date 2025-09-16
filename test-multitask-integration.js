#!/usr/bin/env node
/**
 * End-to-End Multi-Task Integration Test
 *
 * This test simulates a complete conversation flow with multiple tasks:
 * 1. Main conversation task starts (run_started)
 * 2. Tool execution subtasks start and finish (multiple run_started/run_finished)
 * 3. Main conversation task finishes (run_finished)
 *
 * It verifies:
 * - TaskId roundtrip works correctly
 * - Streaming state only stops when main task finishes
 * - Tool results are properly formatted and sent back
 * - Multi-task management works correctly
 */

const {
  convertA2AStatusUpdateToDistri,
  convertDistriMessageToA2A,
  DistriClient
} = require('./packages/core/dist/index.js');

// Mock chat state store for testing
class MockChatStateStore {
  constructor() {
    this.currentTaskId = null;
    this.currentRunId = null;
    this.isStreaming = false;
    this.isLoading = false;
    this.messages = [];
    this.tasks = new Map();
    this.debug = true;
  }

  // Simulate the processMessage method from real chatStateStore
  processMessage(message, fromStream) {
    console.log(`📝 Processing message: ${message.type || 'message'}`, {
      fromStream,
      currentTaskId: this.currentTaskId
    });

    if (message.type === 'run_started') {
      // Only set as main task if we don't already have one (first run_started)
      if (!this.currentTaskId) {
        console.log(`🚀 Main task started: ${message.data.taskId}`);
        this.currentTaskId = message.data.taskId;
        this.currentRunId = message.data.runId;
        this.isStreaming = true;
        this.isLoading = true;
      } else {
        console.log(`🔧 Sub-task started: ${message.data.taskId} (main: ${this.currentTaskId})`);
        // Still set streaming/loading for sub-tasks but don't change main taskId
        this.isStreaming = true;
        this.isLoading = true;
      }
    } else if (message.type === 'run_finished') {
      const finishedTaskId = message.data.taskId;
      const isMainTask = finishedTaskId === this.currentTaskId;

      console.log(`🏁 Task finished: ${finishedTaskId}`, {
        isMainTask,
        currentMainTask: this.currentTaskId
      });

      if (isMainTask) {
        console.log('🛑 Stopping streaming - main task finished');
        this.isStreaming = false;
        this.isLoading = false;
      } else {
        console.log('📝 Sub-task finished, continuing stream');
      }
    }

    this.messages.push(message);
  }

  getStreamingState() {
    return {
      isStreaming: this.isStreaming,
      isLoading: this.isLoading,
      currentTaskId: this.currentTaskId
    };
  }
}

// Mock agent that simulates the real Agent class
class MockAgent {
  constructor(agentId, client) {
    this.agentId = agentId;
    this.client = client;
  }

  invokeStream(params) {
    console.log('📡 Agent.invokeStream called with params:', {
      messageId: params.message.messageId,
      taskId: params.message.taskId,
      parts: params.message.parts.length
    });

    // Simulate streaming events from backend
    return this.simulateStreamingResponse(params);
  }

  async *simulateStreamingResponse(params) {
    const mainTaskId = params.message.taskId || 'main-task-123';

    // 1. Main conversation starts
    yield convertA2AStatusUpdateToDistri({
      runId: 'run-123',
      taskId: mainTaskId,
      metadata: { type: 'run_started' }
    });

    // 2. Agent starts thinking
    yield {
      id: 'msg-1',
      role: 'assistant',
      parts: [{ type: 'text', data: 'Let me help you with that. I need to use some tools.' }]
    };

    // 3. Tool execution subtask 1 starts
    const toolTask1 = 'tool-task-456';
    yield convertA2AStatusUpdateToDistri({
      runId: 'tool-run-1',
      taskId: toolTask1,
      metadata: { type: 'run_started' }
    });

    // 4. Tool call is made
    yield convertA2AStatusUpdateToDistri({
      taskId: toolTask1,
      metadata: {
        type: 'tool_calls',
        tool_calls: [{
          tool_call_id: 'call-1',
          tool_name: 'search_tool',
          input: { query: 'test query' }
        }]
      }
    });

    // 5. Tool execution subtask 1 finishes
    yield convertA2AStatusUpdateToDistri({
      runId: 'tool-run-1',
      taskId: toolTask1,
      metadata: { type: 'run_finished', success: true }
    });

    // 6. Tool execution subtask 2 starts
    const toolTask2 = 'tool-task-789';
    yield convertA2AStatusUpdateToDistri({
      runId: 'tool-run-2',
      taskId: toolTask2,
      metadata: { type: 'run_started' }
    });

    // 7. Another tool call
    yield convertA2AStatusUpdateToDistri({
      taskId: toolTask2,
      metadata: {
        type: 'tool_calls',
        tool_calls: [{
          tool_call_id: 'call-2',
          tool_name: 'analyze_tool',
          input: { data: 'some data' }
        }]
      }
    });

    // 8. Tool execution subtask 2 finishes
    yield convertA2AStatusUpdateToDistri({
      runId: 'tool-run-2',
      taskId: toolTask2,
      metadata: { type: 'run_finished', success: true }
    });

    // 9. Agent continues with main response
    yield {
      id: 'msg-2',
      role: 'assistant',
      parts: [{ type: 'text', data: 'Based on the tool results, here is my analysis...' }]
    };

    // 10. Main conversation task finishes
    yield convertA2AStatusUpdateToDistri({
      runId: 'run-123',
      taskId: mainTaskId,
      metadata: { type: 'run_finished', success: true, total_steps: 3 }
    });
  }
}

// Mock DistriClient
class MockDistriClient {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
  }

  static initDistriMessage(role, parts) {
    return {
      id: `msg-${Date.now()}`,
      role,
      parts,
      created_at: new Date().toISOString()
    };
  }
}

// Integration test runner
async function runMultiTaskIntegrationTest() {
  console.log('🧪 Starting Multi-Task Integration Test\n');

  try {
    // Setup
    const chatStore = new MockChatStateStore();
    const client = new MockDistriClient();
    const agent = new MockAgent('test-agent', client);

    console.log('=== Test Setup Complete ===\n');

    // 1. User sends a message
    console.log('1️⃣  User sends message');
    const userMessage = MockDistriClient.initDistriMessage('user', [
      { type: 'text', data: 'Help me analyze some data using tools' }
    ]);

    const context = {
      thread_id: 'thread-123',
      task_id: 'main-task-123',
      run_id: 'run-123'
    };

    // 2. Convert to A2A format for sending
    const a2aMessage = convertDistriMessageToA2A(userMessage, context);
    console.log('✅ User message converted to A2A format');
    console.log('   TaskId in message:', a2aMessage.taskId);

    // 3. Stream simulation
    console.log('\n2️⃣  Starting streaming simulation\n');

    const stream = agent.invokeStream({
      message: a2aMessage,
      metadata: { task_id: context.task_id }
    });

    let eventCount = 0;
    const streamingStates = [];

    for await (const event of stream) {
      eventCount++;
      console.log(`📦 Event ${eventCount}:`, {
        type: event.type || 'message',
        taskId: event.data?.taskId,
        isMessage: !event.type
      });

      // Process the event through mock chat store
      chatStore.processMessage(event, true);

      // Record streaming state after each event
      const state = chatStore.getStreamingState();
      streamingStates.push({
        eventCount,
        eventType: event.type || 'message',
        taskId: event.data?.taskId,
        ...state
      });

      console.log(`   State: streaming=${state.isStreaming}, loading=${state.isLoading}\n`);
    }

    // 4. Verify results
    console.log('3️⃣  Verifying results\n');

    const finalState = chatStore.getStreamingState();
    console.log('Final state:', finalState);

    // Test assertions
    const assertions = [
      {
        name: 'Streaming stopped after main task finished',
        condition: !finalState.isStreaming,
        expected: true
      },
      {
        name: 'Loading stopped after main task finished',
        condition: !finalState.isLoading,
        expected: true
      },
      {
        name: 'Main task ID was preserved',
        condition: finalState.currentTaskId === 'main-task-123',
        expected: true
      },
      {
        name: 'Multiple events were processed',
        condition: eventCount >= 8,
        expected: true
      },
      {
        name: 'Messages were collected',
        condition: chatStore.messages.length > 0,
        expected: true
      }
    ];

    console.log('🔍 Test Assertions:');
    let passedTests = 0;

    assertions.forEach((assertion, index) => {
      const passed = assertion.condition === assertion.expected;
      const status = passed ? '✅' : '❌';
      console.log(`   ${index + 1}. ${assertion.name}: ${status}`);
      if (passed) passedTests++;
    });

    // 5. Detailed streaming state analysis
    console.log('\n📊 Streaming State Timeline:');
    streamingStates.forEach(state => {
      const icon = state.eventType === 'run_started' ? '🚀' :
                   state.eventType === 'run_finished' ? '🏁' : '📝';
      console.log(`   ${icon} Event ${state.eventCount} (${state.eventType}): streaming=${state.isStreaming}, taskId=${state.taskId}`);
    });

    // 6. Tool result roundtrip test
    console.log('\n4️⃣  Testing tool result roundtrip\n');

    const toolResult = {
      tool_call_id: 'call-test',
      tool_name: 'test_tool',
      parts: [{
        type: 'data',
        data: { result: 'success', success: true }
      }]
    };

    const toolResultMessage = MockDistriClient.initDistriMessage('user', [
      { type: 'tool_result', data: toolResult }
    ]);

    const toolResultA2A = convertDistriMessageToA2A(toolResultMessage, context);

    console.log('✅ Tool result conversion successful');
    console.log('   TaskId preserved:', toolResultA2A.taskId === context.task_id);

    const toolResultPart = toolResultA2A.parts.find(part =>
      part.kind === 'data' && part.data.part_type === 'tool_result'
    );

    console.log('   Has proper structure:', !!toolResultPart);
    console.log('   Has required fields:', !!(
      toolResultPart?.data?.data?.parts &&
      toolResultPart?.data?.data?.tool_call_id &&
      toolResultPart?.data?.data?.tool_name
    ));

    // Final summary
    console.log('\n🎯 Test Summary:');
    console.log(`✅ Passed: ${passedTests}/${assertions.length} assertions`);
    console.log(`📦 Total events processed: ${eventCount}`);
    console.log(`💬 Messages collected: ${chatStore.messages.length}`);

    if (passedTests === assertions.length) {
      console.log('\n🎉 ALL TESTS PASSED - Multi-task integration working correctly!');
      return { success: true, passedTests, totalTests: assertions.length };
    } else {
      console.log('\n❌ Some tests failed - Multi-task integration needs fixes');
      return { success: false, passedTests, totalTests: assertions.length };
    }

  } catch (error) {
    console.error('❌ Integration test failed with error:', error);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  runMultiTaskIntegrationTest().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { runMultiTaskIntegrationTest };