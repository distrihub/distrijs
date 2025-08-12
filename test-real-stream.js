#!/usr/bin/env node
// Test real streaming with sendMessage to see actual events

const { Agent } = require('./packages/core/dist/index.js');

console.log('🧪 Testing Real Stream Events');
console.log('=' .repeat(50));

async function testRealStreaming() {
  try {
    // Create an agent (you'll need to provide real agent configuration)
    console.log('1. Creating agent...');
    
    // Note: You'll need to replace this with actual agent configuration
    const agent = await Agent.create({
      agentIdOrDef: 'test-agent-id', // Replace with real agent ID
      // Add any other required configuration
    });
    
    console.log('✅ Agent created:', agent.id);
    
    // Set up event listener to capture all streaming events
    console.log('\n2. Setting up message listener...');
    
    const receivedEvents = [];
    
    // Mock the sendMessage process to capture events
    const originalInvokeStream = agent.invokeStream;
    agent.invokeStream = async function(options) {
      console.log('📤 Sending message:', options.message);
      
      const stream = await originalInvokeStream.call(this, options);
      
      console.log('📡 Stream created, listening for events...');
      
      // Create an async iterator that logs each event
      const loggingIterator = {
        async *[Symbol.asyncIterator]() {
          let eventCount = 0;
          for await (const event of stream) {
            eventCount++;
            console.log(`\n📥 Event ${eventCount}:`, {
              type: event.type || 'No type',
              id: event.id || 'No ID',
              role: event.role || 'No role',
              isEvent: typeof event.type === 'string' && !event.role,
              isMessage: !!event.role,
              eventData: event.type && event.data ? 'Has data' : 'No event data',
              parts: event.parts ? `${event.parts.length} parts` : 'No parts'
            });
            
            // Log event details based on type
            if (event.type) {
              console.log(`   🔍 Event details:`, event.data || event);
            }
            
            receivedEvents.push(event);
            yield event;
          }
          
          console.log(`\n📊 Total events received: ${eventCount}`);
        }
      };
      
      return loggingIterator;
    };
    
    console.log('\n3. Sending test message...');
    
    // Send a simple test message
    const testMessage = "Tell me about the founders of LangDB";
    
    // This would normally be called through useChat hook
    // We'll simulate the sendMessage process
    const stream = await agent.invokeStream({
      message: {
        messageId: 'test-msg-' + Date.now(),
        role: 'user',
        parts: [{ kind: 'text', text: testMessage }],
        kind: 'message',
        contextId: 'test-context',
        taskId: 'test-task'
      },
      metadata: {}
    });
    
    console.log('📥 Processing stream events...');
    
    for await (const event of stream) {
      // Events are already logged in the iterator above
      // Just consume them here
    }
    
    console.log('\n4. Analysis of received events:');
    console.log(`   Total events: ${receivedEvents.length}`);
    
    // Categorize events
    const eventTypes = {};
    const textStreamingEvents = [];
    const toolEvents = [];
    const messages = [];
    
    receivedEvents.forEach((event, index) => {
      if (event.type) {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
        
        if (event.type.startsWith('text_message_')) {
          textStreamingEvents.push({ index, event });
        } else if (event.type.includes('tool')) {
          toolEvents.push({ index, event });
        }
      } else if (event.role) {
        messages.push({ index, event });
      }
    });
    
    console.log('\n   Event type breakdown:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
    
    if (textStreamingEvents.length > 0) {
      console.log('\n   Text streaming events:');
      textStreamingEvents.forEach(({ index, event }) => {
        console.log(`     [${index}] ${event.type}:`, event.data);
      });
    } else {
      console.log('\n   ⚠️  No text streaming events found!');
    }
    
    if (messages.length > 0) {
      console.log('\n   Complete messages:');
      messages.forEach(({ index, event }) => {
        const text = event.parts && event.parts[0] && event.parts[0].text 
          ? event.parts[0].text.substring(0, 100) + '...'
          : 'No text content';
        console.log(`     [${index}] ${event.role}: "${text}"`);
      });
    }
    
    if (toolEvents.length > 0) {
      console.log('\n   Tool events:');
      toolEvents.forEach(({ index, event }) => {
        console.log(`     [${index}] ${event.type}:`, event.data);
      });
    }
    
    console.log('\n✅ Stream processing complete!');
    
  } catch (error) {
    console.error('❌ Error in stream test:', error.message);
    
    if (error.message.includes('agent')) {
      console.log('\n💡 To run this test:');
      console.log('   1. Update the agent configuration in this file');
      console.log('   2. Ensure you have proper credentials/API keys');
      console.log('   3. Make sure the agent exists and is accessible');
    }
    
    // Don't exit with error - just log it
    console.log('\n📝 This test shows the structure for debugging real streams');
  }
}

// Run the test
testRealStreaming().then(() => {
  console.log('\n🎯 Key debugging insights:');
  console.log('   - Check if text_message_content events are being sent');
  console.log('   - Verify message IDs match between start/content/end events'); 
  console.log('   - Look for complete messages vs streaming events');
  console.log('   - Check tool_calls and tool_results event structure');
  
  console.log('\n💡 Next steps for debugging:');
  console.log('   1. Run this with real agent config to see actual events');
  console.log('   2. Compare with expected event sequence');
  console.log('   3. Check if backend is sending streaming events correctly');
  console.log('   4. Verify event type mappings in encoder.ts');
}).catch(console.error);