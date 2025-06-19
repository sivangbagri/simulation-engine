"use client"

import React, { useState, useRef } from 'react';
import { useAccount } from "wagmi";

import { Upload, FileArchive, Download, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PersonaCard from "~~/components/Persona/PersonaCard"
interface UploadState {
    isDragging: boolean;
    file: File | null;
    isUploaded: boolean;
    error: string | null;
    isProcessing: boolean;
    processingStep: string;
}
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

import { PersonaData } from "~~/components/Persona/PersonaCard"
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const TwitterArchiveUploader: React.FC = () => {
    const sampleData = {
        basic_info: {
            address:"0x123",
            niche:"string",
            username: "WhySid",
            screen_name: "Sidhanth_here",
            bio: "",
            location: "",
            website: "",
            followers_count: 0,
            following_count: 0,
            account_creation: "2022-08-31T13:49:36.815Z",
            activity_period: "Sep 2022 to May 2025",
            tweet_count: 15716,
        },
        interests: ["Finance", "Crypto/Blockchain", "Gaming", "Technology", "Sports"],
        personality_traits: ["Creative", "Independent", "Optimistic", "Curious", "Collaborative"],
        communication_style: {
            tone: "Neutral",
            formality: "Semi-formal",
            engagement: ["Conversational"],
            emoji_usage: "Occasional",
        },
        frequent_topics: ["https", "hai", "mai", "nahi", "toh", "time", "one", "people", "bhai", "like"],
        top_hashtags: [
            "100DaysOfHustle",
            "100DaysOfCode",
            "100DaysofHustle",
            "100daysofcodechallenge",
            "100daysofcodepython",
            "buildinpublic",
            "startups",
            "NewProfilePic",
            "buildinginpublic",
            "Entrepreneurship",
        ],
        activity_patterns: {
            most_active_hours: [19, 8, 11],
            most_active_days: ["Monday", "Thursday", "Friday"],
            posting_frequency: "Very active (multiple posts daily)",
        },
        social_interactions: {
            most_mentioned_users: ["avgphoenixguy", "_rishabh__r4", "shivuuuuu264", "pennedbyher", "aShubhamz"],
            reply_percentage: 71.9,
            retweet_percentage: 2.9,
            interaction_style: "Highly interactive",
        },
        likes_analysis: {
            top_liked_hashtags: [],
            liked_topics: [
                "https",
                "hai",
                "people",
                "like",
                "one",
                "bhai",

            ],
        },
    }
    const [currentPersona, setCurrentPersona] = useState<PersonaData>(sampleData);
    const [uploadState, setUploadState] = useState<UploadState>({
        isDragging: false,
        file: null,
        isUploaded: false,
        error: null,
        isProcessing: false,
        processingStep: ''
    });
    const { address: connectedAddress } = useAccount();

    const { writeContractAsync: writeYourContractAsync, isPending } = useScaffoldWriteContract({ contractName: "Persona" });


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!uploadState.isProcessing) {
            setUploadState(prev => ({ ...prev, isDragging: true }));
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!uploadState.isProcessing) {
            setUploadState(prev => ({ ...prev, isDragging: false }));
        }
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

        setUploadState(prev => ({
            ...prev,
            isProcessing: true,
            isDragging: false,
            error: null,
            processingStep: 'Uploading and processing archive...'
        }));

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

            setCurrentPersona(result.persona) // {success : bool , message : string , persona: {}}

            setUploadState(prev => ({
                ...prev,
                processingStep: 'Saving to blockchain...'
            }));

            console.log("Upload result:", result);

            // saving on chain 
            try {
                await writeYourContractAsync(
                    {
                        functionName: "setPersona",
                        args: [JSON.stringify({ address: connectedAddress, niche: "generic", ...result.persona })],

                    },
                    {
                        onBlockConfirmation: (txnReceipt: any) => {
                            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
                        },
                    },
                );

                setUploadState(prev => ({
                    ...prev,
                    file,
                    isUploaded: true,
                    isProcessing: false,
                    processingStep: ''
                }));

            } catch (e) {
                console.error("Error setting persona:", e);
                setUploadState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: "Failed to save to blockchain. Please try again."
                }));
            }

        } catch (err: any) {
            setUploadState(prev => ({
                ...prev,
                isUploaded: false,
                isProcessing: false,
                error: err.message || "An unexpected error occurred"
            }));
        };
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!uploadState.isProcessing) {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (!uploadState.isProcessing) {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        }
    };

    const handleUploadClick = (): void => {
        if (!uploadState.isProcessing) {
            fileInputRef.current?.click();
        }
    };

    const resetUpload = (): void => {
        if (!uploadState.isProcessing && !isPending) {
            setUploadState({
                isDragging: false,
                file: null,
                isUploaded: false,
                error: null,
                isProcessing: false,
                processingStep: ''
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

                {/* Error Message */}
                {uploadState.error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3">
                        <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                        <p className="text-red-300">{uploadState.error}</p>
                    </div>
                )}

                {/* Upload Area */}
                <div className="bg-neutral-900/30 backdrop-blur-sm rounded-xl border border-neutral-800/30 shadow-lg overflow-hidden">
                    {connectedAddress ? uploadState.isProcessing ? (
                        <div className="p-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 rounded-full bg-blue-500/20">
                                    <Loader2 size={48} className="text-blue-400 animate-spin" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-neutral-100 mb-2">
                                        Processing Archive
                                    </h3>
                                    <p className="text-neutral-400 mb-4">
                                        {uploadState.processingStep}
                                    </p>
                                    {isPending && (
                                        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Waiting for blockchain confirmation...</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-500">This may take a few moments</p>
                            </div>
                        </div>
                    ) : !uploadState.isUploaded ? (
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
                        <>
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
                                        disabled={uploadState.isProcessing || isPending}
                                        className={`px-4 py-2 rounded-lg transition-colors ${uploadState.isProcessing || isPending
                                            ? 'text-neutral-600 cursor-not-allowed'
                                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                                            }`}
                                    >
                                        {uploadState.isProcessing || isPending ? (
                                            <div className="flex items-center space-x-2">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            'Upload Different File'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className='flex justify-center'> {<PersonaCard data={currentPersona} />}</div>
                        </>
                    )
                        : <p className='flex justify-center items-center mx-auto my-10'> <RainbowKitCustomConnectButton /> </p>}
                </div>
                {/* Instructions */}
                <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-neutral-800/50 shadow-xl my-7">
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



                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={uploadState.isProcessing}
                />


            </div>
        </div>
    );
};

export default TwitterArchiveUploader;