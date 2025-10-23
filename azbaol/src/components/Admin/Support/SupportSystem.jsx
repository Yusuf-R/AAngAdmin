"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    MessageCircle,
    Users,
    Wifi,
    Shield,
    Zap,
    BarChart3,
    Settings,
    Bell,
    Clock,
    UserCheck,
    AlertTriangle,
    CheckCircle2,
    Workflow,
    Gauge,
    Activity,
    LifeBuoy,
    Headset,
    FileWarning,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * SupportSystem (Admin)
 * — Elevated, production‑ready screen with polished layout, a11y, and motion.
 * — Uses shadcn/ui + Tailwind + Framer Motion.
 */
export default function SupportSystem() {
    const router = useRouter();

    const [isNavigating, setIsNavigating] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState("");

    const handleNavigation = (path) => {
        setIsNavigating(true);
        setNavigatingTo(path);

        // Small delay to ensure loading state is visible
        setTimeout(() => {
            router.push(path);
        }, 300);
    };


    const quickActions = useMemo(
        () => [
            {
                label: "Start Live Chat",
                icon: MessageCircle,
                path: "/admin/support/chat",
                help: "Open the real‑time chat console",
            },
            {
                label: "New Ticket",
                icon: LifeBuoy,
                path: "/admin/support/tickets/new",
                help: "Create a manual support ticket",
            },
            {
                label: "Alerts Center",
                icon: Bell,
                path: "/admin/support/alerts",
                help: "View high‑priority platform alerts",
            },
        ],
        []
    );

    const featureCards = useMemo(
        () => [
            {
                title: "Conversations",
                desc: "Live chat, canned replies, agent presence",
                icon: MessageCircle,
                path: "/admin/support/chat",
                accent: "from-blue-500 to-indigo-500",
            },
            {
                title: "Tickets",
                desc: "Inbox, routing rules, SLAs, tags",
                icon: LifeBuoy,
                path: "/admin/support/tickets",
                accent: "from-emerald-500 to-teal-500",
            },
            {
                title: "Incidents",
                desc: "System incidents, maintenance windows",
                icon: AlertTriangle,
                path: "/admin/support/incidents",
                accent: "from-amber-500 to-orange-500",
            },
            {
                title: "Users",
                desc: "Clients, drivers, KYC & trust scores",
                icon: Users,
                path: "/admin/support/users",
                accent: "from-fuchsia-500 to-pink-500",
            },
            {
                title: "System Health",
                desc: "Socket uptime, queues, error rates",
                icon: Activity,
                path: "/admin/support/health",
                accent: "from-cyan-500 to-sky-500",
            },
            {
                title: "Analytics",
                desc: "Volumes, SLA attainment, NPS",
                icon: BarChart3,
                path: "/admin/support/analytics",
                accent: "from-violet-500 to-purple-500",
            },
        ],
        []
    );

    return (
        <div className="min-h-screen  w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
            {isNavigating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-4"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="h-8 w-8 text-blue-600" />
                            </motion.div>
                            <div className="text-center">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    Loading...
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Taking you to {getDestinationName(navigatingTo, quickActions, featureCards)}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            {/* Top bar */}
            <div className="p-2 space-y-6">
                <Header />

                {/* System architecture */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                        <Settings className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        System Architecture
                                    </CardTitle>
                                    <CardDescription>
                                        How support connects chat, tickets, sockets, and admin tools
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="rounded-full">
                                    <CheckCircle2 className="mr-1 h-4 w-4" /> Realtime Enabled
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Architecture />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick actions */}
                <section aria-labelledby="quick-actions" className="mt-8">
                    <h2 id="quick-actions" className="sr-only">
                        Quick actions
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quickActions.map((a) => (
                            <motion.div
                                key={a.label}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                <Button
                                    onClick={() => handleNavigation(a.path)}
                                    aria-label={a.help}
                                    className="group h-16 w-full justify-start gap-3 rounded-2xl border border-slate-200 bg-white text-left text-lg shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                    variant="ghost"
                                >
                                    <a.icon className="h-5 w-5 opacity-80 transition group-hover:scale-105" />
                                    <span className="font-medium">{a.label}</span>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Primary feature grid */}
                <section aria-labelledby="support-features" className="mt-10">
                    <div className="mb-3 flex items-center justify-between">
                        <h2
                            id="support-features"
                            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                        >
                            Workspaces
                        </h2>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Curated entry points for common admin tasks
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {featureCards.map((f) => (
                            <FeatureCard key={f.title} {...f} onClick={handleNavigation} />
                        ))}
                    </div>
                </section>

                {/* SLA + Status strip */}
                <section className="mt-10">
                    <Card className="border-0 bg-gradient-to-r from-slate-100/80 via-white/80 to-slate-100/80 shadow-lg dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60">
                        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                            <Metric
                                icon={Clock}
                                label="Avg First Response"
                                value="00:02:41"
                                hint="last 24h"
                            />
                            <Separator className="hidden h-6 sm:block" orientation="vertical" />
                            <Metric icon={Gauge} label="SLA Attainment" value="98.7%" hint="P1/P2" />
                            <Separator className="hidden h-6 sm:block" orientation="vertical" />
                            <Metric icon={Zap} label="Socket Uptime" value="99.98%" hint="30d" />
                            <Separator className="hidden h-6 sm:block" orientation="vertical" />
                            <Metric icon={Shield} label="KYC Verified" value="12,304" hint="drivers & clients" />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
function getDestinationName(path, quickActions, featureCards) {
    const allItems = [...quickActions, ...featureCards];
    const item = allItems.find(item => item.path === path);
    return item ? item.title || item.label : "the destination";
}

function Header() {
    return (
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            {/* soft grid backdrop */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_60%)]"
            />

            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg">
                        <MessageCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Support System
                        </h1>
                        <p className="mt-1 max-w-prose text-slate-600 dark:text-slate-400">
                            Monitor, communicate, and manage your platform in real time.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className="rounded-full">Admin</Badge>
                    <Badge variant="secondary" className="rounded-full">
                        Production
                    </Badge>
                </div>
            </div>
        </div>
    );
}

function Architecture() {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="text-center">
                    <div className="p-4 bg-blue-600 text-white rounded-lg shadow-lg">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Admin Panel</p>
                        <p className="text-xs opacity-80">Next.js Frontend</p>
                    </div>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Real-time Dashboard</p>
                </div>


                <div className="flex-1 h-1 bg-blue-300 mx-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
                </div>


                <div className="text-center">
                    <div className="p-4 bg-green-600 text-white rounded-lg shadow-lg">
                        <Wifi className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Node.js Server</p>
                        <p className="text-xs opacity-80">WebSocket Hub</p>
                    </div>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Central Communication</p>
                </div>


                <div className="flex-1 h-1 bg-green-300 mx-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-yellow-400 animate-pulse"></div>
                </div>


                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="p-4 bg-purple-600 text-white rounded-lg shadow-lg">
                            <UserCheck className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">Clients</p>
                            <p className="text-xs opacity-80">Web Users</p>
                        </div>
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Customer Platform</p>
                    </div>


                    <div className="text-center">
                        <div className="p-4 bg-orange-600 text-white rounded-lg shadow-lg">
                            <Shield className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">Drivers</p>
                            <p className="text-xs opacity-80">Mobile App</p>
                        </div>
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Driver Applications</p>
                    </div>
                </div>
            </div>


            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Real-time bidirectional communication between all platform components
            </div>
        </div>
    );
}

function FeatureCard({ title, desc, icon: Icon, path, accent, onClick, isNavigating, navigatingTo }) {
    const isLoading = isNavigating && navigatingTo === path;

    return (
        <motion.button
            type="button"
            onClick={() => onClick(path)}
            disabled={isNavigating} // Disable during navigation
            className="group h-full w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            aria-label={`${title}, ${desc}`}
        >
            <Card className="h-full border-0 shadow-lg transition hover:shadow-xl dark:bg-slate-900/70">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`rounded-xl bg-gradient-to-br ${accent} p-2 text-white shadow ${isLoading ? 'opacity-80' : ''}`}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Icon className="h-5 w-5" />
                            )}
                        </div>
                        <CardTitle className="text-slate-900 dark:text-slate-100">
                            {title}
                        </CardTitle>
                    </div>
                    <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                            <Workflow className="h-4 w-4" />
                            {isLoading ? "Loading..." : "Open workspace"}
                        </span>
                        <span className={`opacity-80 transition ${isLoading ? 'opacity-50' : 'group-hover:translate-x-0.5'}`}>
                            ↗
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.button>
    );
}

function Metric({ icon: Icon, label, value, hint }) {
    return (
        <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900/5 p-2 dark:bg-white/5">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {value}
                    {hint && (
                        <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              {hint}
            </span>
                    )}
                </div>
            </div>
        </div>
    );
}
