// Test case for plan formatting and rendering
// This file contains test data and utilities to verify plan step rendering

import { DistriPlan, PlanStep, ThoughtPlanStep, ActionPlanStep, CodePlanStep, FinalResultPlanStep } from '@distri/core';

// Example plan with the new structure matching backend format
export const testPlan: DistriPlan = {
  id: "a6b2501b-43d1-48cd-98f5-cac6a7e5ca52",
  type: "plan",
  timestamp: 1754423943748,
  reasoning: "To answer the user's question about LangDB founders, I need to search for information online and then provide a comprehensive response.",
  steps: [
    {
      id: "8a05c4a8-0413-4ce3-b4eb-7ede6d47fdac",
      type: "thought",
      message: "I need to find information specifically about the founders of LangDB. I will start by searching the web with the query \"founders of LangDB\" to get relevant results."
    } as ThoughtPlanStep,
    {
      id: "223fdf84-cc48-47d8-a0e7-ea084dce2899",
      type: "action",
      action: {
        tool_name: "search",
        input: "{\"query\":\"founders of LangDB\"}"
      }
    } as ActionPlanStep,
    {
      id: "334fdf84-cc48-47d8-a0e7-ea084dce2800",
      type: "code",
      code: "const founders = searchResults.filter(r => r.title.includes('founder'));",
      language: "javascript"
    } as CodePlanStep,
    {
      id: "445fdf84-cc48-47d8-a0e7-ea084dce2801",
      type: "action", 
      action: {
        tool_name: "final",
        input: "{\"result\":\"The founders of LangDB are Matteo Pelati and Vivek G. (Vivek Gudapuri).\",\"summary\":\"Identified the founders from multiple sources.\"}"
      }
    } as ActionPlanStep,
    {
      id: "556fdf84-cc48-47d8-a0e7-ea084dce2802",
      type: "final_result",
      content: "The founders of LangDB are Matteo Pelati and Vivek Gudapuri, as confirmed by multiple sources including LinkedIn profiles and company information.",
      tool_calls: []
    } as FinalResultPlanStep
  ]
};

// Test cases for different step types
export const testSteps = {
  thought: {
    id: "thought-test-1",
    type: "thought",
    message: "Let me think about this problem step by step. I need to analyze the requirements and determine the best approach."
  } as ThoughtPlanStep,
  
  action: {
    id: "action-test-1", 
    type: "action",
    action: {
      tool_name: "search",
      input: "{\"query\":\"test search query\", \"limit\": 10}"
    }
  } as ActionPlanStep,
  
  code: {
    id: "code-test-1",
    type: "code",
    code: `function processData(data) {
  return data
    .filter(item => item.active)
    .map(item => ({
      id: item.id,
      name: item.name,
      processed: true
    }));
}`,
    language: "javascript"
  } as CodePlanStep,
  
  finalResult: {
    id: "final-test-1",
    type: "final_result", 
    content: "Task completed successfully with the following results: Found 2 founders, processed 15 data points, and generated comprehensive summary.",
    tool_calls: []
  } as FinalResultPlanStep
};

// Utility function to validate plan structure
export function validatePlanStructure(plan: DistriPlan): boolean {
  if (!plan.id || !plan.type || plan.type !== 'plan') {
    console.error('Invalid plan: missing id or type');
    return false;
  }
  
  if (!Array.isArray(plan.steps)) {
    console.error('Invalid plan: steps must be an array');
    return false;
  }
  
  for (const step of plan.steps) {
    if (!step.id || !step.type) {
      console.error('Invalid step: missing id or type', step);
      return false;
    }
    
    // Validate action steps have action field with tool_name
    if (step.type === 'action') {
      const actionStep = step as ActionPlanStep;
      if (!actionStep.action || !actionStep.action.tool_name) {
        console.error('Invalid action step: missing action.tool_name', step);
        return false;
      }
    }
    
    // Validate thought steps have message
    if (step.type === 'thought') {
      const thoughtStep = step as ThoughtPlanStep;
      if (!thoughtStep.message) {
        console.error('Invalid thought step: missing message', step);
        return false;
      }
    }
    
    // Validate code steps have code and language
    if (step.type === 'code') {
      const codeStep = step as CodePlanStep;
      if (!codeStep.code || !codeStep.language) {
        console.error('Invalid code step: missing code or language', step);
        return false;
      }
    }
  }
  
  return true;
}

// Function to test action parsing
export function testActionParsing(actionStep: ActionPlanStep) {
  if (!actionStep.action) return null;
  
  let parsedInput = actionStep.action.input;
  if (typeof parsedInput === 'string') {
    try {
      parsedInput = JSON.parse(parsedInput);
    } catch (e) {
      console.warn('Failed to parse action input as JSON:', parsedInput);
    }
  }
  
  return {
    toolName: actionStep.action.tool_name,
    input: parsedInput,
    originalInput: actionStep.action.input
  };
}

// Test function for React components
export function testPlanRendering() {
  console.log('Testing Plan Structure Validation...');
  const isValid = validatePlanStructure(testPlan);
  console.log('Plan validation result:', isValid);
  
  console.log('\nTesting Individual Steps...');
  testPlan.steps.forEach((step, index) => {
    console.log(`Step ${index + 1} (${step.type}):`, {
      id: step.id,
      type: step.type,
      valid: step.id && step.type ? true : false
    });
    
    if (step.type === 'action') {
      const actionData = testActionParsing(step as ActionPlanStep);
      console.log('  Action data:', actionData);
    }
  });
  
  return testPlan;
}

// Export for external testing
export default {
  testPlan,
  testSteps,
  validatePlanStructure,
  testActionParsing,
  testPlanRendering
};