"use client"
import React, { useEffect, useMemo } from 'react';
import { Card } from '~~/components/ui/card';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

import { BlockieAvatar } from "~~/components/scaffold-eth"
import { useAccount } from "wagmi"
import { SkeletonText } from '../result/page';

const Leaderboard: React.FC = () => {
    const { address: connectedAddress } = useAccount()
    const { data: leaderboardData, isFetched } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getLeaderboard"
    })

    const [userAddresses, userpoints] = leaderboardData || [[], []];

    // Sort users by points in descending order
    const sortedLeaderboard = useMemo(() => {
        if (!userAddresses || !userpoints) return [];

        const combined = userAddresses.map((address: string, index: number) => ({
            address,
            points: userpoints[index]
        }));

        return combined.sort((a, b) => {
            // Handle BigInt comparison
            const pointsA = BigInt(a.points);
            const pointsB = BigInt(b.points);

            if (pointsB > pointsA) return 1;
            if (pointsB < pointsA) return -1;
            return 0;
        });
    }, [userAddresses, userpoints]);

    // Get rank styling based on position
    const getRankStyling = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    containerClass: "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
                    rankClass: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 shadow-lg shadow-yellow-500/25",
                    icon: ""
                };
            case 2:
                return {
                    containerClass: "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30",
                    rankClass: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 shadow-lg shadow-gray-400/25",
                    icon: ""
                };
            case 3:
                return {
                    containerClass: "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30",
                    rankClass: "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-900 shadow-lg shadow-amber-600/25",
                    icon: ""
                };
            default:
                return {
                    containerClass: "",
                    rankClass: "bg-neutral-700 text-neutral-300",
                    icon: ""
                };
        }
    };


    return (

        <div className="min-h-screen bg-neutral-950 text-neutral-50 py-12 px-6 flex flex-col items-center">
            {/* Title Section */}
            <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-neutral-400 mb-8 text-sm text-center">
                View top contributors ranked by points
            </p>

            {/* Card */}
            <Card className="py-2 w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden gap-0">
                {/* Header Row */}
                <div className="px-6 py-4 border-b border-neutral-700">
                    <div className="flex justify-between items-center text-neutral-400 text-sm font-semibold uppercase tracking-widest">
                        <span className="w-20 text-center">Rank</span>
                        <span className="flex-1 text-left pl-8">User</span>
                        <span className="w-32 text-right">Points</span>
                    </div>
                </div>


                {/* Entries */}

                {!isFetched ? <div className='p-3'>
                    <SkeletonText height="h-12" /> :
                    <SkeletonText height="h-12" /> :
                    <SkeletonText height="h-12" />
                </div> :
                    <div className="divide-y divide-neutral-700">
                        {sortedLeaderboard.map((user, index) => {
                            const isConnectedUser = connectedAddress === user.address
                            const rank = index + 1;
                            const styling = getRankStyling(rank);

                            return (
                                <div
                                    key={user.address}
                                    className={`px-6 py-4 flex items-center justify-between hover:bg-neutral-800/50 transition-all duration-200 ease-in-out`}
                                >
                                    {/* Rank */}
                                    <div className="flex items-center justify-center w-16">
                                        <div className="flex items-center space-x-1">
                                            <span
                                                className={`
                                                font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center
                                                // ${styling.rankClass}
                                            `}
                                            >
                                                {rank}
                                            </span>
                                            {styling.icon && (
                                                <span className="text-lg">{styling.icon}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* User */}
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow border-2 border-neutral
                                 ${isConnectedUser ? 'ring-2 ring-offset-2 ring-offset-neutral-900 ring-blue-500' : ''}`

                                        }>
                                            <BlockieAvatar
                                                address={user.address}
                                                size={70}
                                            />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <div className="text-neutral-100 font-medium text-base leading-tight">
                                                hivang26
                                            </div>
                                            <div className={`text-neutral-400 text-xs leading-tight ${isConnectedUser ? "font-bold" : ""}`}>
                                                {user.address.slice(0, 6)}...{user.address.slice(-4)}                                             {isConnectedUser && <span className="ml-2 text-blue-400 font-semibold">(You)</span>}

                                            </div>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="flex items-center justify-end w-24">
                                        <span className={`font-bold text-lg ${rank <= 3 ? 'text-white' : 'text-neutral-100'}`}>
                                            {user.points.toString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                }
            </Card>
        </div>
    );
};

export default Leaderboard;