'use client';
import {useEffect, useRef} from 'react';
import {
    Download,
    Package,
    RefreshCw,
    DatabaseZap,
    Server,
    Wifi,
    Users,
    FileText,
    Cpu,
    HardDrive,
    Clock,
    Shield,
    Activity,
    Bell,
    Heart,
    Zap,
    Trash2,
    Loader2,

} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {toast} from "sonner";
import React, {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {socketClient} from "@/lib/SocketClient";
import AdminUtils from "@/utils/AdminUtils";
import AuthUtils from "@/utils/AuthUtils";
import UserDeletionManager from '@/components/Admin/System/UserDeletionManager';
import OrderDeletionManager from '@/components/Admin/System/OrderDeletionManager';
import { Tabs as SubTabs, TabsContent as SubTabsContent, TabsList as SubTabsList, TabsTrigger as SubTabsTrigger } from '@/components/ui/tabs';


function UserSessionCard({ user, onCleanup }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    const sessionCount = user.sessionTokens?.length || 0;
    const needsCleanup = sessionCount > 10;

    // Sort tokens by lastActive to identify old ones
    const sortedTokens = [...(user.sessionTokens || [])].sort((a, b) =>
        new Date(b.lastActive) - new Date(a.lastActive)
    );

    const activeTokens = sortedTokens.filter(t =>
        new Date(t.lastActive) > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const staleTokens = sessionCount - activeTokens.length;

    const handleCleanup = async (strategy) => {
        setIsCleaning(true);
        try {
            const result = await AdminUtils.cleanupUserSessions(user.user_id, strategy);
            toast.success(result.message || `Cleaned up sessions for ${user.email}`);
            onCleanup();
        } catch (error) {
            toast.error(`Failed to cleanup: ${error.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className={`border rounded-lg ${needsCleanup ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'}`}>
            <div
                className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${needsCleanup ? 'bg-orange-500' : 'bg-green-500'}`}/>
                        <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                                {sessionCount} sessions • {activeTokens.length} active • {staleTokens} stale
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {needsCleanup && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                Needs Cleanup
                            </Badge>
                        )}
                        {staleTokens > 0 && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                {staleTokens} Stale
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? '−' : '+'}
                        </Button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Total Sessions</p>
                            <p className="text-2xl font-bold text-blue-600">{sessionCount}</p>
                            <p className="text-xs text-blue-700 mt-1">
                                {activeTokens.length} active · {staleTokens} stale
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm font-medium text-purple-900">Last Active</p>
                            <p className="text-sm font-bold text-purple-600">
                                {sortedTokens[0] ? new Date(sortedTokens[0].lastActive).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-xs text-purple-700 mt-1">Most recent login</p>
                        </div>
                    </div>

                    {sessionCount > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCleanup('keep-recent-5')}
                                disabled={isCleaning || sessionCount <= 5}
                                className="flex-1 min-w-[140px]"
                            >
                                Keep 5 Most Recent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCleanup('remove-stale')}
                                disabled={isCleaning || staleTokens === 0}
                                className="flex-1 min-w-[140px]"
                            >
                                Remove Stale ({staleTokens})
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCleanup('delete-all')}
                                disabled={isCleaning}
                                className="flex-1 min-w-[140px]"
                            >
                                Delete All Sessions
                            </Button>
                        </div>
                    )}

                    {sortedTokens.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Session Tokens (sorted by activity)</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {sortedTokens.slice(0, 10).map((token, idx) => {
                                    const isStale = new Date(token.lastActive) < Date.now() - 7 * 24 * 60 * 60 * 1000;
                                    const daysSinceActive = Math.floor((Date.now() - new Date(token.lastActive)) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={idx} className={`text-xs p-3 rounded border ${
                                            isStale ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-700">{token.device}</span>
                                                {isStale && (
                                                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                                        Stale
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-600 mb-1">IP: {token.ip}</p>
                                            <p className="text-gray-500">
                                                Created: {new Date(token.createdAt).toLocaleString()}
                                            </p>
                                            <p className="text-gray-500">
                                                Last Active: {new Date(token.lastActive).toLocaleString()}
                                                <span className="ml-1 text-gray-400">({daysSinceActive}d ago)</span>
                                            </p>
                                        </div>
                                    );
                                })}
                                {sortedTokens.length > 10 && (
                                    <p className="text-xs text-gray-500 text-center py-2">
                                        And {sortedTokens.length - 10} more...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function System() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("health");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add these state variables inside your component
    const [isTesting, setIsTesting] = useState({
        database: false,
        redis: false,
        socket: false,
        notification: false,
        health: false,
        order: false,
        broadcast: false
    });

    const [testResults, setTestResults] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [socketEvents, setSocketEvents] = useState([]);
    const [lastTest, setLastTest] = useState(null);
    const [connectionStats, setConnectionStats] = useState({
        activeConnections: 0,
        avgLatency: 0,
        messagesSent: 0,
        messagesReceived: 0
    });

    // Add new state for sessions
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        totalUsers: 0,
        usersWithSessions: 0,
        totalSessions: 0,
        usersNeedingCleanup: 0,
        totalStale: 0
    });

    const [deletionUsersData, setDeletionUsersData] = useState([]);
    const [deletionOrdersData, setDeletionOrdersData] = useState([]);
    const [isDeletionDataLoading, setIsDeletionDataLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('users');

    const fetchDeletionUsers = async () => {
        setIsDeletionDataLoading(true);
        try {
            const response = await AdminUtils.getUsersForDeletion({ page: 1, limit: 100 });
            setDeletionUsersData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users for deletion');
        } finally {
            setIsDeletionDataLoading(false);
        }
    };
    const fetchDeletionOrders = async () => {
        setIsDeletionDataLoading(true);
        try {
            const response = await AdminUtils.getOrdersForDeletion({ page: 1, limit: 100 });
            setDeletionOrdersData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load orders for deletion');
        } finally {
            setIsDeletionDataLoading(false);
        }
    };

    // Load data when tab becomes active
    useEffect(() => {
        if (activeTab === 'resources') {
            fetchDeletionUsers();
            fetchDeletionOrders();
        }
    }, [activeTab]);

    // Add function to fetch sessions
    const fetchUserSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const response = await AdminUtils.getUserSessions();
            setSessions(response || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast.error('Failed to load user sessions');
        } finally {
            setIsLoadingSessions(false);
        }
    };
    const handleBulkCleanup = async (strategy) => {
        const usersToClean = sessions.filter(user => {
            const sessionCount = user.sessionTokens?.length || 0;
            if (strategy === 'cleanup-all-stale') {
                const staleCount = user.sessionTokens?.filter(t =>
                    new Date(t.lastActive) < Date.now() - 7 * 24 * 60 * 60 * 1000
                ).length || 0;
                return staleCount > 0;
            }
            return sessionCount > 10;
        });

        if (usersToClean.length === 0) {
            toast.info('No users need cleanup');
            return;
        }

        const confirmed = window.confirm(
            `This will clean up sessions for ${usersToClean.length} users. Continue?`
        );

        if (!confirmed) return;

        setIsLoadingSessions(true);
        try {
            const result = await AdminUtils.bulkCleanupSessions(strategy);
            toast.success(result.message || `Cleaned up sessions for ${usersToClean.length} users`);
            fetchUserSessions();
        } catch (error) {
            toast.error(`Bulk cleanup failed: ${error.message}`);
        } finally {
            setIsLoadingSessions(false);
        }
    };
    useEffect(() => {
        const stats = sessions.reduce((acc, user) => {
            const sessionCount = user.sessionTokens?.length || 0;
            const staleCount = user.sessionTokens?.filter(t =>
                new Date(t.lastActive) < Date.now() - 7 * 24 * 60 * 60 * 1000
            ).length || 0;

            return {
                totalUsers: acc.totalUsers + 1,
                usersWithSessions: sessionCount > 0 ? acc.usersWithSessions + 1 : acc.usersWithSessions,
                totalSessions: acc.totalSessions + sessionCount,
                usersNeedingCleanup: sessionCount > 10 ? acc.usersNeedingCleanup + 1 : acc.usersNeedingCleanup,
                totalStale: acc.totalStale + staleCount
            };
        }, { totalUsers: 0, usersWithSessions: 0, totalSessions: 0, usersNeedingCleanup: 0, totalStale: 0 });

        setSessionStats(stats);
    }, [sessions]);
    // Load sessions when tab becomes active
    useEffect(() => {
        if (activeTab === 'session') {
            fetchUserSessions();
        }
    }, [activeTab]);
    useEffect(() => {
        // Listen for socket connection state changes
        const handleConnected = (data) => {
            setSocketConnected(true);
            addSocketEvent('connected', data);
        };

        const handleDisconnected = (data) => {
            setSocketConnected(false);
            addSocketEvent('disconnected', data);
        };

        const handleError = (data) => {
            addSocketEvent('error', data);
            toast.error(`Socket error: ${data.error}`);
        };

        const handleNotification = (data) => {
            addSocketEvent('notification:new', data);
        };

        const handleOrderUpdate = (data) => {
            addSocketEvent('order:updated', data);
        };

        const handleLatency = (data) => {
            addSocketEvent('latency', data);
            setConnectionStats(prev => ({
                ...prev,
                avgLatency: data.average
            }));
        };

        socketClient.on('connected', handleConnected);
        socketClient.on('disconnected', handleDisconnected);
        socketClient.on('error', handleError);
        socketClient.on('notification', handleNotification);
        socketClient.on('order-update', handleOrderUpdate);
        socketClient.on('latency', handleLatency);

        return () => {
            socketClient.off('connected', handleConnected);
            socketClient.off('disconnected', handleDisconnected);
            socketClient.off('error', handleError);
            socketClient.off('notification', handleNotification);
            socketClient.off('order-update', handleOrderUpdate);
            socketClient.off('latency', handleLatency);
        };
    }, []);

    // 3. Replace disconnectSocket function:
    const disconnectSocket = () => {
        socketClient.disconnect();
        setSocketConnected(false);
        addSocketEvent('disconnected', 'Connection closed by user');
        toast.info('Socket disconnected');
    };

    const sendTestNotification = () => {
        if (!socketConnected) return;

        setIsTesting(prev => ({...prev, notification: true}));
        const success = socketClient.sendTestNotification();

        if (success) {
            addSocketEvent('notification:sent', {
                type: 'test',
                message: 'Test notification sent to server',
                timestamp: new Date().toISOString()
            });
        }

        setTimeout(() => {
            setIsTesting(prev => ({...prev, notification: false}));
        }, 500);
    };

    const sendHealthPing = async () => {
        if (!socketConnected) return;

        setIsTesting(prev => ({...prev, health: true}));

        try {
            const result = await socketClient.testConnection();

            if (result.success) {
                addSocketEvent('ping:health', {
                    latency: result.latency,
                    serverTime: result.serverTime,
                    clientTime: Date.now()
                });
                toast.success(`Latency: ${result.latency}ms`);
            } else {
                addSocketEvent('ping:health:error', result);
                toast.error(result.error || 'Health check failed');
            }
        } catch (error) {
            toast.error('Health check failed');
        }

        setIsTesting(prev => ({...prev, health: false}));
    };

    const simulateOrderUpdate = () => {
        if (!socketConnected) return;

        setIsTesting(prev => ({...prev, order: true}));
        const success = socketClient.simulateOrderUpdate();

        if (success) {
            addSocketEvent('order:test-update', {
                orderId: `TEST-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                status: 'processing',
                test: true,
                timestamp: new Date().toISOString()
            });
        }

        setTimeout(() => {
            setIsTesting(prev => ({...prev, order: false}));
        }, 700);
    };

    const broadcastMessage = () => {
        if (!socketConnected || !socketClient.socket) return;

        setIsTesting(prev => ({...prev, broadcast: true}));

        // Emit broadcast event - you'll need to add this handler on your server
        socketClient.socket.emit('admin:broadcast', {
            message: 'Test broadcast message from admin',
            timestamp: new Date().toISOString()
        });

        addSocketEvent('broadcast:sent', {
            message: 'Test broadcast message',
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            setIsTesting(prev => ({...prev, broadcast: false}));
        }, 600);
    };

    const testSocketConnection = async () => {
        setIsTesting(prev => ({...prev, socket: true}));

        try {
            const result = await socketClient.testConnection();

            setTestResults({
                status: result.success ? 'success' : 'error',
                title: result.success ? 'WebSocket Connection Successful' : 'WebSocket Connection Failed',
                message: result.success
                    ? 'Successfully established WebSocket connection and verified handshake.'
                    : 'Failed to establish WebSocket connection.',
                details: result.success
                    ? `Latency: ${result.latency}ms\nServer Time: ${new Date(result.serverTime).toISOString()}`
                    : `Error: ${result.error}`,
                latency: result.success ? result.latency : null
            });

            setLastTest({
                service: 'WebSocket',
                success: result.success,
                timestamp: new Date().toLocaleTimeString()
            });
        } catch (error) {
            setTestResults({
                status: 'error',
                title: 'WebSocket Connection Failed',
                message: 'Failed to test WebSocket connection.',
                details: `Error: ${error.message}`,
                latency: null
            });

            setLastTest({
                service: 'WebSocket',
                success: false,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        setIsTesting(prev => ({...prev, socket: false}));
    };


    // Mock test functions - replace with actual API calls
    const testDatabaseConnection = async () => {
        setIsTesting(prev => ({...prev, database: true}));
        try {
            const resp = await AuthUtils.DbTest();
            console.log({resp})
            // it response with this data
            // { message: 'Db Connection successful', project: 'AAngAdmin' }
            toast.success(resp.message)
            setIsTesting(prev => ({...prev, database: false}))
            setTestResults({
                status: 'success',
                title: 'Database Connection Successful',
                message: resp.message,
                details: resp.project,
                latency: null,
            })
            setLastTest({
                service: 'Database',
                success: true,
                timestamp: new Date().toLocaleTimeString()
            })
        } catch (err) {
            console.log({err})
            toast.error(err)
            setIsTesting(prev => ({...prev, database: false}))
            setTestResults({
                status: 'fail',
                title: 'Database Connection Unsuccessful',
                message: err,
                details: err,
                latency: null,
            })
            setLastTest({
                service: 'Database',
                success: false,
                timestamp: new Date().toLocaleTimeString()
            })
        }
    };

    const testRedisConnection = async () => {
        setIsTesting(prev => ({...prev, redis: true}));

        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate
            setTestResults({
                status: success ? 'success' : 'error',
                title: success ? 'Redis Connection Successful' : 'Redis Connection Failed',
                message: success
                    ? 'Successfully connected to Redis cache and executed PING command.'
                    : 'Failed to connect to Redis instance.',
                details: success
                    ? 'Command: PING\nResponse: PONG (3ms)'
                    : 'Error: ECONNREFUSED - Redis server not responding',
                latency: success ? 3 : null
            });
            setLastTest({
                service: 'Redis',
                success,
                timestamp: new Date().toLocaleTimeString()
            });
            setIsTesting(prev => ({...prev, redis: false}));
        }, 800);
    };

    // WebSocket test functions
    const connectSocket = async () => {
        try {
            await socketClient.connect();
            setSocketConnected(true);
            addSocketEvent('connected', 'Connection established successfully');
            toast.success('Socket connection established successfully')
        } catch (error) {
            console.error('Socket connection failed:', error);
            toast.error('Failed to connect to socket server');
        }
    };

    const addSocketEvent = (event, data) => {
        setSocketEvents(prev => [{
            event,
            data,
            type: 'received',
            timestamp: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            toast.success("System data refreshed successfully");
            router.refresh();
            setIsRefreshing(false);
        }, 1000);
    };

    // Mock data for demonstration
    const systemHealth = {
        cpu: 45,
        memory: 72,
        storage: 58,
        uptime: "12 days, 4 hours",
        status: "healthy"
    };

    const connections = {
        database: {status: "connected", latency: "12ms"},
        redis: {status: "connected", latency: "3ms"},
        socket: {status: "active", connections: 142}
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500';
            case 'connected':
                return 'bg-green-500';
            case 'active':
                return 'bg-green-500';
            case 'warning':
                return 'bg-yellow-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl border border-gray-200/60 p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4 mb-6 lg:mb-0">
                            <div
                                className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                                <DatabaseZap className="w-8 h-8"/>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
                                <p className="text-lg text-gray-600 mt-2">
                                    Monitor and manage your system health, connections, and logs
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(systemHealth.status)}`}/>
                                    <span className="text-sm text-gray-500 capitalize">{systemHealth.status}</span>
                                    <span className="text-sm text-gray-400">•</span>
                                    <span className="text-sm text-gray-500">Last updated: Just now</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
                                <Download className="w-4 h-4"/> Export Logs
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 border-gray-300 hover:bg-gray-50"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                    {/*<TabsList className="grid w-full h-16 grid-cols-4 bg-gray-100/50 rounded-xl border border-grey-200 ">*/}
                    <TabsList className="flex w-full bg-gray-100/50 rounded-xl border border-gray-200 p-1.5 gap-1.5">

                        <TabsTrigger
                            value="health"
                            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 px-2 text-sm font-medium"
                        >
                            <Activity className="w-4 h-4"/>
                            <span className="font-medium">System Health</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="conn"
                            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 px-2 text-sm font-medium"
                        >
                            <Wifi className="w-4 h-4"/>
                            <span className="font-medium">Connections</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="session"
                            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 px-2 text-sm font-medium"
                        >
                            <Users className="w-4 h-4"/>
                            <span className="font-medium">Sessions</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="logs"
                            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 px-2 text-sm font-medium"
                        >
                            <FileText className="w-4 h-4"/>
                            <span className="font-medium">System Logs</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="resources"
                            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 px-2 text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4"/>
                            <span className="font-medium">Resource Deletion</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Health Tab */}
                    <TabsContent value="health" className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Health Metrics */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Server className="w-5 h-5 text-blue-600"/>
                                            System Health Overview
                                        </CardTitle>
                                        <CardDescription>
                                            Real-time monitoring of system resources and performance
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* CPU Usage */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Cpu className="w-4 h-4 text-gray-600"/>
                                                    <span className="font-medium">CPU Usage</span>
                                                </div>
                                                <Badge variant={systemHealth.cpu > 80 ? "destructive" : "secondary"}>
                                                    {systemHealth.cpu}%
                                                </Badge>
                                            </div>
                                            <Progress value={systemHealth.cpu} className="h-2"/>
                                        </div>

                                        {/* Memory Usage */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <HardDrive className="w-4 h-4 text-gray-600"/>
                                                    <span className="font-medium">Memory Usage</span>
                                                </div>
                                                <Badge variant={systemHealth.memory > 80 ? "destructive" : "secondary"}>
                                                    {systemHealth.memory}%
                                                </Badge>
                                            </div>
                                            <Progress value={systemHealth.memory} className="h-2"/>
                                        </div>

                                        {/* Storage Usage */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-gray-600"/>
                                                    <span className="font-medium">Storage Usage</span>
                                                </div>
                                                <Badge
                                                    variant={systemHealth.storage > 80 ? "destructive" : "secondary"}>
                                                    {systemHealth.storage}%
                                                </Badge>
                                            </div>
                                            <Progress value={systemHealth.storage} className="h-2"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar - Quick Stats */}
                            <div className="space-y-6">
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">System Uptime</p>
                                                <p className="text-2xl font-bold text-blue-600">{systemHealth.uptime}</p>
                                            </div>
                                            <Clock className="w-8 h-8 text-blue-500"/>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-green-900">Active Services</p>
                                                <p className="text-2xl font-bold text-green-600">12/12</p>
                                            </div>
                                            <Shield className="w-8 h-8 text-green-500"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Connections Tab */}
                    <TabsContent value="conn" className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Wifi className="w-5 h-5 text-green-600"/>
                                            Connection Status
                                        </CardTitle>
                                        <CardDescription>
                                            Monitor and test database, cache, and real-time connections
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Database Connection */}
                                        <div
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${getStatusColor(connections.database.status)}`}/>
                                                <div>
                                                    <p className="font-medium">Database</p>
                                                    <p className="text-sm text-gray-500">Primary MongoDB instance</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-mono text-sm">{connections.database.latency}</p>
                                                    <p className="text-sm text-gray-500 capitalize">{connections.database.status}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => testDatabaseConnection()}
                                                    disabled={isTesting.database}
                                                    className="gap-2"
                                                >
                                                    <RefreshCw
                                                        className={`w-3 h-3 ${isTesting.database ? 'animate-spin' : ''}`}/>
                                                    Test
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Redis Connection */}
                                        <div
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${getStatusColor(connections.redis.status)}`}/>
                                                <div>
                                                    <p className="font-medium">Redis Cache</p>
                                                    <p className="text-sm text-gray-500">Session and cache store</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-mono text-sm">{connections.redis.latency}</p>
                                                    <p className="text-sm text-gray-500 capitalize">{connections.redis.status}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => testRedisConnection()}
                                                    disabled={isTesting.redis}
                                                    className="gap-2"
                                                >
                                                    <RefreshCw
                                                        className={`w-3 h-3 ${isTesting.redis ? 'animate-spin' : ''}`}/>
                                                    Test
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Socket Connections */}
                                        <div
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${getStatusColor(connections.socket.status)}`}/>
                                                <div>
                                                    <p className="font-medium">WebSocket</p>
                                                    <p className="text-sm text-gray-500">Real-time connections</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-mono text-sm">{connections.socket.connections} active</p>
                                                    <p className="text-sm text-gray-500 capitalize">{connections.socket.status}</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => connectSocket()}
                                                    disabled={isTesting.socket}
                                                    className="gap-2"
                                                >
                                                    <RefreshCw
                                                        className={`w-3 h-3 ${isTesting.socket ? 'animate-spin' : ''}`}/>
                                                    Test
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Results Section */}
                                {testResults && (
                                    <Card className={`border-l-4 ${
                                        testResults.status === 'success'
                                            ? 'border-l-green-500'
                                            : 'border-l-red-500'
                                    } shadow-sm`}>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                {testResults.status === 'success' ? (
                                                    <div
                                                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none"
                                                             stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth={3} d="M5 13l4 4L19 7"/>
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none"
                                                             stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth={3} d="M6 18L18 6M6 6l12 12"/>
                                                        </svg>
                                                    </div>
                                                )}
                                                Test Results
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`p-4 rounded-lg ${
                                                testResults.status === 'success'
                                                    ? 'bg-green-50 text-green-800'
                                                    : 'bg-red-50 text-red-800'
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{testResults.title}</p>
                                                        <p className="text-sm mt-1 opacity-90">{testResults.message}</p>
                                                        {testResults.details && (
                                                            <div
                                                                className="mt-2 p-2 bg-white/50 rounded text-xs font-mono">
                                                                {testResults.details}
                                                            </div>
                                                        )}
                                                        {testResults.latency && (
                                                            <p className="text-xs mt-2 opacity-75">
                                                                Response time: <strong>{testResults.latency}ms</strong>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setTestResults(null)}
                                                        className="opacity-70 hover:opacity-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                             viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                                        </svg>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* WebSocket Testing Section */}
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Activity className="w-5 h-5 text-blue-600"/>
                                            WebSocket Live Testing
                                        </CardTitle>
                                        <CardDescription>
                                            Test real-time functionality with WebSocket events
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Connection Status */}
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                                }`}/>
                                                <div>
                                                    <p className="font-medium">WebSocket Connection</p>
                                                    <p className="text-sm text-blue-700">
                                                        {socketConnected ? 'Connected and listening' : 'Disconnected'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={socketConnected ? "outline" : "default"}
                                                size="sm"
                                                onClick={socketConnected ? disconnectSocket : connectSocket}
                                                className="gap-2"

                                            >
                                                {socketConnected ? (
                                                    <>
                                                        <Wifi className="w-3 h-3"/>
                                                        Disconnect
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wifi className="w-3 h-3"/>
                                                        Connect
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Test Actions */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={sendTestNotification}
                                                disabled={!socketConnected || isTesting.notification}
                                                className="gap-2 h-14"
                                            >
                                                <Bell className="w-4 h-4"/>
                                                <div className="text-left">
                                                    <p className="font-medium">Test Notification</p>
                                                    <p className="text-xs text-gray-500">Send test push notification</p>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={sendHealthPing}
                                                disabled={!socketConnected || isTesting.health}
                                                className="gap-2 h-14"
                                            >
                                                <Heart className="w-4 h-4"/>
                                                <div className="text-left">
                                                    <p className="font-medium">Health Check</p>
                                                    <p className="text-xs text-gray-500">Measure connection latency</p>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={simulateOrderUpdate}
                                                disabled={!socketConnected || isTesting.order}
                                                className="gap-2 h-14"
                                            >
                                                <Package className="w-4 h-4"/>
                                                <div className="text-left">
                                                    <p className="font-medium">Order Update</p>
                                                    <p className="text-xs text-gray-500">Simulate order status
                                                        change</p>
                                                </div>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={broadcastMessage}
                                                disabled={!socketConnected || isTesting.broadcast}
                                                className="gap-2 h-14"
                                            >
                                                <Wifi className="w-4 h-4"/>
                                                <div className="text-left">
                                                    <p className="font-medium">Wifi</p>
                                                    <p className="text-xs text-gray-500">Send message to all clients</p>
                                                </div>
                                            </Button>
                                        </div>

                                        {/* Live Events Log */}
                                        {socketEvents.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-gray-900">Live Events</h4>
                                                <div className="max-h-60 overflow-y-auto space-y-2">
                                                    {socketEvents.map((event, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border text-sm ${
                                                                event.type === 'received'
                                                                    ? 'bg-green-50 border-green-200 text-green-800'
                                                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span
                                                                    className="font-medium capitalize">{event.event}</span>
                                                                <span
                                                                    className="text-xs opacity-75">{event.timestamp}</span>
                                                            </div>
                                                            {event.data && (
                                                                <pre
                                                                    className="mt-1 text-xs opacity-90 overflow-x-auto">
                                                                      {JSON.stringify(event.data, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar - Connection Stats */}
                            <div className="space-y-6">
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">Connection Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div
                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium">Active Connections</p>
                                                <p className="text-2xl font-bold">{connections.socket.connections}</p>
                                            </div>
                                            <Users className="w-8 h-8 opacity-80"/>
                                        </div>

                                        <div
                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium">Avg. Response Time</p>
                                                <p className="text-2xl font-bold">24ms</p>
                                            </div>
                                            <Zap className="w-8 h-8 opacity-80"/>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-900 mb-2">Last Test</p>
                                            {lastTest ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs text-gray-600">{lastTest.service}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            lastTest.success ? 'bg-green-500' : 'bg-red-500'
                                                        }`}/>
                                                        <p className="text-xs text-gray-600">
                                                            {lastTest.success ? 'Success' : 'Failed'} • {lastTest.timestamp}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">No tests run yet</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Sessions Tab - Replace your existing session TabsContent with this */}
                    <TabsContent value="session" className="space-y-6 animate-in fade-in duration-300">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">{sessionStats.totalUsers}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">With Sessions</p>
                                    <p className="text-2xl font-bold text-blue-600">{sessionStats.usersWithSessions}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Total Sessions</p>
                                    <p className="text-2xl font-bold text-purple-600">{sessionStats.totalSessions}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Need Cleanup</p>
                                    <p className="text-2xl font-bold text-orange-600">{sessionStats.usersNeedingCleanup}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-600">Stale Sessions</p>
                                    <p className="text-2xl font-bold text-yellow-600">{sessionStats.totalStale}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-gray-200/60 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Users className="w-5 h-5 text-purple-600"/>
                                            User Session Management
                                        </CardTitle>
                                        <CardDescription>
                                            Manage user sessions and clean up excess tokens
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkCleanup('cleanup-all-excess')}
                                            disabled={isLoadingSessions || sessionStats.usersNeedingCleanup === 0}
                                            className="gap-2"
                                        >
                                            <RefreshCw className="w-3 h-3"/>
                                            Cleanup All Excess
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkCleanup('cleanup-all-stale')}
                                            disabled={isLoadingSessions || sessionStats.totalStale === 0}
                                            className="gap-2"
                                        >
                                            <RefreshCw className="w-3 h-3"/>
                                            Remove All Stale
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={fetchUserSessions}
                                            disabled={isLoadingSessions}
                                            className="gap-2"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isLoadingSessions ? 'animate-spin' : ''}`}/>
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSessions ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400"/>
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No users found</p>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions
                                            .filter(user => user.sessionTokens?.length > 0)
                                            .sort((a, b) => (b.sessionTokens?.length || 0) - (a.sessionTokens?.length || 0))
                                            .map((user) => (
                                                <UserSessionCard
                                                    key={user.user_id}
                                                    user={user}
                                                    onCleanup={fetchUserSessions}
                                                />
                                            ))}
                                        {sessions.filter(user => user.sessionTokens?.length > 0).length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No active sessions found</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Logs Tab */}
                    <TabsContent value="logs" className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border-gray-200/60 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <FileText className="w-5 h-5 text-orange-600"/>
                                            System Logs
                                        </CardTitle>
                                        <CardDescription>
                                            Recent system events and activities
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((log) => (
                                                <div key={log}
                                                     className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"/>
                                                    <div className="flex-1">
                                                        <p className="font-medium">System check completed</p>
                                                        <p className="text-sm text-gray-500">All services are running
                                                            normally</p>
                                                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                                                    </div>
                                                    <Badge variant="outline">Info</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    {/* System Resources Deletion Tab */}
                    <TabsContent value="resources" className="space-y-6 animate-in fade-in duration-300">
                        <Card className="border-gray-200/60 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Trash2 className="w-5 h-5 text-red-600"/>
                                            Resource Deletion
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            Permanently delete users and orders from the system. This action is irreversible.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            fetchDeletionUsers();
                                            fetchDeletionOrders();
                                        }}
                                        disabled={isDeletionDataLoading}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isDeletionDataLoading ? 'animate-spin' : ''}`}/>
                                        Refresh Data
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <SubTabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
                                    <SubTabsList className="grid w-full grid-cols-2 h-12 bg-gray-100/50 rounded-lg border border-gray-200">
                                        <SubTabsTrigger
                                            value="users"
                                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center justify-center gap-2"
                                        >
                                            <Users className="w-4 h-4"/>
                                            Users ({deletionUsersData.length})
                                        </SubTabsTrigger>
                                        <SubTabsTrigger
                                            value="orders"
                                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md flex items-center justify-center gap-2"
                                        >
                                            <Package className="w-4 h-4"/>
                                            Orders ({deletionOrdersData.length})
                                        </SubTabsTrigger>
                                    </SubTabsList>

                                    <SubTabsContent value="users" className="space-y-4">
                                        {isDeletionDataLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
                                                <span className="ml-3 text-gray-600">Loading users...</span>
                                            </div>
                                        ) : (
                                            <UserDeletionManager
                                                initialUsers={deletionUsersData}
                                                onRefresh={fetchDeletionUsers}
                                            />
                                        )}
                                    </SubTabsContent>

                                    <SubTabsContent value="orders" className="space-y-4">
                                        {isDeletionDataLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
                                                <span className="ml-3 text-gray-600">Loading orders...</span>
                                            </div>
                                        ) : (
                                            <OrderDeletionManager
                                                initialOrders={deletionOrdersData}
                                                onRefresh={fetchDeletionOrders}
                                            />
                                        )}
                                    </SubTabsContent>
                                </SubTabs>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default System;