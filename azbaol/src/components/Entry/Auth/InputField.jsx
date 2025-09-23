"use client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function InputField({
                                       label,
                                       type = "text",
                                       placeholder,
                                       icon: Icon,
                                       showPassword,
                                       onTogglePassword,
                                       hasToggle = false,
                                       error,
                                       disabled = false,
                                       value,
                                       onChange,
                                       maxLength,
                                       className,
                                       ...props
                                   }) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 block">{label}</label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon size={18} />
                    </div>
                )}
                <Input
                    type={hasToggle ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value}
                    onChange={onChange}
                    maxLength={maxLength}
                    className={cn(
                        Icon ? "pl-10" : "pl-4",
                        hasToggle ? "pr-10" : "pr-4",
                        "h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
                {hasToggle && (
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={onTogglePassword}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
