import { DistriEvent, DistriMessage, DistriArtifact, isDistriEvent, isDistriMessage, isDistriArtifact } from '@distri/core';
import { decodeA2AStreamEvent, processA2AStreamData, processA2AMessagesData } from '@distri/core';
import { useChatStateStore } from '../stores/chatStateStore';

// Helper to load fixture data
export async function loadFixtureData() {
  try {
    const messagesResponse = await fetch('/fixtures/messages.json');
    const streamResponse = await fetch('/fixtures/stream.json');

    const messagesData = await messagesResponse.json();
    const streamData = await streamResponse.json();

    return { messagesData, streamData };
  } catch (error) {
    console.error('Failed to load fixture data:', error);
    return { messagesData: [], streamData: [] };
  }
}

// Test Zustand state representation after processing events
export function testZustandStateRepresentation(events: (DistriChatMessage)[]) {
  console.log('=== Testing Zustand State Representation ===');

  const store = useChatStateStore.getState();
  store.clearAllStates();

  const stateSnapshots: Array<{
    eventIndex: number;
    event: DistriChatMessage;
    state: {
      tasks: any[];
      plans: any[];
      toolCalls: any[];
      currentTaskId?: string;
      currentPlanId?: string;
    };
  }> = [];

  events.forEach((event, index) => {
    const eventType = isDistriEvent(event) ? event.type : isDistriMessage(event) ? 'message' : isDistriArtifact(event) ? event.type : 'unknown';
    console.log(`\nProcessing event ${index + 1}:`, eventType);

    // Process message through Zustand store
    store.processMessage(event);

    // Take snapshot of current state
    const currentState = useChatStateStore.getState();
    stateSnapshots.push({
      eventIndex: index,
      event,
      state: {
        tasks: Array.from(currentState.tasks.values()),
        plans: Array.from(currentState.plans.values()),
        toolCalls: Array.from(currentState.toolCalls.values()),
        currentTaskId: currentState.currentTaskId,
        currentPlanId: currentState.currentPlanId,
      },
    });
  });

  return stateSnapshots;
}

