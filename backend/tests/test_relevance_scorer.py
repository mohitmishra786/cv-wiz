
import pytest
from datetime import datetime
from app.utils.relevance_scorer import RelevanceScorer
from app.models.user import UserProfile, Experience, Project, Education, Skill, Publication

@pytest.fixture
def sample_job_description():
    return """
    Senior Python Developer
    
    We are looking for a software engineer with strong Python skills.
    Required: Django, FastAPI, PostgreSQL.
    Experience with AWS is a plus.
    """

@pytest.fixture
def scorer(sample_job_description):
    return RelevanceScorer(sample_job_description)

@pytest.fixture
def sample_profile():
    return UserProfile(
        id="u1",
        email="test@example.com",
        experiences=[
            Experience(
                id="e1",
                company="Tech Corp",
                title="Senior Python Developer",
                startDate=datetime(2022, 1, 1),
                current=True,
                description="Built APIs using FastAPI and Django.",
                keywords=["Python", "FastAPI", "Django"],
                highlights=["Reduced latency by 50%"]
            ),
            Experience(
                id="e2",
                company="Food Inc",
                title="Chef",
                startDate=datetime(2018, 1, 1),
                endDate=datetime(2020, 1, 1),
                description="Cooked meals.",
                keywords=["Cooking", "Management"]
            )
        ],
        projects=[
            Project(
                id="p1",
                name="E-commerce Site",
                description="A site built with Django and React.",
                technologies=["Django", "React", "PostgreSQL"],
                highlights=["Handled 1k users"]
            )
        ],
        skills=[
            Skill(id="s1", name="Python", category="Language", proficiency="Expert"),
            Skill(id="s2", name="Java", category="Language", proficiency="Intermediate"),
            Skill(id="s3", name="Django", category="Framework")
        ],
        educations=[
            Education(
                id="edu1",
                institution="University of Tech",
                degree="BS",
                field="Computer Science",
                startDate=datetime(2016, 1, 1),
                endDate=datetime(2020, 1, 1)
            )
        ],
        publications=[
            Publication(
                id="pub1",
                title="Modern Python Practices",
                venue="PyCon",
                date=datetime(2023, 1, 1),
                abstract="Best practices for Python development."
            )
        ]
    )

def test_initialization(scorer):
    assert "python" in scorer.jd_tokens
    assert "developer" in scorer.jd_tokens
    # Check stop words are removed
    assert "the" not in scorer.jd_tokens
    assert "are" not in scorer.jd_tokens

def test_extract_job_title(scorer):
    # The heuristic takes the first line
    assert "senior python developer" in scorer.job_title

def test_extract_required_skills(scorer):
    # Should extract from "Required: Django, FastAPI, PostgreSQL"
    assert "django" in scorer.required_skills
    assert "fastapi" in scorer.required_skills
    assert "postgresql" in scorer.required_skills

def test_score_experience(scorer, sample_profile):
    # e1: Senior Python Developer (Match)
    e1 = sample_profile.experiences[0]
    scored_e1 = scorer.score_experience(e1)
    
    # e2: Chef (No Match)
    e2 = sample_profile.experiences[1]
    scored_e2 = scorer.score_experience(e2)
    
    assert scored_e1.score > scored_e2.score
    assert scored_e1.score > 0
    assert "python" in scored_e1.matched_keywords
    assert "django" in scored_e1.matched_keywords

def test_score_project(scorer, sample_profile):
    p1 = sample_profile.projects[0]
    scored_p1 = scorer.score_project(p1)
    
    assert scored_p1.score > 0
    # Should match technologies
    assert "django" in scored_p1.matched_keywords
    assert "postgresql" in scored_p1.matched_keywords

def test_score_skill(scorer, sample_profile):
    # Python (Expert match)
    s1 = sample_profile.skills[0]
    scored_s1 = scorer.score_skill(s1)
    
    # Java (No match in JD text "strong Python skills", but check if it appears?)
    # "Java" is not in sample JD.
    s2 = sample_profile.skills[1]
    scored_s2 = scorer.score_skill(s2)
    
    # Django (Required skill match)
    s3 = sample_profile.skills[2]
    scored_s3 = scorer.score_skill(s3)
    
    assert scored_s1.score > 0
    assert scored_s3.score > 0
    # Java might be 0 if not present
    assert scored_s1.score > scored_s2.score

def test_score_profile(scorer, sample_profile):
    scored_profile = scorer.score_profile(sample_profile)
    
    assert "experiences" in scored_profile
    assert len(scored_profile["experiences"]) == 2
    
    # Check sorting: e1 (Python Dev) should be before e2 (Chef)
    assert scored_profile["experiences"][0].item.id == "e1"
    
    assert "skills" in scored_profile
    # Python and Django should be top skills
    top_skill_ids = [s.item.id for s in scored_profile["skills"]]
    assert "s1" in top_skill_ids[:2] # Python
    assert "s3" in top_skill_ids[:2] # Django

def test_select_top_items(scorer, sample_profile):
    top_items = scorer.select_top_items(sample_profile, max_experiences=1, max_skills=1)
    
    assert len(top_items["experiences"]) == 1
    assert top_items["experiences"][0].id == "e1"
    
    assert len(top_items["skills"]) == 1
    # Either Python or Django depending on exact weights
    assert top_items["skills"][0].name in ["Python", "Django"]

def test_empty_job_description():
    scorer = RelevanceScorer("")
    assert len(scorer.jd_tokens) == 0
    assert scorer.job_title == ""
    assert len(scorer.required_skills) == 0

def test_no_matches(scorer):
    # Profile with totally irrelevant data
    profile = UserProfile(
        id="u2",
        email="irrelevant@example.com",
        experiences=[
            Experience(
                id="e3",
                company="Space Corp",
                title="Astronaut",
                startDate=datetime(2020, 1, 1),
                description="Went to space.",
                keywords=["Space", "Mars"]
            )
        ]
    )
    
    scored_exp = scorer.score_experience(profile.experiences[0])
    # Might match stop words if not filtered correctly, but with unique words "Space", "Mars" against "Python", "Django"
    # The score should be 0 unless "Space" or "Mars" is in JD.
    assert scored_exp.score == 0.0 or scored_exp.score < 0.1
