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
    <Card className="w-full max-w-2xl bg-black border-white/20 border-2 p-6 text-white rounded-2xl">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full border-2 border-white/30 bg-transparent flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{data.basic_info.username.charAt(0).toUpperCase()}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Username and Screen Name */}
          <div>
            <h2 className="text-2xl font-bold text-white">{data.basic_info.username}</h2>
            <p className="text-white/70 text-sm">@{data.basic_info.screen_name}</p>
          </div>

          {/* Interests */}
          <div className="flex flex-wrap gap-2">
            {data.interests.map((interest, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full px-3 py-1"
              >
                {interest}
              </Badge>
            ))}
          </div>

          {/* Top Hashtags - Individual Pills */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {data.top_hashtags.slice(0, 7).map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full px-3 py-1 text-xs"
                >
                  #{hashtag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Indicator */}
        <div className="flex-shrink-0">
          <Badge className={`${activity.color} text-white hover:${activity.color}/90 rounded-full px-3 py-1`}>
            {activity.level} {activity.text}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
