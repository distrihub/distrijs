// Test plan rendering with the new structure
const { processA2AStreamData } = require('./packages/core/dist/index.js');
const fs = require('fs');

// Load the test plan
const planData = JSON.parse(fs.readFileSync('./fixtures/test_plan.json', 'utf8'));

console.log('Testing Plan Rendering:');
console.log('Plan:', JSON.stringify(planData, null, 2));

// Simulate how the plan would come through as an artifact
const planArtifact = {
  artifactId: planData.id,
  parts: [{
    kind: "data",
    data: planData
  }],
  name: "Test Plan",
  description: "Test plan for rendering"
};

// Process through the converter
const { convertA2AArtifactToDistri } = require('./packages/core/dist/index.js');
const converted = convertA2AArtifactToDistri(planArtifact);

console.log('\nConverted Plan:');
console.log(JSON.stringify(converted, null, 2));

// Test the step types
if (converted && converted.steps) {
  console.log('\nStep Analysis:');
  converted.steps.forEach((step, index) => {
    console.log(`Step ${index + 1}:`, {
      id: step.id,
      type: step.type,
      hasAction: step.action ? true : false,
      actionToolName: step.action?.tool_name,
      message: step.message?.substring(0, 50) + (step.message?.length > 50 ? '...' : '')
    });
  });
} else {
  console.log('No steps found in converted plan');
}