// Test cases based on expected Zustand state structure
export function runZustandStateTests() {
  console.log('=== Running Zustand State Tests ===');

  // Test Case 1: After run_started event
  const testCase1 = (snapshots: any[]) => {
    const runStartedSnapshot = snapshots.find(s =>
      isDistriEvent(s.event) && s.event.type === 'run_started'
    );

    if (runStartedSnapshot) {
      console.log('\nTest Case 1: After run_started event');
      console.log('Expected State Structure:');
      console.log('- 1 task with status: "running"');
      console.log('- currentTaskId should be set');
      console.log('- plans: []');
      console.log('- toolCalls: []');

      console.log('\nActual State:');
      console.log('- Tasks:', runStartedSnapshot.state.tasks);
      console.log('- Current Task ID:', runStartedSnapshot.state.currentTaskId);
      console.log('- Plans:', runStartedSnapshot.state.plans);
      console.log('- Tool Calls:', runStartedSnapshot.state.toolCalls);

      const task = runStartedSnapshot.state.tasks[0];
      return {
        hasTask: runStartedSnapshot.state.tasks.length === 1,
        taskStatus: task?.status === 'running',
        hasCurrentTaskId: !!runStartedSnapshot.state.currentTaskId,
        noPlans: runStartedSnapshot.state.plans.length === 0,
        noToolCalls: runStartedSnapshot.state.toolCalls.length === 0,
        task: task,
      };
    }
    return null;
  };

  // Test Case 2: After plan_started event
  const testCase2 = (snapshots: any[]) => {
    const planStartedSnapshot = snapshots.find(s =>
      isDistriEvent(s.event) && s.event.type === 'plan_started'
    );

    if (planStartedSnapshot) {
      console.log('\nTest Case 2: After plan_started event');
      console.log('Expected State Structure:');
      console.log('- 1 task with status: "running"');
      console.log('- 1 plan with status: "running"');
      console.log('- currentTaskId should be set');
      console.log('- currentPlanId should be set');

      console.log('\nActual State:');
      console.log('- Tasks:', planStartedSnapshot.state.tasks);
      console.log('- Plans:', planStartedSnapshot.state.plans);
      console.log('- Current Task ID:', planStartedSnapshot.state.currentTaskId);
      console.log('- Current Plan ID:', planStartedSnapshot.state.currentPlanId);

      return {
        hasTask: planStartedSnapshot.state.tasks.length === 1,
        hasPlan: planStartedSnapshot.state.plans.length === 1,
        hasCurrentTaskId: !!planStartedSnapshot.state.currentTaskId,
        hasCurrentPlanId: !!planStartedSnapshot.state.currentPlanId,
      };
    }
    return null;
  };

  // Test Case 3: After tool_call_start event
  const testCase3 = (snapshots: any[]) => {
    const toolCallStartedSnapshot = snapshots.find(s =>
      isDistriEvent(s.event) && s.event.type === 'tool_call_start'
    );

    if (toolCallStartedSnapshot) {
      console.log('\nTest Case 3: After tool_call_start event');
      console.log('Expected State Structure:');
      console.log('- Multiple tasks (main task + tool call task)');
      console.log('- At least one task with status: "running"');

      console.log('\nActual State:');
      console.log('- Tasks:', toolCallStartedSnapshot.state.tasks);
      console.log('- Tool Calls:', toolCallStartedSnapshot.state.toolCalls);

      const runningTasks = toolCallStartedSnapshot.state.tasks.filter((t: any) => t.status === 'running');
      return {
        hasTask: toolCallStartedSnapshot.state.tasks.length >= 1,
        hasRunningTask: runningTasks.length >= 1,
        tasks: toolCallStartedSnapshot.state.tasks,
      };
    }
    return null;
  };

  // Test Case 4: After llm_response artifact
  const testCase4 = (snapshots: any[]) => {
    const llmResponseSnapshot = snapshots.find(s =>
      isDistriArtifact(s.event) && s.event.type === 'llm_response'
    );

    if (llmResponseSnapshot) {
      console.log('\nTest Case 4: After llm_response artifact');
      console.log('Expected State Structure:');
      console.log('- Task should have toolCalls array');
      console.log('- Task status should be "completed" or "failed"');
      console.log('- Task should have success/rejected info');

      console.log('\nActual State:');
      console.log('- Tasks:', llmResponseSnapshot.state.tasks);

      const task = llmResponseSnapshot.state.tasks[0];
      return {
        hasTask: llmResponseSnapshot.state.tasks.length > 0,
        hasToolCalls: task?.toolCalls && task.toolCalls.length > 0,
        taskStatus: task?.status === 'completed' || task?.status === 'failed',
        task: task,
      };
    }
    return null;
  };

  // Test Case 5: After tool_results artifact
  const testCase5 = (snapshots: any[]) => {
    const toolResultsSnapshot = snapshots.find(s =>
      isDistriArtifact(s.event) && s.event.type === 'tool_results'
    );

    if (toolResultsSnapshot) {
      console.log('\nTest Case 5: After tool_results artifact');
      console.log('Expected State Structure:');
      console.log('- Task should have results array');
      console.log('- Task status should be "completed" or "failed"');
      console.log('- Task should have success/rejected info');

      console.log('\nActual State:');
      console.log('- Tasks:', toolResultsSnapshot.state.tasks);

      const task = toolResultsSnapshot.state.tasks[0];
      return {
        hasTask: toolResultsSnapshot.state.tasks.length > 0,
        hasResults: task?.results && task.results.length > 0,
        taskStatus: task?.status === 'completed' || task?.status === 'failed',
        task: task,
      };
    }
    return null;
  };

  return {
    testCase1,
    testCase2,
    testCase3,
    testCase4,
    testCase5
  };
}

