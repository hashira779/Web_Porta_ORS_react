// src/pages/webViewer/WebViewerPage.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { WebViewLink } from '../../types';
import { getWebViewLinks } from '../../api/api';
import { AuthContext } from '../../context/AuthContext';

const WebViewerIndexPage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.currentUser;

    // You can use this log to see the exact role name in your browser's F12 developer console.
    // console.log('CURRENT USER ROLE IS:', currentUser?.role.name);

    const [siteMap, setSiteMap] = useState<WebViewLink[]>([]);
    const [selectedSite, setSelectedSite] = useState<WebViewLink | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLinks = async () => {
            try {
                const response = await getWebViewLinks();
                setSiteMap(response.data);
            } catch (err: any) {
                setError('Failed to load system links. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLinks();
    }, []);

    const handleViewFull = (site: WebViewLink) => {
        setSelectedSite(site);
    };

    const handleBack = () => {
        setSelectedSite(null);
    };

    if (loading) {
        return <div className="text-center p-10 text-xl">Loading Systems...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-xl text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

            {/* This is the main grid view */}
            {!selectedSite && (
                <>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">System Previews</h1>

                        {/* --- CORRECTED LOGIC --- */}
                        {/* Check is now case-insensitive */}
                        {currentUser && currentUser.role.name.toLowerCase() === 'admin' && (
                            <Link to="/webviewer/admin" className="mt-4 inline-block">
                                <button className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-colors">
                                    ⚙️ Manage Links
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {siteMap.map((site) => (
                            <div
                                key={site.id}
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

            {/* This is the full-screen iframe view */}
            {selectedSite && (
                <div className="flex flex-col items-center h-[90vh]">
                    <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 animate-fade-in">{selectedSite.title}</h1>

                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBack}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300 animate-fade-in-delay"
                        >
                            Back to Previews
                        </button>

                        {/* --- CORRECTED LOGIC --- */}
                        {/* Check is now case-insensitive */}
                        {currentUser && currentUser.role.name.toLowerCase() === 'admin' && (
                            <Link to="/webviewer/admin">
                                <button className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-300 animate-fade-in-delay">
                                    ⚙️ Manage Links
                                </button>
                            </Link>
                        )}
                    </div>

                    <iframe
                        src={selectedSite.url}
                        title={selectedSite.title}
                        className="w-full h-full border-none rounded-lg shadow-lg animate-slide-up"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                </div>
            )}

            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fadeInDelay { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                    .animate-fade-in-delay { animation: fadeInDelay 0.5s ease-in-out 0.2s backwards; }
                    .animate-slide-up { animation: slideUp 0.5s ease-in-out; }
                    .transition-shadow { transition: box-shadow 0.3s ease, transform 0.3s ease; }
                `}
            </style>
        </div>
    );
};

export default WebViewerIndexPage;