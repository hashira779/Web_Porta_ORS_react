import React, { useState } from 'react';

const siteMap: { [key: string]: { title: string; url: string } } = {
    sales: {
        title: 'Sales Report',
        url: 'http://10.2.7.253:8080/sale_report'
    },
    inventory: {
        title: 'function and json',
        url: 'http://10.2.7.253:8000'
    },
    sharepoint_report: {
        title: 'Approve user sale bot report',
        url: 'http://10.2.7.253:9000'
    },
    hr_system: {
        title: 'Web Portal',
        url: 'http://10.2.7.253:3000'
    }


};

const WebViewerIndexPage: React.FC = () => {
    const [selectedSite, setSelectedSite] = useState<{ title: string; url: string } | null>(null);

    const handleViewFull = (site: { title: string; url: string }) => {
        setSelectedSite(site);
    };

    const handleBack = () => {
        setSelectedSite(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            {/* Tailwind CSS CDN */}
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

            {/* Part 1: System Previews */}
            {!selectedSite && (
                <>
                    <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">System Previews</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(siteMap).map(([id, site]) => (
                            <div
                                key={id}
                                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-2"
                                onClick={() => handleViewFull(site)}
                            >
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-4">{site.title}</h3>
                                    <iframe
                                        src={site.url}
                                        title={`${site.title} preview`}
                                        className="w-full h-48 border-none rounded-md"
                                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Part 2: Full Web View */}
            {selectedSite && (
                <div className="flex flex-col items-center h-[90vh]">
                    <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 animate-fade-in">{selectedSite.title}</h1>
                    <button
                        onClick={handleBack}
                        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 animate-fade-in-delay"
                    >
                        Back to Previews
                    </button>
                    <iframe
                        src={selectedSite.url}
                        title={selectedSite.title}
                        className="w-full h-full border-none rounded-lg shadow-lg animate-slide-up"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                </div>
            )}

            {/* CSS Animations */}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeInDelay {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fadeIn 0.5s ease-in-out;
                    }
                    .animate-fade-in-delay {
                        animation: fadeInDelay 0.5s ease-in-out 0.2s backwards;
                    }
                    .animate-slide-up {
                        animation: slideUp 0.5s ease-in-out;
                    }
                    .transition-shadow {
                        transition: box-shadow 0.3s ease, transform 0.3s ease;
                    }
                `}
            </style>
        </div>
    );
};

export default WebViewerIndexPage;