// Main test function
export async function runFullZustandTest() {
  console.log('=== Running Full Zustand State Test ===');

  try {
    // Load fixture data
    const { messagesData, streamData } = await loadFixtureData();
    console.log('Loaded fixtures:', {
      messagesCount: messagesData.length,
      streamCount: streamData.length
    });

    // Process messages
    const processedMessages = processA2AMessagesData(messagesData);
    const processedStream = processA2AStreamData(streamData);

    console.log('Processed:', {
      messages: processedMessages.length,
      stream: processedStream.length
    });

    // Combine all events
    const allEvents = [...processedMessages, ...processedStream];

    // Test Zustand state representation
    const snapshots = testZustandStateRepresentation(allEvents);

    // Run state tests
    const testCases = runZustandStateTests();
    const results = {
      testCase1: testCases.testCase1(snapshots),
      testCase2: testCases.testCase2(snapshots),
      testCase3: testCases.testCase3(snapshots),
      testCase4: testCases.testCase4(snapshots),
      testCase5: testCases.testCase5(snapshots),
    };

    console.log('\n=== Final State Summary ===');
    const finalSnapshot = snapshots[snapshots.length - 1];
    console.log('Total Events Processed:', snapshots.length);
    console.log('Final Tasks:', finalSnapshot.state.tasks.length);
    console.log('Final Plans:', finalSnapshot.state.plans.length);
    console.log('Current Task ID:', finalSnapshot.state.currentTaskId);
    console.log('Current Plan ID:', finalSnapshot.state.currentPlanId);

    return {
      snapshots,
      results,
      finalState: finalSnapshot.state,
      totalEvents: allEvents.length,
      processedMessages: processedMessages.length,
      processedStream: processedStream.length,
    };

  } catch (error) {
    console.error('Test failed:', error);
    return null;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  (window as any).runFullZustandTest = runFullZustandTest;
  (window as any).testZustandStateRepresentation = testZustandStateRepresentation;
  (window as any).loadFixtureData = loadFixtureData;

  // Simple test function for browser console
  (window as any).testZustandStore = async () => {
    console.log('=== Testing Zustand Store ===');

    try {
      const { messagesData, streamData } = await loadFixtureData();
      console.log('Loaded fixtures:', {
        messagesCount: messagesData.length,
        streamCount: streamData.length
      });

      // Process messages
      const processedMessages = processA2AMessagesData(messagesData);
      const processedStream = processA2AStreamData(streamData);

      console.log('Processed:', {
        messages: processedMessages.length,
        stream: processedStream.length
      });

      // Test Zustand store
      const store = useChatStateStore.getState();
      store.clearAllStates();

      // Process first 10 events
      const testEvents = [...processedMessages, ...processedStream].slice(0, 10);
      testEvents.forEach((event, index) => {
        console.log(`Processing event ${index + 1}:`, event);
        store.processMessage(event);
      });

      // Check final state
      const finalState = useChatStateStore.getState();
      console.log('Final Zustand State:');
      console.log('Tasks:', Array.from(finalState.tasks.values()));
      console.log('Plans:', Array.from(finalState.plans.values()));
      console.log('Tool Calls:', Array.from(finalState.toolCalls.values()));

      return {
        tasks: Array.from(finalState.tasks.values()),
        plans: Array.from(finalState.plans.values()),
        toolCalls: Array.from(finalState.toolCalls.values()),
      };

    } catch (error) {
      console.error('Test failed:', error);
      return null;
    }
  };

  // Example: Test specific state scenarios
  (window as any).testStateScenarios = async () => {
    console.log('=== Testing State Scenarios ===');

    try {
      const { messagesData, streamData } = await loadFixtureData();
      const processedMessages = processA2AMessagesData(messagesData);
      const processedStream = processA2AStreamData(streamData);
      const allEvents = [...processedMessages, ...processedStream];

      // Test different scenarios
      const scenarios = [
        {
          name: 'Run Started',
          events: allEvents.slice(0, 3), // First 3 events
          expectedState: {
            tasks: 1,
            plans: 0,
            toolCalls: 0,
            hasCurrentTask: true
          }
        },
        {
          name: 'Plan Started',
          events: allEvents.slice(0, 5), // First 5 events
          expectedState: {
            tasks: 1,
            plans: 1,
            toolCalls: 0,
            hasCurrentTask: true,
            hasCurrentPlan: true
          }
        },
        {
          name: 'Tool Call Started',
          events: allEvents.slice(0, 8), // First 8 events
          expectedState: {
            tasks: 1,
            plans: 1,
            toolCalls: 1,
            hasCurrentTask: true,
            hasCurrentPlan: true
          }
        }
      ];

      const results = [];

      for (const scenario of scenarios) {
        console.log(`\n--- Testing Scenario: ${scenario.name} ---`);

        const store = useChatStateStore.getState();
        store.clearAllStates();

        // Process events for this scenario
        scenario.events.forEach((event, index) => {
          console.log(`  Event ${index + 1}:`, isDistriEvent(event) ? event.type : 'message');
          store.processMessage(event);
        });

        // Check final state
        const finalState = useChatStateStore.getState();
        const actualState = {
          tasks: finalState.tasks.size,
          plans: finalState.plans.size,
          toolCalls: finalState.toolCalls.size,
          hasCurrentTask: !!finalState.currentTaskId,
          hasCurrentPlan: !!finalState.currentPlanId
        };

        console.log('Expected State:', scenario.expectedState);
        console.log('Actual State:', actualState);

        const passed = Object.keys(scenario.expectedState).every(key =>
          actualState[key as keyof typeof actualState] === scenario.expectedState[key as keyof typeof scenario.expectedState]
        );

        results.push({
          scenario: scenario.name,
          passed,
          expected: scenario.expectedState,
          actual: actualState,
          state: {
            tasks: Array.from(finalState.tasks.values()),
            plans: Array.from(finalState.plans.values()),
            toolCalls: Array.from(finalState.toolCalls.values())
          }
        });
      }

      console.log('\n=== Scenario Results ===');
      results.forEach(result => {
        console.log(`${result.scenario}: ${result.passed ? 'PASS' : 'FAIL'}`);
      });

      return results;

    } catch (error) {
      console.error('Test failed:', error);
      return null;
    }
  };
}