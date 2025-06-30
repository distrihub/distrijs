import { EventEmitter } from 'eventemitter3';
import { A2AClient } from './a2a-client';
import {
  DistriClientConfig,
  Thread,
  Message,
  User,
  DistriEvent,
  DistriEventType,
  ConnectionStatus,
  SubscriptionOptions
} from './types';

/**
 * Main Distri Client
 * Provides high-level API for interacting with Distri framework
 */
export class DistriClient extends EventEmitter {
  private a2aClient: A2AClient;
  private cache = {
    threads: new Map<string, Thread>(),
    messages: new Map<string, Message>(),
    users: new Map<string, User>()
  };

  constructor(config: DistriClientConfig) {
    super();
    
    this.a2aClient = new A2AClient(config.node, {
      autoConnect: config.autoConnect,
      reconnectAttempts: config.reconnectAttempts,
      reconnectDelay: config.reconnectDelay,
      heartbeatInterval: config.heartbeatInterval,
      timeout: config.timeout,
      debug: config.debug
    });

    this.setupEventHandlers();
  }

  /**
   * Connect to Distri network
   */
  async connect(): Promise<void> {
    await this.a2aClient.connect();
  }

  /**
   * Disconnect from Distri network
   */
  disconnect(): void {
    this.a2aClient.disconnect();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.a2aClient.getConnectionStatus();
  }

  // Thread Management

  /**
   * Get all threads
   */
  async getThreads(): Promise<Thread[]> {
    const threads = await this.a2aClient.request<Thread[]>('threads.list');
    
    // Update cache
    threads.forEach(thread => {
      this.cache.threads.set(thread.id, thread);
    });
    
    return threads;
  }

