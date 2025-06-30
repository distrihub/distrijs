import { Task, Message as A2AMessage, MessageSendParams } from '@distri/core';
export interface UseTaskOptions {
    agentId: string;
    autoSubscribe?: boolean;
}
export interface UseTaskResult {
    task: Task | null;
    loading: boolean;
    error: Error | null;
    streamingText: string;
    isStreaming: boolean;
    sendMessage: (text: string, configuration?: MessageSendParams['configuration']) => Promise<void>;
    createTask: (message: A2AMessage, configuration?: MessageSendParams['configuration']) => Promise<void>;
    getTask: (taskId: string) => Promise<void>;
    clearTask: () => void;
}
export declare function useTask({ agentId, autoSubscribe }: UseTaskOptions): UseTaskResult;
