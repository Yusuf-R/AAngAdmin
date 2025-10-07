// components/ui/ConfirmDialog.js
'use client';
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ConfirmDialog = ({
                           isOpen,
                           onClose,
                           onConfirm,
                           title,
                           message,
                           confirmText = "Confirm",
                           cancelText = "Cancel",
                           variant = "destructive", // "destructive" or "default"
                           isLoading = false
                       }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                            variant === 'destructive'
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                            {variant === 'destructive' ? (
                                <AlertTriangle className="w-5 h-5" />
                            ) : (
                                <Trash2 className="w-5 h-5" />
                            )}
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                disabled={isLoading}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant}
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    Processing...
                                </>
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmDialog;