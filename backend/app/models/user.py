"""
User Profile Models
Pydantic models representing user career data.
These mirror the Prisma schema in the frontend.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class Experience(BaseModel):
    """Work experience entry."""
    
    id: str
    company: str
    title: str
    location: Optional[str] = None
    start_date: datetime = Field(alias="startDate")
    end_date: Optional[datetime] = Field(default=None, alias="endDate")
    current: bool = False
    description: str
    highlights: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    
    # Computed relevance score (set during compilation)
    relevance_score: float = 0.0
    
    class Config:
        populate_by_name = True


class Project(BaseModel):
    """Project entry."""
    
    id: str
    name: str
    description: str
    url: Optional[str] = None
    start_date: Optional[datetime] = Field(default=None, alias="startDate")
    end_date: Optional[datetime] = Field(default=None, alias="endDate")
    technologies: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    
    # Computed relevance score
    relevance_score: float = 0.0
    
    class Config:
        populate_by_name = True


class Education(BaseModel):
    """Education entry."""
    
    id: str
    institution: str
    degree: str
    field: str
    start_date: datetime = Field(alias="startDate")
    end_date: Optional[datetime] = Field(default=None, alias="endDate")
    gpa: Optional[float] = None
    honors: list[str] = Field(default_factory=list)
    
    # Computed relevance score
    relevance_score: float = 0.0
    
    class Config:
        populate_by_name = True


class Skill(BaseModel):
    """Skill entry."""
    
    id: str
    name: str
    category: str  # e.g., "Programming", "Tools", "Soft Skills"
    proficiency: Optional[str] = None  # e.g., "Expert", "Intermediate"
    years_exp: Optional[int] = Field(default=None, alias="yearsExp")
    
    # Computed relevance score
    relevance_score: float = 0.0
    
    class Config:
        populate_by_name = True


class Publication(BaseModel):
    """Publication entry for academic/research profiles."""
    
    id: str
    title: str
    venue: str  # Journal/Conference name
    authors: list[str] = Field(default_factory=list)
    date: datetime
    url: Optional[str] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    
    # Computed relevance score
    relevance_score: float = 0.0
    
    class Config:
        populate_by_name = True


class UserSettings(BaseModel):
    """User preferences and settings."""
    
    selected_template: str = Field(
        default="experience-skills-projects",
        alias="selectedTemplate"
    )
    resume_preferences: Optional[dict] = Field(
        default=None, 
        alias="resumePreferences"
    )
    
    class Config:
        populate_by_name = True


class UserProfile(BaseModel):
    """
    Complete user profile with all career data.
    This is the canonical representation fetched from the database.
    """
    
    id: str
    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None
    
    # Career data (one-to-many relations)
    experiences: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    educations: list[Education] = Field(default_factory=list)
    skills: list[Skill] = Field(default_factory=list)
    publications: list[Publication] = Field(default_factory=list)
    
    # Settings
    settings: Optional[UserSettings] = None
    
    class Config:
        populate_by_name = True
    
    def get_all_keywords(self) -> set[str]:
        """Extract all keywords from the profile for matching."""
        keywords = set()
        
        # From experiences
        for exp in self.experiences:
            keywords.update(exp.keywords)
            keywords.add(exp.title.lower())
            keywords.add(exp.company.lower())
        
        # From projects
        for proj in self.projects:
            keywords.update(t.lower() for t in proj.technologies)
            keywords.add(proj.name.lower())
        
        # From skills
        for skill in self.skills:
            keywords.add(skill.name.lower())
            keywords.add(skill.category.lower())
        
        # From education
        for edu in self.educations:
            keywords.add(edu.field.lower())
            keywords.add(edu.degree.lower())
        
        return keywords
