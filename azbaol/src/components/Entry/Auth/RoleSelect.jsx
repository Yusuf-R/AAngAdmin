"use client";
import { useId } from "react";
import { Shield, User, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
    { key: "admin",  label: "Admin",  Icon: Shield },
    { key: "client", label: "Client", Icon: User },
    { key: "driver", label: "Driver", Icon: Bike  },
];

export default function RoleSelect({ value, onChange, className }) {
    const name = useId();
    return (
        <div className={cn("space-y-1", className)}>
            <label className="text-sm font-medium text-gray-700 block">Role</label>
            <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ key, label, Icon }) => {
                    const active = value === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onChange(key)}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-xl border h-10 px-3 text-sm transition",
                                active
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", active ? "text-blue-700" : "text-gray-500")} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
