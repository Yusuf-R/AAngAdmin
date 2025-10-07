// lib/socket-service.js
import { io } from 'socket.io-client';

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        this.latencyTests = [];
    }

    /**
     * Connects to the Socket.IO server with authentication
     * @param {Object} [options={}] - Additional socket.io connection options
     * @returns {Promise<SocketClient>}
     * @throws {Error} If connection fails or auth token is missing
     */
    async connect(options = {}) {
        this.disconnect();

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
        if (!SOCKET_URL) {
            throw new Error('Socket server URL not configured (NEXT_PUBLIC_SOCKET_SERVER_URL)');
        }

        // Fetch the socket auth token
        const authToken = await this.fetchAuthToken();
        if (!authToken) {
            throw new Error('Failed to obtain socket authentication token');
        }

        // Initialize socket connection
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: {
                token: authToken,
                ...options.auth,
                clientType: 'web'
            },
            ...options,
        });

        await this.setupConnection();
        return this;
    }

    /**
     * Fetches a short-lived JWT token for socket authentication
     * @returns {Promise<string | null>}
     */
    async fetchAuthToken() {
        try {
            const res = await fetch('/api/v1/auth/admin/socket');
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

    /**
     * Sets up event listeners and waits for connection
     * @returns {Promise<void>}
     */
    async setupConnection() {
        return new Promise((resolve, reject) => {
            const handleError = (error) => {
                cleanup();
                console.log({
                    error
                })
                reject(new Error(`Socket connection failed: ${error.message}`));
            };

            const handleConnect = () => {
                this.isConnected = true;
                cleanup();
                this.setupEventHandlers();
                resolve();
            };

            const cleanup = () => {
                if (this.socket) {
                    this.socket.off('connect', handleConnect);
                    this.socket.off('connect_error', handleError);
                }
                if (timeoutId) clearTimeout(timeoutId);
            };

            this.socket.once('connect', handleConnect);
            this.socket.once('connect_error', handleError);

            // Timeout fallback
            const timeoutId = setTimeout(() => {
                if (!this.isConnected) {
                    cleanup();
                    this.cleanup(); // Disconnect socket
                    reject(new Error('Socket connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Attaches all event listeners after successful connection
     */
    setupEventHandlers() {
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.emitEvent('disconnected', { reason, timestamp: new Date() });
        });

        this.socket.on('connect_error', (error) => {
            this.emitEvent('error', { error: error.message, timestamp: new Date() });
        });

        // Business events
        this.socket.on('notification:new', (data) => {
            this.emitEvent('notification', data);
        });

        this.socket.on('order:updated', (data) => {
            this.emitEvent('order-update', data);
        });

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

    /**
     * Tests end-to-end latency with the server
     * @returns {Promise<{ success: boolean, latency?: number, serverTime?: number, error?: string }>}
     */
    async testConnection() {
        if (!this.isConnected || !this.socket) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const clientTime = Date.now();
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Timeout' });
            }, 5000);

            this.socket.emit('ping:health', clientTime, (response) => {
                clearTimeout(timeout);
                if (response?.serverTime) {
                    const latency = Date.now() - clientTime;
                    resolve({ success: true, latency, serverTime: response.serverTime });
                } else {
                    resolve({ success: false, error: 'Invalid response' });
                }
            });
        });
    }

    /**
     * Sends a test notification (admin only)
     */
    sendTestNotification() {
        if (!this.isConnected) return false;
        this.socket.emit('admin:test-notification', {
            type: 'test',
            message: 'Test notification from web admin',
            timestamp: new Date().toISOString(),
        });
        return true;
    }

    /**
     * Sends order assignment to Node.js server for driver notifications
     * @param {Object} orderAssignment - The order assignment object
     * @returns {boolean} - Success status
     */
    sendOrderAssignment(orderAssignment) {
        if (!this.isConnected) {
            console.error('Socket not connected');
            return false;
        }

        this.socket.emit('order:assignment', {
            type: 'ORDER_ASSIGNMENT',
            orderAssignment: orderAssignment,
            timestamp: new Date().toISOString(),
            source: 'web-admin'
        });

        console.log('Order assignment sent to Node.js server');
        return true;
    }

    /**
     * Simulates an order update
     */
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

    // --- Event Emitter Methods ---

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }

    emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach((cb) => cb(data));
        }
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

// Singleton export
export const socketClient = new SocketClient();