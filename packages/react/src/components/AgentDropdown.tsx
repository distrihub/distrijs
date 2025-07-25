import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bot, Check } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description?: string;
}

interface AgentDropdownProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentSelect: (agentId: string) => void;
  className?: string;
  placeholder?: string;
}

export const AgentDropdown: React.FC<AgentDropdownProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  className = '',
  placeholder = 'Select an agent...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAgentSelect = (agentId: string) => {
    onAgentSelect(agentId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`distri-dropdown ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="distri-dropdown-trigger w-full"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="distri-avatar distri-avatar-assistant">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {selectedAgent?.name || placeholder}
            </div>
            {selectedAgent?.description && (
              <div className="text-xs text-gray-400 truncate">
                {selectedAgent.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="distri-dropdown-content">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`distri-dropdown-item ${
                agent.id === selectedAgentId ? 'selected' : ''
              }`}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="distri-avatar distri-avatar-assistant">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white truncate">
                      {agent.name}
                    </div>
                    {agent.id === selectedAgentId && (
                      <Check className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  {agent.description && (
                    <div className="text-xs text-gray-400 truncate">
                      {agent.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};