  /**
   * Get a specific thread by ID
   */
  async getThread(threadId: string): Promise<Thread | null> {
    try {
      const thread = await this.a2aClient.request<Thread>('threads.get', { id: threadId });
      this.cache.threads.set(thread.id, thread);
      return thread;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new thread
   */
  async createThread(data: {
    title: string;
    description?: string;
    participants?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<Thread> {
    const thread = await this.a2aClient.request<Thread>('threads.create', data);
    this.cache.threads.set(thread.id, thread);
    return thread;
  }

  /**
   * Update thread
   */
  async updateThread(threadId: string, updates: Partial<Thread>): Promise<Thread> {
    const thread = await this.a2aClient.request<Thread>('threads.update', {
      id: threadId,
      ...updates
    });
    this.cache.threads.set(thread.id, thread);
    return thread;
  }

  /**
   * Delete thread
   */
  async deleteThread(threadId: string): Promise<void> {
    await this.a2aClient.request('threads.delete', { id: threadId });
    this.cache.threads.delete(threadId);
  }

  /**
   * Join a thread
   */
  async joinThread(threadId: string): Promise<void> {
    await this.a2aClient.request('threads.join', { id: threadId });
  }

  /**
   * Leave a thread
   */
  async leaveThread(threadId: string): Promise<void> {
    await this.a2aClient.request('threads.leave', { id: threadId });
  }

  // Message Management

  /**
   * Get messages for a thread
   */
  async getMessages(threadId: string, options?: {
    limit?: number;
    offset?: number;
    before?: number;
    after?: number;
  }): Promise<Message[]> {
    const messages = await this.a2aClient.request<Message[]>('messages.list', {
      threadId,
      ...options
    });

    // Update cache
    messages.forEach(message => {
      this.cache.messages.set(message.id, message);
    });

    return messages;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<Message | null> {
    try {
      const message = await this.a2aClient.request<Message>('messages.get', { id: messageId });
      this.cache.messages.set(message.id, message);
      return message;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send a message to a thread
   */
  async sendMessage(data: {
    threadId: string;
    content: string;
    contentType?: 'text' | 'markdown' | 'json' | 'file';
    replyTo?: string;
    attachments?: any[];
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const message = await this.a2aClient.request<Message>('messages.create', data);
    this.cache.messages.set(message.id, message);
    return message;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const message = await this.a2aClient.request<Message>('messages.update', {
      id: messageId,
      content
    });
    this.cache.messages.set(message.id, message);
    return message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.a2aClient.request('messages.delete', { id: messageId });
    this.cache.messages.delete(messageId);
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    await this.a2aClient.request('messages.react', {
      id: messageId,
      emoji,
      action: 'add'
    });
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await this.a2aClient.request('messages.react', {
      id: messageId,
      emoji,
      action: 'remove'
    });
  }

  // User Management

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const user = await this.a2aClient.request<User>('users.me');
    this.cache.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const user = await this.a2aClient.request<User>('users.get', { id: userId });
      this.cache.users.set(user.id, user);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const user = await this.a2aClient.request<User>('users.update', updates);
    this.cache.users.set(user.id, user);
    return user;
  }

  /**
   * Get users in a thread
   */
  async getThreadUsers(threadId: string): Promise<User[]> {
    const users = await this.a2aClient.request<User[]>('threads.users', { id: threadId });
    
    // Update cache
    users.forEach(user => {
      this.cache.users.set(user.id, user);
    });
    
    return users;
  }

  // Subscriptions and Events

  /**
   * Subscribe to thread events
   */
  async subscribeToThread(threadId: string): Promise<void> {
    await this.a2aClient.subscribe({ threadId });
  }

  /**
   * Unsubscribe from thread events
   */
  async unsubscribeFromThread(threadId: string): Promise<void> {
    await this.a2aClient.unsubscribe({ threadId });
  }

  /**
   * Subscribe to user events
   */
  async subscribeToUser(userId: string): Promise<void> {
    await this.a2aClient.subscribe({ userId });
  }

  /**
   * Subscribe to specific event types
   */
  async subscribeToEvents(eventTypes: DistriEventType[]): Promise<void> {
    await this.a2aClient.subscribe({ eventTypes });
  }

  // Cache Management

  /**
   * Get cached thread
   */
  getCachedThread(threadId: string): Thread | undefined {
    return this.cache.threads.get(threadId);
  }

  /**
   * Get cached message
   */
  getCachedMessage(messageId: string): Message | undefined {
    return this.cache.messages.get(messageId);
  }

  /**
   * Get cached user
   */
  getCachedUser(userId: string): User | undefined {
    return this.cache.users.get(userId);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.threads.clear();
    this.cache.messages.clear();
    this.cache.users.clear();
  }

  /**
   * Get all cached threads
   */
  getCachedThreads(): Thread[] {
    return Array.from(this.cache.threads.values());
  }

  /**
   * Get cached messages for a thread
   */
  getCachedMessages(threadId: string): Message[] {
    return Array.from(this.cache.messages.values())
      .filter(message => message.threadId === threadId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private setupEventHandlers(): void {
    // Forward A2A client events
    this.a2aClient.on('connection_status_changed', (status) => {
      this.emit('connection_status_changed', status);
    });

    this.a2aClient.on('error', (error) => {
      this.emit('error', error);
    });

    // Handle specific events
    this.a2aClient.on('message_received', (data) => {
      const message: Message = data.message;
      this.cache.messages.set(message.id, message);
      this.emit('message_received', message);
    });

    this.a2aClient.on('thread_created', (data) => {
      const thread: Thread = data.thread;
      this.cache.threads.set(thread.id, thread);
      this.emit('thread_created', thread);
    });

    this.a2aClient.on('thread_updated', (data) => {
      const thread: Thread = data.thread;
      this.cache.threads.set(thread.id, thread);
      this.emit('thread_updated', thread);
    });

    this.a2aClient.on('user_joined', (data) => {
      this.emit('user_joined', data);
    });

    this.a2aClient.on('user_left', (data) => {
      this.emit('user_left', data);
    });
  }
}