import React from 'react';

// Define the types for the component's props
interface WebViewerFrameProps {
    title: string;
    embedUrl: string;
}

const WebViewerFrame: React.FC<WebViewerFrameProps> = ({ title, embedUrl }) => {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ flexShrink: 0 }}>{title}</h2>

            {/* The iframe will fill the remaining space */}
            <iframe
                src={embedUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                }}
                title={title}
                allow="fullscreen; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />

            {/* The download button has been removed to fix the error and make the component more generic. */}
        </div>
    );
};

export default WebViewerFrame;