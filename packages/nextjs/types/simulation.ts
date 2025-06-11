export interface Question {
    id: string;
    text: string;
    options: Option[];
  }
  
  export interface Option {
    id: string;
    text: string;
  }
  
  export interface Survey {
    title: string;
    description: string;
    questions: Question[];
  }
  
  export interface Persona {
    address:`0x${string}`
    niche:string
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
    interests: string[];
    personality_traits: string[];
    communication_style: {
      tone: string
      formality: string
      engagement: string[]
      emoji_usage: string
    }
    frequent_topics: string[];
    top_hashtags: string[];
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
  
  export interface SimulationInput {
    survey: Survey;
    personas: Persona[];
  }
  
  export interface SimulationResponse {
    question_id: string;
    question: string;
    selected_option_id: string;
    selected_option_text: string;
  }
  
  export interface SimulationResult {
    persona: string;
    responses: SimulationResponse[];
  }
  
  export interface SimulationOutput {
    results: SimulationResult[];
  }