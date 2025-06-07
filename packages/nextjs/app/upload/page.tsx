"use client"

import React, { useState, useRef } from 'react';
import { Upload, FileArchive, Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadState {
    isDragging: boolean;
    file: File | null;
    isUploaded: boolean;
    error: string | null;
}

const TwitterArchiveUploader: React.FC = () => {
    const [uploadState, setUploadState] = useState<UploadState>({
        isDragging: false,
        file: null,
        isUploaded: false,
        error: null
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setUploadState(prev => ({ ...prev, isDragging: true }));
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setUploadState(prev => ({ ...prev, isDragging: false }));
    };

    const validateFile = (file: File): string | null => {
        if (!file.name.toLowerCase().endsWith('.zip')) {
            return 'Please upload a ZIP file';
        }
        // if (file.size > 500 * 1024 * 1024) { // 500MB limit
        //     return 'File size must be less than 500MB';
        // }
        return null;
    };

    const handleFileUpload = async (file: File): Promise<void> => {
        const error = validateFile(file);
        if (error) {
            setUploadState(prev => ({ ...prev, error, isDragging: false }));
            return;
        }
        try {
            const formData = new FormData();
            formData.append('file', file)
            const res = await fetch("api/persona", {
                method: 'POST',
                body: formData
            })
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Upload failed");
            }
            console.log("Upload result:", result);
            setUploadState({
                isDragging: false,
                file,
                isUploaded: true,
                error: null
            });
        } catch (err: any) {
            setUploadState(prev => ({
                ...prev,
                isUploaded: false,
                error: err.message || "An unexpected error occurred"
            }));
        };
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleUploadClick = (): void => {
        fileInputRef.current?.click();
    };

    const resetUpload = (): void => {
        setUploadState({
            isDragging: false,
            file: null,
            isUploaded: false,
            error: null
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6">
            <div className="max-w-4xl mx-auto">



                {/* Upload Area */}
                <div className="bg-neutral-900/30 backdrop-blur-sm rounded-xl border border-neutral-800/30 shadow-lg overflow-hidden">
                    {!uploadState.isUploaded ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleUploadClick}
                            className={`p-12 text-center cursor-pointer transition-all duration-200 ${uploadState.isDragging
                                ? 'bg-neutral-800/50 border-neutral-600/50'
                                : 'hover:bg-neutral-800/30'
                                }`}
                        >
                            <div className="flex flex-col items-center space-y-4">
                                <div className={`p-4 rounded-full transition-colors ${uploadState.isDragging ? 'bg-blue-500/20' : 'bg-neutral-800/50'
                                    }`}>
                                    <Upload size={48} className={uploadState.isDragging ? 'text-blue-400' : 'text-neutral-400'} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-neutral-100 mb-2">
                                        {uploadState.isDragging ? 'Drop your archive here' : 'Upload Twitter Archive'}
                                    </h3>
                                    <p className="text-neutral-400 mb-4">
                                        Drag and drop your ZIP file here, or click to browse
                                    </p>
                                    <button className="px-6 py-3 bg-white text-black hover:bg-neutral-100 rounded-lg font-medium transition-colors shadow-lg">
                                        Choose File
                                    </button>
                                </div>
                                <p className="text-sm text-neutral-500">Supports ZIP files up to 500MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <CheckCircle size={24} className="text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-neutral-100">Archive Uploaded Successfully</h3>
                                        <p className="text-neutral-400 text-sm">Ready for processing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={resetUpload}
                                    className="px-4 py-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition-colors"
                                >
                                    Upload Different File
                                </button>
                            </div>

                            <div className="bg-neutral-800/30 rounded-lg p-4 flex items-center space-x-4">
                                <FileArchive size={20} className="text-neutral-400" />
                                <div className="flex-1">
                                    <p className="text-neutral-200 font-medium">{uploadState.file?.name}</p>
                                    <p className="text-neutral-400 text-sm">{uploadState.file && formatFileSize(uploadState.file.size)}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex space-x-4">
                                <button className="flex-1 px-6 py-3 bg-white text-black hover:bg-neutral-100 rounded-lg font-medium transition-colors shadow-lg">
                                    Start Analysis
                                </button>
                                <button className="px-6 py-3 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg font-medium transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Instructions */}
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-neutral-800/50 shadow-xl my-5">
                    <h2 className="text-xl font-semibold mb-4 text-neutral-100 flex items-center space-x-2">
                        <Download size={20} />
                        <span>How to get your Twitter Archive</span>
                    </h2>
                    <div className="space-y-3 text-neutral-300">
                        <div className="flex items-start space-x-3">
                            <span className="text-neutral-400 font-mono text-sm bg-neutral-800/50 rounded px-2 py-1 mt-0.5">1</span>
                            <p>Go to <strong>Settings and privacy</strong> → <strong>Your account</strong> → <strong>Download an archive of your data</strong></p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-neutral-400 font-mono text-sm bg-neutral-800/50 rounded px-2 py-1 mt-0.5">2</span>
                            <p>Enter your password and click <strong>Request archive</strong></p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-neutral-400 font-mono text-sm bg-neutral-800/50 rounded px-2 py-1 mt-0.5">3</span>
                            <p>Wait for the email from Twitter (usually takes 24-48 hours)</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <span className="text-neutral-400 font-mono text-sm bg-neutral-800/50 rounded px-2 py-1 mt-0.5">4</span>
                            <p>Download the ZIP file from the email and upload it here</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-sm flex items-start space-x-2">
                            <ExternalLink size={16} className="mt-0.5 flex-shrink-0" />
                            <span>Need help? Visit <strong>Twitter Help Center</strong> for detailed instructions</span>
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {uploadState.error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3">
                        <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                        <p className="text-red-300">{uploadState.error}</p>
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileInputChange}
                    className="hidden"
                />


            </div>
        </div>
    );
};

export default TwitterArchiveUploader;