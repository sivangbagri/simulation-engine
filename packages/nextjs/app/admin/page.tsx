"use client"
import React from 'react'
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

import { PersonaArray } from './gaming_persona';
import Protected from '~~/components/Protected';


const Admin: React.FC = () => {
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Persona" });


  // const PersonaJson = {
  //     "basic_info": {
  //       "username": "AshutoshSharma",
  //       "screen_name": "ashu_bgmi",
  //       "bio": "Hardcore mobile gamer | BGMI & CoD fanatic | Competing, learning, evolving 🎮📱",
  //       "location": "",
  //       "website": "",
  //       "followers_count": 0,
  //       "following_count": 0,
  //       "account_creation": "2024-07-14T01:01:32.000Z",
  //       "activity_period": "Jul 2024 to May 2025",
  //       "tweet_count": 5635
  //     },
  //     "interests": [
  //       "Mobile Gaming",
  //       "Battle Royale",
  //       "Esports",
  //       "Streaming Platforms",
  //       "Educational Gaming"
  //     ],
  //     "personality_traits": [
  //       "Competitive",
  //       "Ambitious",
  //       "Disciplined",
  //       "Purpose-driven",
  //       "Resilient"
  //     ],
  //     "communication_style": {
  //       "tone": "Direct",
  //       "formality": "Semi-formal",
  //       "engagement": [
  //         "Game updates",
  //         "Community insights"
  //       ],
  //       "emoji_usage": "Moderate"
  //     },
  //     "frequent_topics": [
  //       "bgmi",
  //       "valorant",
  //       "callofduty",
  //       "match",
  //       "squad",
  //       "push",
  //       "killstreak",
  //       "grind",
  //       "ranked",
  //       "tournament"
  //     ],
  //     "top_hashtags": [
  //       "BGMI",
  //       "HardcoreGamer",
  //       "MobileEsports",
  //       "CODMobile",
  //       "GrindSeason",
  //       "PushToConqueror",
  //       "ClutchPlay",
  //       "OnlineTournaments",
  //       "GameAndLearn",
  //       "EduGaming"
  //     ],
  //     "activity_patterns": {
  //       "most_active_hours": [
  //         18,
  //         21,
  //         22
  //       ],
  //       "most_active_days": [
  //         "Friday",
  //         "Saturday",
  //         "Sunday"
  //       ],
  //       "posting_frequency": "High (multiple times a day)"
  //     },
  //     "social_interactions": {
  //       "most_mentioned_users": [
  //         "bgmi_official",
  //         "codmobile_esports",
  //         "ffupdates",
  //         "valorantzone",
  //         "edugamers"
  //       ],
  //       "reply_percentage": 67.8,
  //       "retweet_percentage": 5.4,
  //       "interaction_style": "Focused on performance & learning"
  //     },
  //     "likes_analysis": {
  //       "top_liked_hashtags": [
  //         "BGMI",
  //         "MobileEsports",
  //         "GameAndLearn"
  //       ],
  //       "liked_topics": [
  //         "kill",
  //         "squad",
  //         "match",
  //         "rank",
  //         "skills",
  //         "xp",
  //         "tournament",
  //         "education",
  //         "streaming",
  //         "learning",
  //         "leaderboard"
  //       ]
  //     }
  //   }

  const setNewPersona = async () => {
    try {

      for (const PersonaJson of PersonaArray) {
        const privateKey = generatePrivateKey()
        const randomAccount = privateKeyToAccount(privateKey);
        await writeYourContractAsync(
          {
            functionName: "setPersonaFor",
            args: [
              randomAccount.address,
              JSON.stringify({
                address: randomAccount.address,
                niche: "gaming",
                ...PersonaJson
              }),
              BigInt(5)
            ],
          },
          {
            onBlockConfirmation: (txnReceipt: any) => {
              console.log("📦 Transaction blockHash", txnReceipt.blockHash);
            },
          },
        );
      }
      console.log("All personas set successfully!");
    } catch (e) {
      console.log("error ", e)
    }

  }
  return (
    <Protected>
      <div className='flex justify-center items-center h-screen'>
        <button className='p-5 bg-purple-300 font-semibold rounded-md cursor-pointer' onClick={setNewPersona}>Add</button>
      </div>
    </Protected>
  )
}

export default Admin
