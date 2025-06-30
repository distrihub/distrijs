// Core Distri Types

/**
 * Distri Node Configuration
 */
export interface DistriNode {
  id: string;
  name: string;
  endpoint: string;
  publicKey?: string;
  status: 'online' | 'offline' | 'connecting';
  capabilities: string[];
  metadata?: Record<string, any>;
}

/**
 * A2A Protocol Message Types
 */
export type A2AMessageType = 
  | 'handshake'
  | 'auth'
  | 'request'
  | 'response'
  | 'error'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'publish'
  | 'notification';

/**
 * Base A2A Protocol Message
 */
export interface A2AMessage<T = any> {
  id: string;
  type: A2AMessageType;
  from: string;
  to?: string;
  timestamp: number;
  data: T;
  signature?: string;
}

/**
 * A2A Request Message
 */
export interface A2ARequest extends A2AMessage {
  type: 'request';
  data: {
    method: string;
    params?: any;
    endpoint?: string;
  };
}

/**
 * A2A Response Message
 */
export interface A2AResponse extends A2AMessage {
  type: 'response';
  data: {
    result?: any;
    error?: {
      code: number;
      message: string;
      details?: any;
    };
  };
}

/**
 * Thread Types
 */
export interface Thread {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  participants: string[];
  status: 'active' | 'archived' | 'locked';
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Message Types
 */
export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  contentType: 'text' | 'markdown' | 'json' | 'file';
  timestamp: number;
  editedAt?: number;
  replyTo?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  metadata?: Record<string, any>;
}

/**
 * Attachment Type
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  hash?: string;
}

/**
 * Reaction Type
 */
export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

/**
 * User/Participant Types
 */
export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  publicKey?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: number;
  profile?: UserProfile;
}

/**
 * User Profile
 */
export interface UserProfile {
  bio?: string;
  location?: string;
  website?: string;
  social?: Record<string, string>;
  preferences?: UserPreferences;
}

/**
 * User Preferences
 */
export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

/**
 * Connection Status
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Event Types
 */
export type DistriEventType = 
  | 'connection_status_changed'
  | 'message_received'
  | 'thread_created'
  | 'thread_updated'
  | 'user_joined'
  | 'user_left'
  | 'error';

/**
 * Distri Event
 */
export interface DistriEvent<T = any> {
  type: DistriEventType;
  data: T;
  timestamp: number;
}

/**
 * Client Configuration
 */
export interface DistriClientConfig {
  node: DistriNode;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
  encryption?: {
    enabled: boolean;
    algorithm?: string;
  };
  debug?: boolean;
}

/**
 * Subscription Options
 */
export interface SubscriptionOptions {
  threadId?: string;
  userId?: string;
  eventTypes?: DistriEventType[];
  filter?: (event: DistriEvent) => boolean;
}

/**
 * Error Types
 */
export class DistriError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DistriError';
  }
}

export class A2AProtocolError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'A2A_PROTOCOL_ERROR', details);
    this.name = 'A2AProtocolError';
  }
}

export class ConnectionError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends DistriError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}