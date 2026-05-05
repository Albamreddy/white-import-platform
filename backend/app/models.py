import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base

# ── 2FA code model (stored in DB) ────────────────────────────────

class TwoFactorCode(Base):
    __tablename__ = "two_factor_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    used = Column(Boolean, default=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    avatar_url = Column(String(500), nullable=True)
    background_url = Column(String(500), nullable=True)

    enrollments = relationship("Enrollment", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    price = Column(Float, default=0.0)
    old_price = Column(Float, nullable=True)
    image_url = Column(String(500), nullable=True)
    category = Column(String(200), nullable=True)
    difficulty = Column(String(50), default="beginner")
    duration_hours = Column(Integer, default=0)
    lessons_count = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    lessons = relationship("Lesson", back_populates="course", order_by="Lesson.order")
    enrollments = relationship("Enrollment", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    order = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=0)
    is_free = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="lessons")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    progress = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    last_watched_at = Column(DateTime, nullable=True)
    completed_lessons = Column(Text, default="")

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    rating = Column(Integer, default=5)
    text = Column(Text, nullable=False)
    author_name = Column(String(255), nullable=True)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User")
    course = relationship("Course")


class Webinar(Base):
    __tablename__ = "webinars"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime, nullable=False)
    platform = Column(String(50), default="telegram")
    link = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), default="news")  # news | announcement | hscode
    image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EmailSubscriber(Base):
    __tablename__ = "email_subscribers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime, default=datetime.datetime.utcnow)
