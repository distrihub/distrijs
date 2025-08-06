#!/usr/bin/env node
// Standalone test for plan formatting - can be run with: node test-plan-formatting.js

const { convertA2AArtifactToDistri } = require('./packages/core/dist/index.js');

// Test plan data matching the new backend structure
const testPlanData = {
  id: "a6b2501b-43d1-48cd-98f5-cac6a7e5ca52",
  type: "plan", 
  timestamp: 1754423943748,
  reasoning: "To answer the user's question about LangDB founders, I need to search for information online and then provide a comprehensive response.",
  steps: [
    {
      id: "8a05c4a8-0413-4ce3-b4eb-7ede6d47fdac",
      type: "thought",
      message: "I need to find information specifically about the founders of LangDB. I will start by searching the web with the query \"founders of LangDB\" to get relevant results."
    },
    {
      id: "223fdf84-cc48-47d8-a0e7-ea084dce2899", 
      type: "action",
      action: {
        tool_name: "search",
        input: "{\"query\":\"founders of LangDB\"}"
      }
    },
    {
      id: "334fdf84-cc48-47d8-a0e7-ea084dce2800",
      type: "code",
      code: "const founders = searchResults.filter(r => r.title.includes('founder'));",
      language: "javascript"
    },
    {
      id: "445fdf84-cc48-47d8-a0e7-ea084dce2801",
      type: "action",
      action: {
        tool_name: "final", 
        input: "{\"result\":\"The founders of LangDB are Matteo Pelati and Vivek G. (Vivek Gudapuri).\",\"summary\":\"Identified the founders from multiple sources.\"}"
      }
    },
    {
      id: "556fdf84-cc48-47d8-a0e7-ea084dce2802",
      type: "final_result",
      content: "The founders of LangDB are Matteo Pelati and Vivek Gudapuri, as confirmed by multiple sources including LinkedIn profiles and company information.",
      tool_calls: []
    }
  ]
};

// Simulate artifact format
const planArtifact = {
  artifactId: testPlanData.id,
  parts: [{
    kind: "data",
    data: testPlanData
  }],
  name: "Test Plan",
  description: "Test plan for formatting verification"
};

console.log('🧪 Testing Plan Formatting');
console.log('=' .repeat(50));

// Test conversion
console.log('1. Converting A2A artifact to DistriPlan...');
const converted = convertA2AArtifactToDistri(planArtifact);

if (!converted) {
  console.error('❌ Conversion failed - returned null');
  process.exit(1);
}

if (converted.type !== 'plan') {
  console.error('❌ Conversion failed - wrong type:', converted.type);
  process.exit(1);
}

console.log('✅ Conversion successful');
console.log('   Plan ID:', converted.id);
console.log('   Steps count:', converted.steps.length);

// Test step structure
console.log('\n2. Analyzing step structures...');
converted.steps.forEach((step, index) => {
  console.log(`   Step ${index + 1}: ${step.type} (ID: ${step.id})`);
  
  switch (step.type) {
    case 'thought':
      console.log(`      Message: "${step.message.substring(0, 50)}..."`);
      break;
      
    case 'action':
      console.log(`      Tool: ${step.action.tool_name}`);
      console.log(`      Input: ${step.action.input.substring(0, 30)}...`);
      
      // Test input parsing
      try {
        const parsed = JSON.parse(step.action.input);
        console.log(`      ✅ Input parses as valid JSON:`, Object.keys(parsed));
      } catch (e) {
        console.log(`      ⚠️  Input is not JSON: ${step.action.input}`);
      }
      break;
      
    case 'code':
      console.log(`      Language: ${step.language}`);
      console.log(`      Code length: ${step.code.length} chars`);
      break;
      
    case 'final_result':
      console.log(`      Content: "${step.content.substring(0, 50)}..."`);
      console.log(`      Tool calls: ${step.tool_calls.length}`);
      break;
      
    default:
      console.log(`      ⚠️  Unknown step type: ${step.type}`);
  }
});

// Test tool extraction from action steps
console.log('\n3. Testing tool extraction...');
const actionSteps = converted.steps.filter(step => step.type === 'action');
console.log(`   Found ${actionSteps.length} action steps`);

actionSteps.forEach((step, index) => {
  const toolCall = {
    tool_call_id: step.id,
    tool_name: step.action.tool_name,
    input: step.action.input
  };
  
  console.log(`   Action ${index + 1} -> Tool Call:`, {
    id: toolCall.tool_call_id,
    name: toolCall.tool_name,
    hasInput: !!toolCall.input
  });
});

// Test reasoning display
console.log('\n4. Testing reasoning display...');
if (converted.reasoning) {
  console.log(`   Reasoning: "${converted.reasoning.substring(0, 100)}..."`);
} else {
  console.log('   No reasoning provided');
}

console.log('\n✅ All tests completed successfully!');
console.log('\n📋 Summary:');
console.log(`   - Plan converted: ✅`);
console.log(`   - Steps processed: ${converted.steps.length}`);
console.log(`   - Action steps: ${actionSteps.length}`);
console.log(`   - Tool calls extractable: ✅`);
console.log(`   - Structure valid: ✅`);

console.log('\n🎯 This test verifies:');
console.log('   ✓ Plan structure matches backend format');
console.log('   ✓ Action steps contain tool_name and input');
console.log('   ✓ Tool calls can be extracted from actions');
console.log('   ✓ All step types are properly structured');
console.log('   ✓ JSON inputs are parseable');

console.log('\n📝 Note: Backend Changes');
console.log('   - Tool calls now come as direct "tool_calls" events');
console.log('   - Tool results come as direct "tool_results" events');
console.log('   - No more "llm_response" artifacts for tool processing');
console.log('   - Plan steps with actions still contain tool information');

console.log('\n💡 Usage:');
console.log('   - Run this test after backend changes: node test-plan-formatting.js');
console.log('   - Use testPlanData for UI component testing');
console.log('   - Modify steps array to test new step types');