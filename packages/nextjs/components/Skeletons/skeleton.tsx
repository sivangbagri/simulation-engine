import React from 'react';

export const SkeletonBar = ({ width = "100%" }: { width?: string }) => (
    <div
        className="bg-neutral-700 rounded-full h-2 animate-pulse"
        style={{ width }}
    />
);

export const SkeletonText = ({ width = "100%", height = "h-4" }: { width?: string, height?: string }) => (
    <div
        className={`bg-neutral-700 rounded ${height} animate-pulse`}
        style={{ width }}
    />
);
