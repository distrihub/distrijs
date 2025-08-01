import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAgent, FullChat } from '@distri/react';
import { DistriAgent } from '@distri/core';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function DefinitionChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<DistriAgent | null>(null);
  const [threadId, setThreadId] = useState<string>('test-chat-thread');

  // Get agent from navigation state
  useEffect(() => {
    if (location.state?.agent) {
      setSelectedAgent(location.state.agent as DistriAgent);
    }
  }, [location.state]);

  const { agent } = useAgent({ 
    agentId: selectedAgent?.id || 'default-test-agent'
  });

  const handleBack = () => {
    navigate('/definitions');
  };

  if (!selectedAgent && !agent) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Agent Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select an agent from the definitions page to start chatting
          </p>
          <Button onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Definitions
          </Button>
        </div>
      </div>
    );
  }

  const currentAgent = selectedAgent || agent;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">{currentAgent?.name || 'Test Agent'}</h1>
            {currentAgent?.description && (
              <p className="text-sm text-muted-foreground">{currentAgent.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        {currentAgent && (
          <FullChat
            agent={currentAgent}
            threadId={threadId}
            placeholder="Test your agent by typing a message..."
            showAgentSelector={false}
            theme="dark"
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}