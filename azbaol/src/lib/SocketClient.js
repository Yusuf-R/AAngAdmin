// lib/SocketClient.js
import { io } from 'socket.io-client';

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        this.latencyTests = [];
        this._connectingPromise = null; // guard for in-flight connects
    }

    async connect(options = {}) {
        // Already connected? reuse.
        if (this.isConnected && this.socket && this.socket.connected) return this;

        // If connection is already in progress? wait for it.
        if (this._connectingPromise) return this._connectingPromise;

        // Start a fresh connection (closes any stale socket)
        this.disconnect();

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
        if (!SOCKET_URL) throw new Error('Socket server URL not configured (NEXT_PUBLIC_SOCKET_SERVER_URL)');

        const authToken = await this.fetchAuthToken();
        if (!authToken) throw new Error('Failed to obtain socket authentication token');

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: {
                token: authToken,
                clientType: 'web',
                ...(options.auth || {}),
            },
            ...options,
        });

        this._connectingPromise = new Promise((resolve, reject) => {
            let timeoutId;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (this.socket) {
                    this.socket.off('connect', onConnect);
                    this.socket.off('connect_error', onError);
                }
                this._connectingPromise = null;
            };

            const onConnect = () => {
                this.isConnected = true;
                cleanup();
                this.setupEventHandlers();
                resolve(this); // resolve with the instance for convenient chaining
            };

            const onError = (err) => {
                this.isConnected = false;
                cleanup();
                reject(new Error(`Connection failed: ${err && err.message ? err.message : String(err)}`));
            };

            this.socket.once('connect', onConnect);
            this.socket.once('connect_error', onError);

            // Optional timeout safety
            timeoutId = setTimeout(() => {
                if (!this.isConnected) {
                    cleanup();
                    this.cleanup();
                    reject(new Error('Socket connection timeout'));
                }
            }, 10000);
        });

        return this._connectingPromise;
    }

    async fetchAuthToken() {
        try {
            const res = await fetch('/api/v1/auth/admin/system/socket');
            if (!res.ok) {
                const errorText = await res.text();
                console.error('Auth token API error:', res.status, errorText);
                return null;
            }
            const { token } = await res.json();
            return token;
        } catch (error) {
            console.error('Failed to fetch socket auth token:', error);
            return null;
        }
    }

    setupEventHandlers() {
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.emitEvent('disconnected', { reason, timestamp: new Date() });
        });

        this.socket.on('connect_error', (error) => {
            this.emitEvent('error', { error: error.message, timestamp: new Date() });
        });

        // Business events -- Notifications -- Chats -- System

        // Notifications
        this.socket.on('notification:new', (data) => this.emitEvent('notification', data));

        //Orders
        this.socket.on('order:updated', (data) => this.emitEvent('order-update', data));

        // Test conn
        this.socket.on('pong', (data) => {
            const latency = Date.now() - data.clientTime;
            this.latencyTests.push(latency);
            this.emitEvent('latency', {
                latency,
                average: this.getAverageLatency(),
                serverTime: data.serverTime,
            });
        });
    }

    // --- Event Emitter helpers ---
    on(event, callback) {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
        this.eventListeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) this.eventListeners.get(event).delete(callback);
    }

    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) listeners.forEach((cb) => cb(data));
    }

    // --- Utilities you already had ---
    async testConnection() {
        if (!this.isConnected || !this.socket) return { success: false, error: 'Not connected' };

        return new Promise((resolve) => {
            const clientTime = Date.now();
            const timeout = setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);

            this.socket.emit('ping:health', clientTime, (response) => {
                clearTimeout(timeout);
                if (response && response.serverTime) {
                    const latency = Date.now() - clientTime;
                    resolve({ success: true, latency, serverTime: response.serverTime });
                } else {
                    resolve({ success: false, error: 'Invalid response' });
                }
            });
        });
    }

    sendTestNotification() {
        if (!this.isConnected) return false;
        this.socket.emit('admin:test-notification', {
            type: 'test',
            message: 'Test notification from web admin',
            timestamp: new Date().toISOString(),
        });
        return true;
    }

    sendOrderAssignment(orderAssignment) {
        if (!this.isConnected) {
            console.error('Socket not connected');
            return false;
        }
        this.socket.emit('order:assignment', {
            type: 'ORDER_ASSIGNMENT',
            orderAssignment,
            timestamp: new Date().toISOString(),
            source: 'web-admin',
        });
        return true;
    }

    simulateOrderUpdate() {
        if (!this.isConnected) return false;
        this.socket.emit('order:test-update', {
            orderId: `TEST-${Date.now()}`,
            status: 'processing',
            test: true,
            timestamp: new Date().toISOString(),
        });
        return true;
    }

    // --- Lifecycle ---
    disconnect() {
        this.cleanup();
    }

    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }

    getAverageLatency() {
        if (this.latencyTests.length === 0) return 0;
        return this.latencyTests.reduce((sum, val) => sum + val, 0) / this.latencyTests.length;
    }
}

export const socketClient = new SocketClient();
