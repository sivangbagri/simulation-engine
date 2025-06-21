"use client"
import React from 'react'
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi"

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
 
import { PersonaArray } from './gaming_persona';


const Admin: React.FC = () => {
    const { writeContractAsync: writeYourContractAsync, isPending } = useScaffoldWriteContract({ contractName: "Persona" });
    const privateKey = generatePrivateKey()
    const randomAccount = privateKeyToAccount(privateKey);

    const PersonaJson = {
        "basic_info": {
            "username": "AdarshPal",
            "screen_name": "adarsh_bgmi",
            "bio": "Mobile gamer | BGMI grinder | Loves competition 🎮",
            "location": "",
            "website": "",
            "followers_count": 0,
            "following_count": 0,
            "account_creation": "2023-01-10T10:15:00.000Z",
            "activity_period": "Jan 2023 to May 2025",
            "tweet_count": 8290
        },
        "interests": [
            "Mobile Gaming",
            "Esports",
            "Streaming",
            "Competitive Gaming",
            "Gaming Communities"
        ],
        "personality_traits": [
            "Competitive",
            "Focused",
            "Social",
            "Curious",
            "Adaptive"
        ],
        "communication_style": {
            "tone": "Energetic",
            "formality": "Casual",
            "engagement": [
                "Conversational",
                "Reaction-based"
            ],
            "emoji_usage": "Frequent"
        },
        "frequent_topics": [
            "bgmi",
            "tournament",
            "team",
            "gameplay",
            "stream",
            "device",
            "rank",
            "clutch",
            "opponent",
            "grind"
        ],
        "top_hashtags": [
            "BGMI",
            "MobileGaming",
            "Esports",
            "GamingCommunity",
            "ClutchMoment",
            "TournamentTime",
            "SquadGoals",
            "StreamingLive",
            "GGWP",
            "GrindNeverStops"
        ],
        "activity_patterns": {
            "most_active_hours": [
                21,
                17,
                23
            ],
            "most_active_days": [
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "posting_frequency": "Active (daily, especially evenings)"
        },
        "social_interactions": {
            "most_mentioned_users": [
                "zenet_official",
                "bgmi_tournaments",
                "valorantupdates",
                "freefirecommunity",
                "codmobile_esports"
            ],
            "reply_percentage": 64.3,
            "retweet_percentage": 9.1,
            "interaction_style": "Community-driven & competitive"
        },
        "likes_analysis": {
            "top_liked_hashtags": [
                "BGMI",
                "Esports",
                "MobileGaming"
            ],
            "liked_topics": [
                "clutch",
                "match",
                "team",
                "game",
                "op",
                "grind",
                "tournament",
                "rankpush",
                "streaming",
                "community"
            ]
        }
    }
    const { address: connectedAddress } = useAccount();
    const setNewPersona = async () => {
        try {
            await writeYourContractAsync(
                {
                    functionName: "setPersonaFor",
                    args: [randomAccount.address, JSON.stringify({ address: randomAccount.address, niche: "gaming", ...PersonaJson }),5],

                },
                {
                    onBlockConfirmation: (txnReceipt: any) => {
                        console.log("📦 Transaction blockHash", txnReceipt.blockHash);
                    },
                },
            );


        } catch (e) {
            console.log("error ", e)
        }

    }
    return (
        <div className='flex justify-center items-center h-screen'>
            <button className='p-5 bg-purple-300 font-semibold rounded-md cursor-pointer' onClick={setNewPersona}>Add</button>
        </div>
    )
}

export default Admin
