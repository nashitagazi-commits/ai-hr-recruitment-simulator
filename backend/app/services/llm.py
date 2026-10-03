"""LLM access through LangChain (OpenAI GPT). Returns None when no key / package, so callers fall back."""
import logging
from functools import lru_cache
from pydantic import BaseModel, Field
from ..core.config import settings

log = logging.getLogger("ai")


class ParsedResume(BaseModel):
    name: str = ""
    email: str = ""
    skills: list[str] = Field(default_factory=list, description="technical and professional skills, one per item")
    experience: list[str] = Field(default_factory=list, description="job title, company and duration, one per item")
    education: list[str] = Field(default_factory=list, description="degree and institution, one per item")
    experience_years: float = Field(0, description="total years of professional work experience")


class QuestionList(BaseModel):
    questions: list[str]


class AnswerEval(BaseModel):
    technical: int = Field(description="0-100: correctness and depth of technical content")
    communication: int = Field(description="0-100: clarity, structure and fluency")
    confidence: int = Field(description="0-100: how assured and decisive the answer sounds")
    comment: str = Field("", description="one short sentence of feedback")


class CopilotFilters(BaseModel):
    limit: int = Field(5, description="how many candidates to return")
    skills: list[str] = Field(default_factory=list, description="required skills, lowercase")
    min_score: float | None = Field(None, description="minimum score 0-100 if the user gave one")
    location: str | None = None
    semantic_query: str = Field("", description="free-text description of the wanted profile if no specific skills are named")


@lru_cache
def get_llm():
    if not settings.OPENAI_API_KEY:
        return None
    try:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=settings.OPENAI_MODEL, api_key=settings.OPENAI_API_KEY,
                          temperature=0.3, timeout=30, max_retries=1)
    except Exception as exc:  # package missing or bad config
        log.warning("LLM unavailable (%s)", exc)
        return None


def structured(schema, system: str, user: str):
    """Run one prompt and get a validated pydantic object back, or None on any problem."""
    llm = get_llm()
    if llm is None:
        return None
    try:
        from langchain_core.prompts import ChatPromptTemplate
        prompt = ChatPromptTemplate.from_messages([("system", system), ("human", "{input}")])
        return (prompt | llm.with_structured_output(schema)).invoke({"input": user})
    except Exception as exc:
        log.warning("LLM call failed (%s) - using fallback", exc)
        return None
