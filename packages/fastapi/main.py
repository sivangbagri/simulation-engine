from fastapi import FastAPI, File, UploadFile, HTTPException
from models import *
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import zipfile
import os
import json
import re
from collections import Counter
from datetime import datetime
import io
import google.generativeai as genai
import numpy as np
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
from functools import lru_cache
import hashlib
import json
import asyncio
# import aiohttp

load_dotenv()


app = FastAPI()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class ModelManager:
    _instance = None
    _model = None
    _nltk_initialized = False
    _sia = None
    _stop_words = None
    _word_tokenize = None
    _embedding_cache = {}
    _session = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self.executor = ThreadPoolExecutor(max_workers=4)
            self._setup_session()

    def _setup_session(self):
        """Setup persistent HTTP session for API calls"""
        if self._session is None:
            import requests
            self._session = requests.Session()
            self._session.headers.update({
                'Content-Type': 'application/json',
                'User-Agent': 'PersonaSim/1.0'
            })

    def _cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()

    async def get_embeddings_batch(self, texts: List[str], batch_size: int = 10):
        """Get embeddings in batches with caching"""
        try:
            all_embeddings = []

            # Check cache first
            cached_embeddings = {}
            uncached_texts = []
            text_to_index = {}

            for i, text in enumerate(texts):
                cache_key = self._cache_key(text)
                if cache_key in self._embedding_cache:
                    cached_embeddings[i] = self._embedding_cache[cache_key]
                else:
                    text_to_index[len(uncached_texts)] = i
                    uncached_texts.append(text)

            # Process uncached texts in batches
            new_embeddings = {}
            if uncached_texts:
                for i in range(0, len(uncached_texts), batch_size):
                    batch = uncached_texts[i:i + batch_size]
                    batch_embeddings = await self._get_embeddings_batch_api(batch)

                    for j, embedding in enumerate(batch_embeddings):
                        original_index = text_to_index[i + j]
                        new_embeddings[original_index] = embedding
                        # Cache the result
                        cache_key = self._cache_key(uncached_texts[i + j])
                        self._embedding_cache[cache_key] = embedding

            # Combine cached and new embeddings
            for i in range(len(texts)):
                if i in cached_embeddings:
                    all_embeddings.append(cached_embeddings[i])
                else:
                    all_embeddings.append(new_embeddings[i])

            return np.array(all_embeddings)

        except Exception as e:
            print(f"Batch embedding error: {str(e)}")
            return self._fallback_similarity_batch(texts)

    async def _get_embeddings_batch_api(self, texts: List[str]):
        """Get embeddings from API in batch"""
        try:
            model = 'models/embedding-001'

            # Process texts concurrently
            tasks = []
            for text in texts:
                task = self._get_single_embedding(model, text)
                tasks.append(task)

            embeddings = await asyncio.gather(*tasks, return_exceptions=True)

            # Handle any exceptions
            valid_embeddings = []
            for i, embedding in enumerate(embeddings):
                if isinstance(embedding, Exception):
                    print(f"Error getting embedding for text {i}: {embedding}")
                    # Use fallback for this text
                    valid_embeddings.append(self._simple_embedding(texts[i]))
                else:
                    valid_embeddings.append(embedding)

            return valid_embeddings

        except Exception as e:
            print(f"API batch error: {str(e)}")
            return [self._simple_embedding(text) for text in texts]

    async def _get_single_embedding(self, model, text: str):
        """Get single embedding asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: genai.embed_content(
                model=model,
                content=text,
                task_type="semantic_similarity"
            )['embedding']
        )

    def _simple_embedding(self, text: str) -> List[float]:
        """Simple embedding fallback"""
        words = text.lower().split()
        # Create a simple hash-based embedding
        hash_val = hash(text) % (2**31)
        embedding = [float((hash_val >> i) & 1)
                     for i in range(384)]  # 384-dim vector
        return embedding

    def _fallback_similarity_batch(self, texts: List[str]):
        """Batch fallback similarity"""
        embeddings = []
        for text in texts:
            embedding = self._simple_embedding(text)
            embeddings.append(embedding)
        return np.array(embeddings)

    @lru_cache(maxsize=1000)
    def cosine_similarity_cached(self, vec1_tuple, vec2_tuple):
        """Cached cosine similarity"""
        vec1 = np.array(vec1_tuple)
        vec2 = np.array(vec2_tuple)
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0
        return dot_product / (norm1 * norm2)

    def cosine_similarity(self, vec1, vec2):
        """Calculate cosine similarity with caching"""
        return self.cosine_similarity_cached(tuple(vec1), tuple(vec2))

    def batch_cosine_similarity(self, persona_embedding, option_embeddings):
        """Vectorized cosine similarity calculation"""
        persona_embedding = np.array(persona_embedding).reshape(1, -1)
        option_embeddings = np.array(option_embeddings)

        # Vectorized cosine similarity
        dot_products = np.dot(option_embeddings, persona_embedding.T).flatten()
        norms1 = np.linalg.norm(option_embeddings, axis=1)
        norm2 = np.linalg.norm(persona_embedding)

        # Avoid division by zero
        norms1[norms1 == 0] = 1e-8
        if norm2 == 0:
            norm2 = 1e-8

        similarities = dot_products / (norms1 * norm2)
        return similarities

    def get_nltk_components(self):
        if not self._nltk_initialized:
            try:
                print("Initializing NLTK components...")
                import nltk
                nltk.download('punkt_tab', quiet=True)
                nltk.download('wordnet', quiet=True)
                nltk.download('omw-1.4', quiet=True)
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('vader_lexicon', quiet=True)

                from nltk.sentiment import SentimentIntensityAnalyzer
                from nltk.corpus import stopwords
                from nltk.tokenize import word_tokenize
                self._sia = SentimentIntensityAnalyzer()
                self._stop_words = set(stopwords.words('english'))
                self._nltk_initialized = True
                self._word_tokenize = word_tokenize
                print("NLTK components initialized")
            except Exception as e:
                print(f"NLTK initialization error: {str(e)}")
                self._nltk_initialized = False

        return self._sia, self._stop_words, self._nltk_initialized, self._word_tokenize


async def simulate_optimized(input: SimulationInput):
    """Optimized simulation with batching and caching"""
    model_manager = ModelManager()

    # Pre-process all persona summaries
    persona_summaries = []
    for persona in input.personas:
        p = persona
        summary = " ".join([
            " ".join(p.interests),
            " ".join(p.personality_traits),
            " ".join(p.frequent_topics),
            " ".join(p.top_hashtags),
            " ".join(p.likes_analysis.get("liked_topics", []))
        ])
        persona_summaries.append(summary)

    # Pre-process all question-option combinations
    all_question_options = []
    question_option_map = {}

    for q_idx, q in enumerate(input.survey.questions):
        for opt_idx, opt in enumerate(q.options):
            option_text = f"{q.text} {opt.text}"
            all_question_options.append(option_text)
            question_option_map[len(
                all_question_options) - 1] = (q_idx, opt_idx)

    # Get all embeddings in one batch
    all_texts = persona_summaries + all_question_options
    print(f"Getting embeddings for {len(all_texts)} texts...")

    start_time = time.time()
    all_embeddings = await model_manager.get_embeddings_batch(all_texts, batch_size=20)
    embedding_time = time.time() - start_time
    print(f"Embeddings completed in {embedding_time:.2f} seconds")

    # Split embeddings
    persona_embeddings = all_embeddings[:len(persona_summaries)]
    option_embeddings = all_embeddings[len(persona_summaries):]

    # Process results
    results = []

    # Process personas in parallel
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_persona = {}

        for p_idx, persona in enumerate(input.personas):
            future = executor.submit(
                process_persona_optimized,
                persona,
                persona_embeddings[p_idx],
                input.survey,
                option_embeddings,
                question_option_map,
                model_manager
            )
            future_to_persona[future] = p_idx

        for future in as_completed(future_to_persona):
            persona_idx = future_to_persona[future]
            try:
                persona_result = future.result()
                results.append(persona_result)
            except Exception as e:
                print(f"Error processing persona {persona_idx}: {str(e)}")
                # Add fallback result
                results.append({
                    "persona": input.personas[persona_idx].basic_info.get("username", "unknown"),
                    "responses": []
                })

    return {"results": results}


def process_persona_optimized(persona, persona_embedding, survey, option_embeddings, question_option_map, model_manager):
    """Process a single persona optimized"""
    persona_result = {
        "persona": persona.basic_info.get("username", "unknown"),
        "responses": []
    }

    # Process each question
    current_option_idx = 0

    for q_idx, q in enumerate(survey.questions):
        num_options = len(q.options)

        # Get embeddings for this question's options
        question_option_embeddings = option_embeddings[current_option_idx:current_option_idx + num_options]

        # Calculate similarities using vectorized operations
        similarities = model_manager.batch_cosine_similarity(
            persona_embedding, question_option_embeddings)

        # Find best match
        best_idx = np.argmax(similarities)
        selected_option = q.options[best_idx]

        persona_result["responses"].append({
            "question_id": q.id,
            "question": q.text,
            "selected_option_id": selected_option.id,
            "selected_option_text": selected_option.text
        })

        current_option_idx += num_options

    return persona_result


# Initialize model manager
model_manager = ModelManager()


@app.post("/simulate")
async def simulate(input: SimulationInput):
    """Optimized simulation endpoint"""
    try:
        start_time = time.time()
        result = await simulate_optimized(input)
        total_time = time.time() - start_time
        print(f"Total simulation time: {total_time:.2f} seconds")
        return result
    except Exception as e:
        print(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TwitterPersonaGenerator:
    def __init__(self):
        pass

    def _get_nltk_components(self):
        """Get NLTK components lazily"""
        return model_manager.get_nltk_components()

    def load_twitter_archive_from_content(self, tweets_content=None, likes_content=None, account_content=None):
        """Load data from Twitter archive file contents"""
        data = {
            "tweets": [],
            "likes": [],
            "account_info": {}
        }

        # Load tweets
        if tweets_content:
            try:
                # Extract the JSON part from the JavaScript file
                json_str = tweets_content.replace(
                    'window.YTD.tweets.part0 = ', '', 1)
                tweets_data = json.loads(json_str)

                for tweet_obj in tweets_data:
                    if "tweet" in tweet_obj:
                        data["tweets"].append(tweet_obj["tweet"])
                print(f"Successfully loaded {len(data['tweets'])} tweets")
            except Exception as e:
                print(f"Error loading tweets: {str(e)}")

        # Load likes
        if likes_content:
            try:
                # Extract the JSON part from the JavaScript file
                json_str = likes_content.replace(
                    'window.YTD.like.part0 = ', '', 1)
                likes_data = json.loads(json_str)

                for like_obj in likes_data:
                    if "like" in like_obj:
                        data["likes"].append(like_obj["like"])
                print(f"Successfully loaded {len(data['likes'])} likes")
            except Exception as e:
                print(f"Error loading likes: {str(e)}")

        # Load account info
        if account_content:
            try:
                # Extract the JSON part from the JavaScript file
                json_str = account_content.replace(
                    'window.YTD.account.part0 = ', '', 1)
                account_data = json.loads(json_str)

                if account_data and len(account_data) > 0 and "account" in account_data[0]:
                    data["account_info"] = account_data[0]["account"]
                    print(f"Successfully loaded account information")
                else:
                    print("Account information not found in the expected format")
            except Exception as e:
                print(f"Error loading account info: {str(e)}")

        return data

    def extract_tweet_info(self, tweets):
        """Extract basic information from tweets"""
        processed_tweets = []

        for tweet in tweets:
            # Basic tweet info
            tweet_info = {
                "id": tweet.get("id_str", ""),
                "text": tweet.get("full_text", ""),
                "created_at": tweet.get("created_at", ""),
                "favorite_count": int(tweet.get("favorite_count", 0)),
                "retweet_count": int(tweet.get("retweet_count", 0)),
                "is_reply": bool(tweet.get("in_reply_to_status_id_str", "")),
                "is_retweet": tweet.get("retweeted", False) or "RT @" in tweet.get("full_text", "")[:4],
                "mentioned_users": [],
                "hashtags": [],
                "urls": []
            }

            # Extract entities if available
            entities = tweet.get("entities", {})

            # Extract mentioned users
            for mention in entities.get("user_mentions", []):
                tweet_info["mentioned_users"].append(
                    mention.get("screen_name", ""))

            # Extract hashtags
            for hashtag in entities.get("hashtags", []):
                tweet_info["hashtags"].append(hashtag.get("text", ""))

            # Extract URLs
            for url in entities.get("urls", []):
                tweet_info["urls"].append(url.get("expanded_url", ""))

            processed_tweets.append(tweet_info)

        return processed_tweets

    def analyze_posting_patterns(self, tweets):
        """Analyze posting patterns from tweets"""
        if not tweets:
            return {}

        # Extract timestamps
        timestamps = []
        weekdays = []
        hours = []

        for tweet in tweets:
            if tweet["created_at"]:
                try:
                    dt = datetime.strptime(
                        tweet["created_at"], "%a %b %d %H:%M:%S +0000 %Y")
                    timestamps.append(dt)
                    weekdays.append(dt.weekday())
                    hours.append(dt.hour)
                except:
                    pass

        # Calculate patterns
        patterns = {
            "most_active_days": [],
            "most_active_hours": [],
            "posting_frequency": "",
            "activity_period": ""
        }

        if timestamps:
            # Most active days
            day_names = ["Monday", "Tuesday", "Wednesday",
                         "Thursday", "Friday", "Saturday", "Sunday"]
            day_counts = Counter(weekdays)
            patterns["most_active_days"] = [day_names[day]
                                            for day, _ in day_counts.most_common(3)]

            # Most active hours
            hour_counts = Counter(hours)
            patterns["most_active_hours"] = [
                hour for hour, _ in hour_counts.most_common(3)]

            # Posting frequency
            if len(timestamps) > 1:
                time_range = max(timestamps) - min(timestamps)
                days = time_range.days + 1
                posts_per_day = len(timestamps) / max(days, 1)

                if posts_per_day >= 3:
                    patterns["posting_frequency"] = "Very active (multiple posts daily)"
                elif posts_per_day >= 1:
                    patterns["posting_frequency"] = "Active (daily)"
                elif posts_per_day >= 0.3:
                    patterns["posting_frequency"] = "Regular (several posts weekly)"
                elif posts_per_day >= 0.1:
                    patterns["posting_frequency"] = "Occasional (weekly)"
                else:
                    patterns["posting_frequency"] = "Infrequent (monthly or less)"

                # Activity period
                if timestamps:
                    earliest = min(timestamps)
                    latest = max(timestamps)
                    patterns["activity_period"] = f"{earliest.strftime('%b %Y')} to {latest.strftime('%b %Y')}"

        return patterns

    def extract_topics_and_interests(self, tweets):
        """Extract topics and interests from tweets"""
        # Combine all tweet text
        all_text = " ".join([t["text"] for t in tweets if not t["is_retweet"]])
        sia, stop_words, nltk_available, word_tokenize = self._get_nltk_components()
        # Simple word frequency analysis (fallback if NLTK is not available)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', all_text.lower())
        common_words = Counter(words)

        # Use NLTK if available
        if nltk_available:
            try:
                # Tokenize and clean text
                words = word_tokenize(all_text.lower())
                filtered_words = [word for word in words if word.isalpha(
                ) and word not in stop_words and len(word) > 2]
                common_words = Counter(filtered_words)
            except Exception as e:
                print(f"Error in NLTK processing: {str(e)}")

        # Extract hashtags
        all_hashtags = []
        for tweet in tweets:
            all_hashtags.extend(tweet["hashtags"])
        hashtag_freq = Counter(all_hashtags)

        # Define interest categories with related keywords
        interest_categories = {
            "Technology": ["tech", "technology", "coding", "programming", "developer", "software", "hardware", "ai", "ml", "data"],
            "Crypto/Blockchain": ["crypto", "blockchain", "bitcoin", "ethereum", "web3", "defi", "nft", "token", "dao"],
            "Finance": ["finance", "investing", "money", "wealth", "investment", "market", "stock", "financial", "economics"],
            "Gaming": ["game", "gaming", "esports", "player", "play", "gamer", "console", "steam", "xbox", "playstation"],
            "Sports": ["sports", "football", "basketball", "soccer", "nba", "nfl", "athlete", "team", "match", "tournament"],
            "Politics": ["politics", "government", "election", "democracy", "policy", "president", "minister", "campaign"],
            "Entertainment": ["movie", "film", "music", "artist", "actor", "actress", "cinema", "song", "album", "concert"],
            "Science": ["science", "research", "study", "experiment", "discovery", "physics", "biology", "chemistry"],
            "Health": ["health", "fitness", "workout", "exercise", "diet", "nutrition", "wellness", "medical"],
            "Art": ["art", "design", "creative", "artist", "drawing", "painting", "illustration", "photography"]
        }

        # Identify interests based on word frequency
        interests = []
        for category, keywords in interest_categories.items():
            score = sum(common_words.get(word, 0) for word in keywords)
            if score > 0:
                interests.append({"category": category, "score": score})

        # Sort interests by score
        interests.sort(key=lambda x: x["score"], reverse=True)

        # Get top hashtags
        top_hashtags = [tag for tag, count in hashtag_freq.most_common(10)]

        # Get frequent topics (common words)
        common_words_list = [word for word,
                             count in common_words.most_common(20)]

        return {
            "interests": [interest["category"] for interest in interests[:5]],
            "top_hashtags": top_hashtags,
            "frequent_topics": common_words_list
        }

    def analyze_sentiment_and_tone(self, tweets):
        """Analyze sentiment and communication style from tweets"""
        if not tweets:
            return {}

        sia, stop_words, nltk_available, word_tokenize = self._get_nltk_components()

        # Combine all original tweet text (non-retweets)
        original_tweets_text = [t["text"]
                                for t in tweets if not t["is_retweet"]]

        sentiment_scores = []
        question_count = 0
        exclamation_count = 0
        url_count = 0
        emoji_pattern = re.compile(
            r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F700-\U0001F77F\U0001F780-\U0001F7FF\U0001F800-\U0001F8FF\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F\U0001FA70-\U0001FAFF\U00002702-\U000027B0\U000024C2-\U0001F251]+')
        emoji_count = 0

        for text in original_tweets_text:
            # Sentiment analysis with NLTK if available
            if nltk_available:
                try:
                    sentiment_scores.append(
                        sia.polarity_scores(text)["compound"])
                except Exception as e:
                    # Fallback to simple sentiment analysis
                    positive_words = [
                        "love", "great", "good", "amazing", "awesome", "excited", "happy", "thanks"]
                    negative_words = [
                        "bad", "hate", "terrible", "awful", "sad", "disappointed", "annoying", "never"]

                    positive_count = sum(text.lower().count(word)
                                         for word in positive_words)
                    negative_count = sum(text.lower().count(word)
                                         for word in negative_words)

                    sentiment_scores.append(
                        0.5 if positive_count > negative_count else -0.5 if negative_count > positive_count else 0)
            else:
                # Simple sentiment analysis fallback
                positive_words = ["love", "great", "good",
                                  "amazing", "awesome", "excited", "happy", "thanks"]
                negative_words = ["bad", "hate", "terrible", "awful",
                                  "sad", "disappointed", "annoying", "never"]

                positive_count = sum(text.lower().count(word)
                                     for word in positive_words)
                negative_count = sum(text.lower().count(word)
                                     for word in negative_words)

                sentiment_scores.append(
                    0.5 if positive_count > negative_count else -0.5 if negative_count > positive_count else 0)

            # Count questions and exclamations
            question_count += text.count("?")
            exclamation_count += text.count("!")

            # Count URLs
            url_count += len(re.findall(
                r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text))

            # Count emojis
            emoji_count += len(emoji_pattern.findall(text))

        # Calculate average sentiment
        avg_sentiment = sum(sentiment_scores) / \
            len(sentiment_scores) if sentiment_scores else 0

        # Determine tone
        tone = "Neutral"
        if avg_sentiment >= 0.25:
            tone = "Positive"
        elif avg_sentiment <= -0.25:
            tone = "Negative"

        # Determine engagement style
        engagement_style = []
        if question_count / len(original_tweets_text) > 0.2:
            engagement_style.append("Inquisitive")
        if exclamation_count / len(original_tweets_text) > 0.2:
            engagement_style.append("Enthusiastic")
        if url_count / len(original_tweets_text) > 0.3:
            engagement_style.append("Informative/Resource sharing")
        if emoji_count / len(original_tweets_text) > 0.5:
            engagement_style.append("Expressive")

        if not engagement_style:
            engagement_style = ["Conversational"]

        # Determine formality
        formality = "Casual"
        avg_word_length = sum(len(word) for text in original_tweets_text for word in text.split(
        )) / sum(len(text.split()) for text in original_tweets_text)
        if avg_word_length > 5.5:
            formality = "Formal"
        elif avg_word_length > 4.5:
            formality = "Semi-formal"

        return {
            "tone": tone,
            "engagement_style": engagement_style,
            "formality": formality,
            "emoji_usage": "Frequent" if emoji_count / len(original_tweets_text) > 0.5 else "Occasional" if emoji_count > 0 else "Rare"
        }

    def extract_personality_traits(self, tweets):
        """Extract personality traits based on tweet content"""
        # Combine all original tweet text
        all_text = " ".join([t["text"].lower()
                            for t in tweets if not t["is_retweet"]])

        # Define trait indicators with related keywords
        trait_indicators = {
            "Analytical": ["analyze", "research", "data", "evidence", "logic", "rational", "study", "examine", "investigate"],
            "Creative": ["create", "design", "imagine", "innovative", "art", "creative", "build", "craft", "make"],
            "Optimistic": ["hope", "positive", "excited", "looking forward", "opportunity", "bright", "optimistic", "good"],
            "Critical": ["problem", "issue", "concern", "wrong", "bad", "terrible", "critique", "criticism"],
            "Curious": ["wonder", "curious", "interesting", "learn", "discover", "explore", "question", "fascinating"],
            "Ambitious": ["goal", "achieve", "success", "growth", "progress", "ambition", "accomplish", "strive"],
            "Reflective": ["think", "reflect", "consider", "perspective", "insight", "understand", "meaning"],
            "Collaborative": ["team", "together", "collaborate", "community", "help", "support", "join", "participate"],
            "Independent": ["self", "individual", "own", "personal", "independent", "freedom", "choice"],
            "Humorous": ["lol", "haha", "funny", "joke", "humor", "laugh", "lmao", "hilarious"]
        }

        # Score each trait
        trait_scores = {}
        for trait, keywords in trait_indicators.items():
            score = sum(all_text.count(word) for word in keywords)
            trait_scores[trait] = score

        # Get top traits
        sorted_traits = sorted(trait_scores.items(),
                               key=lambda x: x[1], reverse=True)
        top_traits = [trait for trait, score in sorted_traits if score > 0][:5]

        return top_traits

    def analyze_social_interactions(self, tweets):
        """Analyze social interactions from tweets"""
        # Extract mentioned users
        mentioned_users = []
        for tweet in tweets:
            mentioned_users.extend(tweet["mentioned_users"])

        # Count mentions
        user_mentions = Counter(mentioned_users)

        # Calculate reply percentage
        reply_count = sum(1 for tweet in tweets if tweet["is_reply"])
        reply_percentage = (reply_count / len(tweets)) * 100 if tweets else 0

        # Calculate retweet percentage
        retweet_count = sum(1 for tweet in tweets if tweet["is_retweet"])
        retweet_percentage = (retweet_count / len(tweets)
                              ) * 100 if tweets else 0

        # Determine interaction style
        interaction_style = "Balanced"
        if reply_percentage > 40:
            interaction_style = "Highly interactive"
        elif reply_percentage < 15:
            interaction_style = "Broadcaster"

        if retweet_percentage > 50:
            interaction_style = "Content curator"

        return {
            "most_mentioned_users": [user for user, count in user_mentions.most_common(5)],
            "reply_percentage": round(reply_percentage, 1),
            "retweet_percentage": round(retweet_percentage, 1),
            "interaction_style": interaction_style
        }

    def analyze_likes(self, likes):
        """Analyze liked tweets to understand interests"""
        if not likes:
            return {}
        sia, stop_words, nltk_available, word_tokenize = self._get_nltk_components()

        # Extract text from liked tweets
        liked_texts = []
        liked_hashtags = []

        for like in likes:
            if "fullText" in like:
                liked_texts.append(like["fullText"])

            # Extract hashtags if available
            if "entities" in like and "hashtags" in like["entities"]:
                for hashtag in like["entities"]["hashtags"]:
                    if "text" in hashtag:
                        liked_hashtags.append(hashtag["text"])

        # Analyze hashtags
        hashtag_freq = Counter(liked_hashtags)
        top_liked_hashtags = [tag for tag,
                              count in hashtag_freq.most_common(10)]

        # Combine all liked text
        all_liked_text = " ".join(liked_texts)

        # Simple word frequency analysis
        words = re.findall(r'\b[a-zA-Z]{3,}\b', all_liked_text.lower())
        word_freq = Counter(words)

        # Use NLTK if available
        if nltk_available:
            try:
                words = word_tokenize(all_liked_text.lower())
                filtered_words = [word for word in words if word.isalpha(
                ) and word not in stop_words and len(word) > 2]
                word_freq = Counter(filtered_words)
            except Exception as e:
                print(f"Error in NLTK processing for likes: {str(e)}")

        # Get common words
        common_liked_words = [word for word,
                              count in word_freq.most_common(20)]

        return {
            "top_liked_hashtags": top_liked_hashtags,
            "liked_topics": common_liked_words
        }

    def extract_account_info(self, account_info):
        """Extract relevant information from account data"""
        if not account_info:
            return {}

        account_data = {
            "username": account_info.get("username", ""),
            "display_name": account_info.get("accountDisplayName", ""),
            "creation_date": account_info.get("createdAt", ""),
            "bio": account_info.get("bio", {}).get("description", ""),
            "location": account_info.get("bio", {}).get("location", ""),
            "website": account_info.get("bio", {}).get("website", ""),
            "followers_count": account_info.get("followersCount", 0),
            "following_count": account_info.get("followingCount", 0)
        }

        # Format creation date if available
        if account_data["creation_date"]:
            try:
                dt = datetime.strptime(
                    account_data["creation_date"], "%a %b %d %H:%M:%S +0000 %Y")
                account_data["creation_date"] = dt.strftime("%B %Y")
            except:
                pass

        return account_data

    def generate_persona_from_content(self, tweets_content=None, likes_content=None, account_content=None):
        """Generate a comprehensive persona from Twitter archive content"""
        # Load data from content
        data = self.load_twitter_archive_from_content(
            tweets_content, likes_content, account_content)

        if not data["tweets"]:
            return {"error": "No tweet data found. Please ensure your ZIP contains a valid tweets.js file."}

        # Process tweets
        processed_tweets = self.extract_tweet_info(data["tweets"])

        # Extract account info
        account_data = self.extract_account_info(data["account_info"])

        # Extract username and screen name from account info or tweets if not available
        username = account_data.get("display_name", "")
        screen_name = account_data.get("username", "")

        if not username or not screen_name:
            # Try to extract from the first tweet
            if data["tweets"] and len(data["tweets"]) > 0:
                if "user" in data["tweets"][0]:
                    username = username or data["tweets"][0]["user"].get(
                        "name", "")
                    screen_name = screen_name or data["tweets"][0]["user"].get(
                        "screen_name", "")

        # Generate persona components
        posting_patterns = self.analyze_posting_patterns(processed_tweets)
        topics_and_interests = self.extract_topics_and_interests(
            processed_tweets)
        sentiment_and_tone = self.analyze_sentiment_and_tone(processed_tweets)
        personality_traits = self.extract_personality_traits(processed_tweets)
        social_interactions = self.analyze_social_interactions(
            processed_tweets)

        # Analyze likes if available
        likes_analysis = self.analyze_likes(
            data["likes"]) if data["likes"] else {}

        # Compile persona
        persona = {
            "basic_info": {
                "username": username,
                "screen_name": screen_name,
                "bio": account_data.get("bio", ""),
                "location": account_data.get("location", ""),
                "website": account_data.get("website", ""),
                "followers_count": account_data.get("followers_count", 0),
                "following_count": account_data.get("following_count", 0),
                "account_creation": account_data.get("creation_date", ""),
                "activity_period": posting_patterns.get("activity_period", ""),
                "tweet_count": len(processed_tweets)
            },
            "interests": topics_and_interests.get("interests", []),
            "personality_traits": personality_traits,
            "communication_style": {
                "tone": sentiment_and_tone.get("tone", ""),
                "formality": sentiment_and_tone.get("formality", ""),
                "engagement": sentiment_and_tone.get("engagement_style", []),
                "emoji_usage": sentiment_and_tone.get("emoji_usage", "")
            },
            "frequent_topics": topics_and_interests.get("frequent_topics", [])[:10],
            "top_hashtags": topics_and_interests.get("top_hashtags", []),
            "activity_patterns": {
                "most_active_hours": posting_patterns.get("most_active_hours", []),
                "most_active_days": posting_patterns.get("most_active_days", []),
                "posting_frequency": posting_patterns.get("posting_frequency", "")
            },
            "social_interactions": {
                "most_mentioned_users": social_interactions.get("most_mentioned_users", []),
                "reply_percentage": social_interactions.get("reply_percentage", 0),
                "retweet_percentage": social_interactions.get("retweet_percentage", 0),
                "interaction_style": social_interactions.get("interaction_style", "")
            }
        }

        # Add likes analysis if available
        if likes_analysis:
            persona["likes_analysis"] = {
                "top_liked_hashtags": likes_analysis.get("top_liked_hashtags", []),
                "liked_topics": likes_analysis.get("liked_topics", [])
            }

        return persona


@app.post("/upload-twitter-archive")
async def upload_twitter_archive(file: UploadFile = File(...)):
    """
    Upload a Twitter archive ZIP file and generate a persona.

    The ZIP file should contain:
    - tweets.js (required)
    - like.js (optional)
    - account.js (optional)
    """
    generator = TwitterPersonaGenerator()

    # Validate file type
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Please upload a ZIP file")

    try:
        # Read the uploaded file content
        content = await file.read()

        # Create a BytesIO object from the content
        zip_buffer = io.BytesIO(content)

        # Extract required files from ZIP
        tweets_content = None
        likes_content = None
        account_content = None

        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            file_list = zip_file.namelist()

            # Look for the required files
            for file_path in file_list:
                filename = os.path.basename(file_path)

                if filename == 'tweets.js':
                    tweets_content = zip_file.read(file_path).decode('utf-8')
                elif filename == 'like.js':
                    likes_content = zip_file.read(file_path).decode('utf-8')
                elif filename == 'account.js':
                    account_content = zip_file.read(file_path).decode('utf-8')

        # Check if tweets.js was found
        if not tweets_content:
            raise HTTPException(
                status_code=400,
                detail="tweets.js file not found in the ZIP archive. Please ensure your Twitter archive contains this file."
            )

        # Generate persona
        persona = generator.generate_persona_from_content(
            tweets_content=tweets_content,
            likes_content=likes_content,
            account_content=account_content
        )

        # Check for errors in persona generation
        if "error" in persona:
            raise HTTPException(status_code=400, detail=persona["error"])

        return JSONResponse(
            content={
                "success": True,
                "message": "Persona generated successfully",
                "persona": persona,

            }
        )

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file format")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400, detail="Unable to decode file content. Please ensure files are in UTF-8 format")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An error occurred while processing your archive: {str(e)}")


@app.get("/ping")
async def ping():
    return {"status": "alive"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
