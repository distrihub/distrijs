#!/usr/bin/env node
// Test for the new event-based tool call structure

const { convertA2AStatusUpdateToDistri } = require('./packages/core/dist/index.js');

console.log('🧪 Testing New Event-Based Tool Processing');
console.log('=' .repeat(50));

// Test tool_calls event
const toolCallsStatusUpdate = {
  kind: 'status-update',
  taskId: 'test-task-123',
  metadata: {
    type: 'tool_calls',
    tool_calls: [
      {
        tool_call_id: 'call_abc123',
        tool_name: 'search',
        input: { query: 'test search' }
      },
      {
        tool_call_id: 'call_def456',
        tool_name: 'analyze',
        input: { data: 'test data' }
      }
    ]
  }
};

// Test tool_results event  
const toolResultsStatusUpdate = {
  kind: 'status-update',
  taskId: 'test-task-123',
  metadata: {
    type: 'tool_results',
    results: [
      {
        tool_call_id: 'call_abc123',
        tool_name: 'search',
        result: { results: ['result1', 'result2'] },
        success: true
      },
      {
        tool_call_id: 'call_def456', 
        tool_name: 'analyze',
        result: { analysis: 'completed' },
        success: true
      }
    ]
  }
};

console.log('1. Testing tool_calls event conversion...');
const toolCallsEvent = convertA2AStatusUpdateToDistri(toolCallsStatusUpdate);

if (!toolCallsEvent || toolCallsEvent.type !== 'tool_calls') {
  console.error('❌ tool_calls conversion failed');
  process.exit(1);
}

console.log('✅ tool_calls event converted successfully');
console.log('   Type:', toolCallsEvent.type);
console.log('   Tool calls count:', toolCallsEvent.data.tool_calls.length);

toolCallsEvent.data.tool_calls.forEach((toolCall, index) => {
  console.log(`   Tool ${index + 1}: ${toolCall.tool_name} (ID: ${toolCall.tool_call_id})`);
  console.log(`      Input:`, toolCall.input);
});

console.log('\n2. Testing tool_results event conversion...');
const toolResultsEvent = convertA2AStatusUpdateToDistri(toolResultsStatusUpdate);

if (!toolResultsEvent || toolResultsEvent.type !== 'tool_results') {
  console.error('❌ tool_results conversion failed');
  process.exit(1);
}

console.log('✅ tool_results event converted successfully');
console.log('   Type:', toolResultsEvent.type);  
console.log('   Results count:', toolResultsEvent.data.results.length);

toolResultsEvent.data.results.forEach((result, index) => {
  console.log(`   Result ${index + 1}: ${result.tool_name} (ID: ${result.tool_call_id})`);
  console.log(`      Success: ${result.success}`);
  console.log(`      Result:`, result.result);
});

console.log('\n✅ All event processing tests completed successfully!');
console.log('\n📋 Summary:');
console.log('   - tool_calls events: ✅');
console.log('   - tool_results events: ✅'); 
console.log('   - Event structure valid: ✅');

console.log('\n🎯 New Event-Based Architecture:');
console.log('   ✓ Tool calls come as direct "tool_calls" events');
console.log('   ✓ Tool results come as direct "tool_results" events');
console.log('   ✓ No more embedding in llm_response artifacts');
console.log('   ✓ Cleaner separation of concerns');
console.log('   ✓ More efficient processing');

console.log('\n💡 Usage:');
console.log('   - Run this test to verify event processing: node test-event-processing.js');
console.log('   - Events are processed in chatStateStore.ts');
console.log('   - Tool calls are initialized immediately from events');
console.log('   - Tool results update existing tool call states');