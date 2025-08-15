// src/components/settings/SkeletonLoader.tsx

import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-pulse">
            <header className="flex items-center justify-between mb-6 md:mb-10">
                <div className="h-10 w-1/2 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg md:hidden"></div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Sidebar Skeleton */}
                <div className="hidden md:block md:col-span-1 lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4">
                        <div className="h-10 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-8 bg-gray-200 rounded-md"></div>
                            <div className="h-8 bg-gray-200 rounded-md"></div>
                            <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="md:col-span-2 lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 h-full">
                        <div className="h-8 w-1/3 bg-gray-200 rounded-lg mb-8"></div>
                        <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="h-6 bg-gray-200 rounded-md"></div>
                            <div className="h-6 bg-gray-200 rounded-md"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;