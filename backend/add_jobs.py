"""Adds 12 more realistic jobs to the demo recruiter's account.   Run:  python add_jobs.py"""
from app.db import SessionLocal, Base, engine
from app.models import User, Job

JOBS = [
 ("Data Analyst", "InsightWorks", "Bengaluru", "Full-time",
  "Turn business data into dashboards and decisions. You will clean data, write SQL queries and present findings to managers.",
  ["Strong SQL and Excel skills", "Experience with pandas for data cleaning", "Clear communication of insights"],
  ["sql", "excel", "pandas", "python", "communication"]),
 ("Data Scientist", "DataSphere", "Hyderabad", "Full-time",
  "Build predictive models for hiring analytics and churn. You will own experiments from data exploration to deployment.",
  ["Solid grounding in machine learning", "Python with pandas, numpy and scikit-learn", "Comfortable explaining model results"],
  ["python", "machine learning", "pandas", "numpy", "scikit-learn", "sql"]),
 ("NLP Engineer", "LingoAI", "Remote", "Full-time",
  "Work on language models for resume understanding and conversational interviews, including retrieval-augmented generation.",
  ["Experience with NLP and transformer models", "Hands-on with LangChain or similar LLM tooling", "Python and REST API skills"],
  ["python", "nlp", "llm", "langchain", "rag", "pytorch"]),
 ("Deep Learning Engineer", "VisionNext", "Pune", "Full-time",
  "Develop and optimise neural networks for vision and speech features in our assessment platform.",
  ["Experience with PyTorch or TensorFlow", "Understanding of model training and evaluation", "Git and Linux comfort"],
  ["python", "deep learning", "pytorch", "tensorflow", "opencv", "linux"]),
 ("DevOps Engineer", "CloudBase", "Pune", "Full-time",
  "Automate builds, deployments and monitoring for a fast-growing platform running on containers.",
  ["Experience with Docker and Kubernetes", "Familiar with a cloud provider such as AWS", "Linux and scripting skills"],
  ["docker", "kubernetes", "aws", "linux", "git", "python"]),
 ("Cloud Engineer", "SkyScale", "Chennai", "Full-time",
  "Design and operate secure, cost-effective cloud infrastructure for enterprise customers.",
  ["Hands-on with AWS or Azure", "Understanding of networking and security basics", "Docker experience"],
  ["aws", "azure", "docker", "linux", "python"]),
 ("Java Backend Developer", "FinServe", "Mumbai", "Full-time",
  "Build reliable payment and reporting services with Java and Spring in a regulated environment.",
  ["Strong Java fundamentals", "Experience with Spring and REST APIs", "SQL database knowledge"],
  ["java", "spring", "sql", "rest", "git", "postgresql"]),
 ("Node.js Backend Developer", "InnovateLabs", "Hyderabad", "Full-time",
  "Create scalable APIs and real-time features for a recruitment product used by thousands of candidates.",
  ["Strong JavaScript and Node.js", "Experience with MongoDB or SQL databases", "REST API design"],
  ["node", "javascript", "mongodb", "rest", "docker", "git"]),
 ("Frontend Developer (Angular)", "PixelWorks", "Bengaluru", "Full-time",
  "Build rich enterprise interfaces with Angular and TypeScript, working closely with designers.",
  ["Strong TypeScript and Angular", "HTML and CSS expertise", "Experience consuming REST APIs"],
  ["angular", "typescript", "html", "css", "git", "rest"]),
 ("UI/UX Designer", "DesignHub", "Remote", "Contract",
  "Design clean, accessible interfaces for web applications and prototype them for user testing.",
  ["Proficiency in Figma", "Understanding of HTML and CSS constraints", "Strong communication with developers"],
  ["figma", "html", "css", "communication"]),
 ("Python Developer Intern", "TechNova", "Bengaluru", "Internship",
  "A six-month internship building internal tools and APIs with Python under senior mentorship.",
  ["Basic Python knowledge", "Understanding of Git", "Eagerness to learn"],
  ["python", "git", "sql", "flask"]),
 ("Software Engineering Manager", "CloudWorks", "Hyderabad", "Full-time",
  "Lead a team of eight engineers, balancing delivery, quality and mentoring across backend and AI projects.",
  ["Prior experience leading engineering teams", "Strong communication and leadership", "Working knowledge of Python or Java"],
  ["leadership", "communication", "python", "java", "aws", "git"]),
]

Base.metadata.create_all(bind=engine)
db = SessionLocal()
rec = db.query(User).filter_by(email="recruiter@demo.com").first()
if not rec:
    raise SystemExit("Run  python seed.py  first (it creates recruiter@demo.com).")
added = 0
for title, company, loc, rtype, desc, reqs, skills in JOBS:
    if db.query(Job).filter_by(title=title, company=company).first():
        continue
    db.add(Job(recruiter_id=rec.id, title=title, company=company, location=loc, role_type=rtype,
               description=desc, requirements=reqs, skills=skills))
    added += 1
db.commit()
print(f"Added {added} job(s). Total jobs now: {db.query(Job).count()}")
