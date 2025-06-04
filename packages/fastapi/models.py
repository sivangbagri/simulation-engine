from pydantic import BaseModel
from typing import List, Dict


class Option(BaseModel):
    id: str
    text: str

class Question(BaseModel):
    id: str
    text: str
    options: List[Option]

class Survey(BaseModel):
    title: str
    description: str
    questions: List[Question]

class Persona(BaseModel):
    basic_info: Dict
    interests: List[str]
    personality_traits: List[str]
    communication_style: Dict
    frequent_topics: List[str]
    top_hashtags: List[str]
    activity_patterns: Dict
    social_interactions: Dict
    likes_analysis: Dict

class SimulationInput(BaseModel):
    survey: Survey
    personas: List[Persona]
