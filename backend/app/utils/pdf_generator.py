"""
PDF Generator
Generates ATS-friendly resume PDFs using WeasyPrint.
"""

import base64
from io import BytesIO

from jinja2 import Environment, BaseLoader
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

from app.models.resume import CompiledResume


# Base CSS for ATS-friendly resume
BASE_CSS = """
@page {
    size: letter;
    margin: 0.5in 0.6in;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1a1a1a;
}

.header {
    text-align: center;
    margin-bottom: 12pt;
    border-bottom: 1pt solid #333;
    padding-bottom: 8pt;
}

.header h1 {
    font-size: 18pt;
    font-weight: 700;
    margin-bottom: 4pt;
    color: #000;
}

.header .contact {
    font-size: 9pt;
    color: #444;
}

.section {
    margin-bottom: 10pt;
}

.section-title {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    color: #000;
    border-bottom: 0.5pt solid #666;
    padding-bottom: 2pt;
    margin-bottom: 6pt;
}

.item {
    margin-bottom: 8pt;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.item-title {
    font-weight: 600;
    font-size: 10pt;
}

.item-subtitle {
    font-style: italic;
    color: #444;
    font-size: 9pt;
}

.item-date {
    font-size: 9pt;
    color: #666;
    white-space: nowrap;
}

.item-description {
    margin-top: 3pt;
    font-size: 9.5pt;
}

.highlights {
    margin-top: 3pt;
    padding-left: 14pt;
}

.highlights li {
    font-size: 9.5pt;
    margin-bottom: 2pt;
}

.skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4pt 12pt;
}

.skill-category {
    margin-bottom: 4pt;
}

.skill-category-name {
    font-weight: 600;
    font-size: 9pt;
}

.skill-items {
    font-size: 9pt;
    color: #333;
}

.two-column {
    display: flex;
    gap: 16pt;
}

.two-column > div {
    flex: 1;
}
"""

# HTML template for resume
RESUME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume - {{ name }}</title>
</head>
<body>
    <div class="header">
        <h1>{{ name }}</h1>
        <div class="contact">{{ email }}</div>
    </div>
    
    {% if experiences %}
    <div class="section">
        <h2 class="section-title">Professional Experience</h2>
        {% for exp in experiences %}
        <div class="item">
            <div class="item-header">
                <span class="item-title">{{ exp.title }}</span>
                <span class="item-date">
                    {{ exp.start_date.strftime('%b %Y') }} - 
                    {% if exp.current %}Present{% else %}{{ exp.end_date.strftime('%b %Y') if exp.end_date else 'Present' }}{% endif %}
                </span>
            </div>
            <div class="item-subtitle">{{ exp.company }}{% if exp.location %} | {{ exp.location }}{% endif %}</div>
            {% if exp.highlights %}
            <ul class="highlights">
                {% for highlight in exp.highlights[:4] %}
                <li>{{ highlight }}</li>
                {% endfor %}
            </ul>
            {% elif exp.description %}
            <p class="item-description">{{ exp.description[:300] }}{% if exp.description|length > 300 %}...{% endif %}</p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}
    
    {% if projects %}
    <div class="section">
        <h2 class="section-title">Projects</h2>
        {% for proj in projects %}
        <div class="item">
            <div class="item-header">
                <span class="item-title">{{ proj.name }}</span>
                {% if proj.url %}<span class="item-date">{{ proj.url }}</span>{% endif %}
            </div>
            {% if proj.technologies %}
            <div class="item-subtitle">{{ proj.technologies | join(', ') }}</div>
            {% endif %}
            {% if proj.highlights %}
            <ul class="highlights">
                {% for highlight in proj.highlights[:3] %}
                <li>{{ highlight }}</li>
                {% endfor %}
            </ul>
            {% elif proj.description %}
            <p class="item-description">{{ proj.description[:200] }}{% if proj.description|length > 200 %}...{% endif %}</p>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}
    
    {% if educations %}
    <div class="section">
        <h2 class="section-title">Education</h2>
        {% for edu in educations %}
        <div class="item">
            <div class="item-header">
                <span class="item-title">{{ edu.degree }} in {{ edu.field }}</span>
                <span class="item-date">
                    {{ edu.start_date.strftime('%Y') }} - 
                    {{ edu.end_date.strftime('%Y') if edu.end_date else 'Present' }}
                </span>
            </div>
            <div class="item-subtitle">{{ edu.institution }}{% if edu.gpa %} | GPA: {{ "%.2f"|format(edu.gpa) }}{% endif %}</div>
            {% if edu.honors %}
            <div class="item-description">{{ edu.honors | join(', ') }}</div>
            {% endif %}
        </div>
        {% endfor %}
    </div>
    {% endif %}
    
    {% if skills %}
    <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-grid">
            {% set skills_by_category = skills | groupby('category') %}
            {% for category, cat_skills in skills_by_category %}
            <div class="skill-category">
                <span class="skill-category-name">{{ category }}:</span>
                <span class="skill-items">{{ cat_skills | map(attribute='name') | join(', ') }}</span>
            </div>
            {% endfor %}
        </div>
    </div>
    {% endif %}
    
    {% if publications %}
    <div class="section">
        <h2 class="section-title">Publications</h2>
        {% for pub in publications %}
        <div class="item">
            <div class="item-title">{{ pub.title }}</div>
            <div class="item-subtitle">
                {{ pub.venue }} | {{ pub.date.strftime('%Y') }}
                {% if pub.doi %} | DOI: {{ pub.doi }}{% endif %}
            </div>
        </div>
        {% endfor %}
    </div>
    {% endif %}
