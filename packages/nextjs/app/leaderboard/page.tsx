"use client"
import React, { useEffect } from 'react';
import { Card } from '~~/components/ui/card';
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

import { BlockieAvatar } from "~~/components/scaffold-eth"


const Leaderboard: React.FC = () => {


    const { data: leaderboardData } = useScaffoldReadContract({
        contractName: "Persona",
        functionName: "getLeaderboard"
    })

    const [userAddresses, userpoints] = leaderboardData || [[], []];

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
                <div className="  px-6 py-3 border-b border-neutral-700">
                    <div className="flex justify-between items-center text-neutral-300 text-sm font-semibold uppercase tracking-wider">
                        <span className="w-16 text-center">Rank</span>
                        <span className="flex-1 text-left pl-6">User</span>
                        <span className="w-24 text-right">Points</span>
                    </div>
                </div>

                {/* Entries */}
                <div className="divide-y divide-neutral-700">
                    {userAddresses.map((address: string, index: number) => (
                        <div
                            key={address}
                            className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors duration-200 ease-in-out"
                        >
                            {/* Rank */}
                            <div className="flex items-center justify-center w-16">
                                <span
                                    className={`
                    font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center
                     
                  `}
                                >
                                    1
                                </span>
                            </div>

                            {/* User */}
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow border-2 border-neutral">

                                    <BlockieAvatar
                                        address={
                                            address 
                                        }
                                        size={70}
                                    />
                                </div>
                                <div className="flex flex-col text-left">
                                    {/* <div className="text-neutral-100 font-medium text-base leading-tight">
                                        {addressToPersona(address).basic_info.}
                                    </div> */}
                                    <div className="text-neutral-400 text-xs leading-tight">
                                    {address.slice(0, 6)}...{address.slice(-4)}

                                    </div>
                                </div>
                            </div>

                            {/* Points */}
                            <div className="flex items-center justify-end w-24">
                                <span className="text-neutral-100 font-bold text-lg">
                                    {userpoints[index]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Leaderboard;
