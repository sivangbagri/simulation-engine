import { Badge } from "~~/components/ui/badge"
import { Card } from "~~/components/ui/card"

export interface PersonaData {
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

export default function PersonaCard({ data }: PersonaCardProps) {
  // Determine activity level based on tweet count
  const getActivityLevel = (tweetCount: number) => {
    if (tweetCount > 10000) return { level: "high", color: "bg-green-500", text: "activity" }
    if (tweetCount > 5000) return { level: "medium", color: "bg-yellow-500", text: "activity" }
    return { level: "low", color: "bg-red-500", text: "activity" }
  }

  const activity = getActivityLevel(data.basic_info.tweet_count)

  return (
    <Card className="w-full max-w-xl bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl shadow-md backdrop-blur-sm">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
  
      {/* Avatar + Activity */}
      <div className="flex flex-col items-center gap-3 sm:w-1/4">
        <div className="w-20 h-20 rounded-full border border-white/10 bg-black/30 flex items-center justify-center text-3xl font-semibold text-white">
          {data.basic_info.username.charAt(0).toUpperCase()}
        </div>
        <Badge className={`${activity.color} text-white text-xs font-medium rounded-xl px-3 py-1`}>
          {activity.level} {activity.text}
        </Badge>
      </div>
  
      {/* User Info */}
      <div className="flex-1 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{data.basic_info.username}</h2>
          <p className="text-sm text-white/50">@{data.basic_info.screen_name}</p>
        </div>
  
        {/* Interests */}
        <div className="flex flex-wrap gap-2">
          {data.interests.map((interest, index) => (
            <Badge
              key={index}
              className="bg-white/5 border border-white/10 text-white text-xs rounded-full px-3 py-1 hover:bg-white/10 transition"
            >
              {interest}
            </Badge>
          ))}
        </div>
  
        {/* Hashtags */}
        <div className="flex flex-wrap gap-2">
          {data.top_hashtags.slice(0, 7).map((hashtag, index) => (
            <Badge
              key={index}
              className="bg-white text-black text-xs font-medium rounded-full px-3 py-1 hover:bg-white/90 transition"
            >
              #{hashtag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </Card>
  

  )
}