</body>
</html>
"""


class PDFGenerator:
    """
    Generates ATS-friendly PDF resumes from compiled resume data.
    Uses WeasyPrint for HTML to PDF conversion.
    """
    
    def __init__(self):
        """Initialize PDF generator with Jinja2 environment."""
        self.env = Environment(loader=BaseLoader())
        self.template = self.env.from_string(RESUME_TEMPLATE)
        self.font_config = FontConfiguration()
    
    def generate_html(self, resume: CompiledResume) -> str:
        """
        Generate HTML from compiled resume data.
        
        Args:
            resume: Compiled resume with selected items
        
        Returns:
            HTML string
        """
        return self.template.render(
            name=resume.name,
            email=resume.email,
            experiences=resume.experiences,
            projects=resume.projects,
            educations=resume.educations,
            skills=resume.skills,
            publications=resume.publications,
        )
    
    def generate_pdf(
        self,
        resume: CompiledResume,
        max_pages: int = 1,
    ) -> bytes:
        """
        Generate PDF from compiled resume.
        
        Args:
            resume: Compiled resume with selected items
            max_pages: Maximum allowed pages (enforced strictly)
        
        Returns:
            PDF bytes
        
        Raises:
            ValueError: If generated PDF exceeds max_pages
        """
        html_content = self.generate_html(resume)
        
        # Generate PDF
        html_doc = HTML(string=html_content)
        css = CSS(string=BASE_CSS, font_config=self.font_config)
        
        pdf_buffer = BytesIO()
        document = html_doc.render(stylesheets=[css], font_config=self.font_config)
        
        # Check page count
        if len(document.pages) > max_pages:
            raise ValueError(
                f"Resume exceeds {max_pages} page(s). "
                f"Generated {len(document.pages)} pages. "
                "Consider reducing content or using a more compact template."
            )
        
        document.write_pdf(pdf_buffer)
        return pdf_buffer.getvalue()
    
    def generate_pdf_base64(
        self,
        resume: CompiledResume,
        max_pages: int = 1,
    ) -> str:
        """
        Generate PDF and return as base64 encoded string.
        
        Args:
            resume: Compiled resume with selected items
            max_pages: Maximum allowed pages
        
        Returns:
            Base64 encoded PDF string
        """
        pdf_bytes = self.generate_pdf(resume, max_pages)
        return base64.b64encode(pdf_bytes).decode("utf-8")
    
    def preview_html(self, resume: CompiledResume) -> str:
        """
        Get HTML preview with embedded CSS (for debugging/preview).
        
        Args:
            resume: Compiled resume
        
        Returns:
            Complete HTML with embedded styles
        """
        html_content = self.generate_html(resume)
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{BASE_CSS}</style>
</head>
<body>
    {html_content}
</body>
</html>
"""
