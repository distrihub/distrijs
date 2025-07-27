import React from 'react';
import { Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Agent {
  id: string;
  name: string;
  description?: string;
}

interface AgentSelectProps {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentSelect: (agentId: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = '',
  placeholder = 'Select an agent...',
  disabled = false,
}) => {
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  return (
    <Select value={selectedAgentId} onValueChange={onAgentSelect} disabled={disabled}>
      <SelectTrigger className={`w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4" />
          <SelectValue placeholder={placeholder}>
            {selectedAgent?.name || placeholder}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{agent.name}</span>
                {agent.description && (
                  <span className="text-xs text-muted-foreground">
                    {agent.description}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}; 