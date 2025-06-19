import {
  BarChart4,
  Hash,
  MapPin,
  MessageSquareText,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react"

import { Badge } from "~~/components/ui/badge"
import { Card } from "~~/components/ui/card"
import { BlockieAvatar } from "~~/components/scaffold-eth"

export interface PersonaData {
  address: `0x${string}`
  niche: string
  basic_info: {
    username: string
    screen_name: string
    bio: string
    location: string
    website: string
    followers_count: number
    following_count: number
    account_creation: string
    activity_period: string
    tweet_count: number
  }
  interests: string[]
  personality_traits: string[]
  communication_style: {
    tone: string
    formality: string
    engagement: string[]
    emoji_usage: string
  }
  frequent_topics: string[]
  top_hashtags: string[]
  activity_patterns: {
    most_active_hours: number[]
    most_active_days: string[]
    posting_frequency: string
  }
  social_interactions: {
    most_mentioned_users: string[]
    reply_percentage: number
    retweet_percentage: number
    interaction_style: string
  }
  likes_analysis: {
    top_liked_hashtags: string[]
    liked_topics: string[]
  }
}

interface PersonaCardProps {
  data: PersonaData
}

// Helper for formatting large numbers
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num)
}

export default function PersonaCard({ data }: PersonaCardProps) {
  // Determine activity level and associated styling
  const getActivityLevel = (tweetCount: number) => {
    if (tweetCount > 10000)
      return {
        level: "Very High",
        style:
          "bg-green-900/50 text-green-300 border-green-700/60 hover:bg-green-900/80",
      }
    if (tweetCount > 5000)
      return {
        level: "High",
        style:
          "bg-teal-900/50 text-teal-300 border-teal-700/60 hover:bg-teal-900/80",
      }
    if (tweetCount > 1000)
      return {
        level: "Medium",
        style:
          "bg-yellow-900/50 text-yellow-300 border-yellow-700/60 hover:bg-yellow-900/80",
      }
    return {
      level: "Low",
      style: "bg-red-900/50 text-red-300 border-red-700/60 hover:bg-red-900/80",
    }
  }

  const activity = getActivityLevel(data.basic_info.tweet_count)

  return (
    <Card className="w-full max-w-md bg-[#111113] border border-white/10 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:border-white/20 hover:shadow-sky-500/10">
      {/* Header Section */}
      <div className="flex items-start gap-5">
        {/* Avatar - now clean without any indicators on it */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full border-2 border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg ring-4 ring-slate-800/30">
            <BlockieAvatar
              address={
                data.address || "0x34aA3F359A9D614239015126635CE7732c18fDF3"
              }
              size={70}
            />
          </div>
        </div>

        {/* User Info Section */}
        <div className="flex-1 pt-1">
           <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-2xl font-bold text-white leading-tight">
              {data.basic_info.username}
            </h2>
            <Badge
              className={`${activity.style} text-xs font-semibold rounded-full px-3 py-1 border transition-colors flex items-center gap-1.5 cursor-default`}
            >
              <BarChart4 size={14} />
              {activity.level}
            </Badge>
          </div>

          <p className="text-md font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
            @{data.basic_info.screen_name}
          </p>
          {data.basic_info.location && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <MapPin size={14} />
              <span>{data.basic_info.location}</span>
            </div>
          )}
        </div>
      </div>

      

      {/* Interests & Hashtags */}
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.interests.slice(0, 5).map((interest, index) => (
              <Badge
                key={index}
                className="bg-sky-900/40 border border-sky-700/50 text-sky-300 text-xs rounded-full px-3 py-1 hover:bg-sky-900/70 transition flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Top Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.top_hashtags.slice(0, 4).map((hashtag, index) => (
              <Badge
                key={index}
                className="bg-white/10 border border-white/20 text-white text-xs font-medium rounded-full px-3 py-1 hover:bg-white/20 transition flex items-center gap-1.5"
              >
                <Hash size={12} />
                {hashtag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}