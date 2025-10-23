'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HardHat,
    Construction,
    ArrowLeft,
    Clock,
    Hammer,
    Sparkles
} from 'lucide-react';

const UnderConstruction = ({
                               title = "Page Under Construction",
                               message = "We're working hard to bring you something amazing. Please check back later!",
                               showGoBack = true
                           }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleGoBack = () => {
        setIsLeaving(true);
        setTimeout(() => {
            window.history.back();
        }, 500);
    };

    const constructionIcons = [
        { icon: Construction, delay: 0 },
        { icon: HardHat, delay: 0.2 },
        { icon: Hammer, delay: 0.4 },
        { icon: Clock, delay: 0.6 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <AnimatePresence>
                {!isLeaving && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-md w-full"
                    >
                        {/* Main Card */}
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100"
                            whileHover={{ y: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {/* Animated Icons */}
                            <div className="flex justify-center space-x-4 mb-6">
                                {constructionIcons.map(({ icon: Icon, delay }, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ y: 0, rotate: 0 }}
                                        animate={{
                                            y: [0, -10, 0],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay,
                                            repeat: Infinity,
                                            repeatType: "reverse"
                                        }}
                                        className="p-3 bg-yellow-50 rounded-full border border-yellow-200"
                                    >
                                        <Icon className="w-6 h-6 text-yellow-600" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Sparkle Effect */}
                            <div className="relative flex justify-center mb-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-2"
                                >
                                    <Sparkles className="w-8 h-8 text-yellow-500 opacity-60" />
                                </motion.div>
                                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Construction className="w-10 h-10 text-white" />
                                </div>
                            </div>

                            {/* Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center"
                            >
                                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                                    {title}
                                </h1>

                                <motion.p
                                    className="text-gray-600 mb-8 leading-relaxed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {message}
                                </motion.p>

                                {/* Progress Bar */}
                                <div className="mb-8">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>Construction Progress</span>
                                        <span>45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "45%" }}
                                            transition={{ duration: 1.5, delay: 0.7 }}
                                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* Go Back Button */}
                                {showGoBack && (
                                    <motion.button
                                        onHoverStart={() => setIsHovered(true)}
                                        onHoverEnd={() => setIsHovered(false)}
                                        onClick={handleGoBack}
                                        className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {/* Animated background */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800"
                                            initial={{ x: "-100%" }}
                                            animate={{ x: isHovered ? "0%" : "-100%" }}
                                            transition={{ duration: 0.3 }}
                                        />

                                        {/* Button content */}
                                        <span className="relative flex items-center space-x-2">
                      <motion.div
                          animate={{ x: isHovered ? -2 : 0 }}
                          transition={{ duration: 0.2 }}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </motion.div>
                      <span>Go Back</span>
                    </span>
                                    </motion.button>
                                )}
                            </motion.div>
                        </motion.div>

                        {/* Floating Elements */}
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full opacity-30"
                            animate={{
                                y: [0, -20, 0],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: 0.1
                            }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-blue-400 rounded-full opacity-20"
                            animate={{
                                y: [0, 15, 0],
                                scale: [1, 1.3, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                delay: 0.3
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UnderConstruction;