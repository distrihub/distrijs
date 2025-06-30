import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  A2AMessage,
  A2ARequest,
  A2AResponse,
  A2AMessageType,
  DistriNode,
  ConnectionStatus,
  DistriEvent,
  A2AProtocolError,
  ConnectionError,
  AuthenticationError,
  SubscriptionOptions
} from './types';

/**
 * A2A Protocol Client for Distri Framework
 * Handles Agent-to-Agent communication using WebSocket connections
 */
export class A2AClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    private node: DistriNode,
    private config: {
      autoConnect?: boolean;
      reconnectAttempts?: number;
      reconnectDelay?: number;
      heartbeatInterval?: number;
      timeout?: number;
      debug?: boolean;
    } = {}
  ) {
    super();
    
    // Set default config values
    this.config = {
      autoConnect: true,
      reconnectAttempts: 3,
      reconnectDelay: 5000,
      heartbeatInterval: 30000,
      timeout: 10000,
      debug: false,
      ...config
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the Distri node
   */
  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return;
    }

    this.setConnectionStatus('connecting');
    
    try {
      // Convert HTTP(S) URLs to WebSocket URLs
      const wsUrl = this.node.endpoint
        .replace(/^https?:\/\//, (match) => match === 'https://' ? 'wss://' : 'ws://')
        .replace(/\/$/, '') + '/ws';

      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      this.setConnectionStatus('error');
      throw new ConnectionError(`Failed to connect to ${this.node.endpoint}`, error);
    }
  }

  /**
   * Disconnect from the Distri node
   */
  disconnect(): void {
    this.clearReconnectTimeout();
    this.clearHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setConnectionStatus('disconnected');
  }

  /**
   * Send a request and wait for response
   */
  async request<T = any>(method: string, params?: any, targetNode?: string): Promise<T> {
    if (this.connectionStatus !== 'connected') {
      throw new ConnectionError('Client is not connected');
    }

    const requestId = uuidv4();
    const message: A2ARequest = {
      id: requestId,
      type: 'request',
      from: this.node.id,
      to: targetNode,
      timestamp: Date.now(),
      data: {
        method,
        params
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new A2AProtocolError(`Request timeout for method: ${method}`));
      }, this.config.timeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout
      });

      this.sendMessage(message);
    });
  }

  /**
   * Subscribe to events/channels
   */
  async subscribe(options: SubscriptionOptions): Promise<void> {
    await this.request('subscribe', options);
  }

  /**
   * Unsubscribe from events/channels
   */
  async unsubscribe(options: SubscriptionOptions): Promise<void> {
    await this.request('unsubscribe', options);
  }

  /**
   * Publish a message/event
   */
  async publish(channel: string, data: any): Promise<void> {
    await this.request('publish', { channel, data });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get node information
   */
  getNode(): DistriNode {
    return { ...this.node };
  }

  /**
   * Send a ping message
   */
  ping(): void {
    if (this.connectionStatus === 'connected') {
      this.sendMessage({
        id: uuidv4(),
        type: 'ping',
        from: this.node.id,
        timestamp: Date.now(),
        data: {}
      });
    }
  }

  private handleOpen(): void {
    this.debug('WebSocket connection opened');
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // Send handshake
    this.sendMessage({
      id: uuidv4(),
      type: 'handshake',
      from: this.node.id,
      timestamp: Date.now(),
      data: {
        node: this.node,
        version: '1.0.0'
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: A2AMessage = JSON.parse(event.data);
      this.debug('Received message:', message);

      switch (message.type) {
        case 'response':
          this.handleResponse(message as A2AResponse);
          break;
        case 'ping':
          this.handlePing(message);
          break;
        case 'pong':
          this.handlePong(message);
          break;
        case 'notification':
          this.handleNotification(message);
          break;
        case 'error':
          this.handleErrorMessage(message);
          break;
        default:
          this.debug('Unhandled message type:', message.type);
      }
    } catch (error) {
      this.debug('Error parsing message:', error);
      this.emit('error', new A2AProtocolError('Failed to parse message', error));
    }
  }

  private handleResponse(message: A2AResponse): void {
    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id);

      if (message.data.error) {
        pending.reject(new A2AProtocolError(
          message.data.error.message,
          message.data.error
        ));
      } else {
        pending.resolve(message.data.result);
      }
    }
  }

  private handlePing(message: A2AMessage): void {
    // Respond with pong
    this.sendMessage({
      id: uuidv4(),
      type: 'pong',
      from: this.node.id,
      to: message.from,
      timestamp: Date.now(),
      data: {}
    });
  }

  private handlePong(message: A2AMessage): void {
    this.debug('Received pong from:', message.from);
  }

  private handleNotification(message: A2AMessage): void {
    const event: DistriEvent = {
      type: message.data.type || 'notification',
      data: message.data,
      timestamp: message.timestamp
    };
    
    this.emit('event', event);
    this.emit(event.type, event.data);
  }

  private handleErrorMessage(message: A2AMessage): void {
    const error = new A2AProtocolError(
      message.data.message || 'Protocol error',
      message.data
    );
    this.emit('error', error);
  }

  private handleClose(event: CloseEvent): void {
    this.debug('WebSocket connection closed:', event.code, event.reason);
    this.setConnectionStatus('disconnected');
    this.clearHeartbeat();
    
    // Clear all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new ConnectionError('Connection closed'));
    });
    this.pendingRequests.clear();

    // Attempt to reconnect if needed
    if (event.code !== 1000 && this.reconnectAttempts < (this.config.reconnectAttempts || 3)) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    this.debug('WebSocket error:', error);
    this.setConnectionStatus('error');
    this.emit('error', new ConnectionError('WebSocket error', error));
  }

  private sendMessage(message: A2AMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.debug('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      throw new ConnectionError('WebSocket is not connected');
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emit('connection_status_changed', status);
    }
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
      this.heartbeatInterval = setInterval(() => {
        this.ping();
      }, this.config.heartbeatInterval);
    }
  }

  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.debug(`Scheduling reconnect attempt ${this.reconnectAttempts}`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.debug(`Reconnect attempt ${this.reconnectAttempts}`);
      this.connect().catch((error) => {
        this.debug('Reconnect failed:', error);
        if (this.reconnectAttempts < (this.config.reconnectAttempts || 3)) {
          this.scheduleReconnect();
        }
      });
    }, this.config.reconnectDelay || 5000);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private debug(...args: any[]): void {
    if (this.config.debug) {
      console.log('[A2AClient]', ...args);
    }
  }
}