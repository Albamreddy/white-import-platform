from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str | None = None
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    is_verified: bool
    is_admin: bool
    created_at: datetime
    avatar_url: str | None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CourseOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str | None
    short_description: str | None
    price: float
    old_price: float | None
    image_url: str | None
    category: str | None
    difficulty: str
    duration_hours: int
    lessons_count: int
    is_published: bool
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LessonOut(BaseModel):
    id: int
    course_id: int
    title: str
    description: str | None
    content: str | None
    video_url: str | None
    order: int
    duration_minutes: int
    is_free: bool

    class Config:
        from_attributes = True


class CourseDetailOut(CourseOut):
    lessons: list[LessonOut] = []


class EnrollmentOut(BaseModel):
    id: int
    course_id: int
    enrolled_at: datetime
    progress: float
    is_completed: bool
    course: CourseOut

    class Config:
        from_attributes = True


class EmailVerify(BaseModel):
    token: str


class MessageOut(BaseModel):
    message: str


# ── Admin schemas ─────────────────────────────────────────────────

class AdminStatsOut(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int
    verified_users: int
    published_courses: int


class AdminUserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str | None
    is_verified: bool
    is_admin: bool
    is_active: bool
    created_at: datetime
    enrollments_count: int = 0

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None
    is_verified: bool | None = None
    is_admin: bool | None = None


class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str | None = None
    short_description: str | None = None
    price: float = 0.0
    old_price: float | None = None
    image_url: str | None = None
    category: str | None = None
    difficulty: str = "beginner"
    duration_hours: int = 0
    lessons_count: int = 0
    is_published: bool = True
    is_featured: bool = False


class CourseUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    short_description: str | None = None
    price: float | None = None
    old_price: float | None = None
    image_url: str | None = None
    category: str | None = None
    difficulty: str | None = None
    duration_hours: int | None = None
    lessons_count: int | None = None
    is_published: bool | None = None
    is_featured: bool | None = None


class LessonCreate(BaseModel):
    title: str
    description: str | None = None
    content: str | None = None
    video_url: str | None = None
    order: int = 0
    duration_minutes: int = 0
    is_free: bool = False


class LessonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    video_url: str | None = None
    order: int | None = None
    duration_minutes: int | None = None
    is_free: bool | None = None


class AdminEnrollmentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    progress: float
    is_completed: bool
    last_watched_at: datetime | None = None
    completed_lessons: str = ""
    user: UserOut
    course: CourseOut

    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    lesson_id: int
    progress: float


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ── Reviews ──────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    course_id: int | None = None
    rating: int = 5
    text: str


class ReviewOut(BaseModel):
    id: int
    user_id: int
    course_id: int | None
    rating: int
    text: str
    author_name: str | None
    is_approved: bool
    created_at: datetime
    class Config:
        from_attributes = True


class ReviewUpdate(BaseModel):
    text: str | None = None
    rating: int | None = None
    is_approved: bool | None = None


# ── Webinars ─────────────────────────────────────────────────────

class WebinarCreate(BaseModel):
    title: str
    description: str | None = None
    date: datetime
    platform: str = "telegram"
    link: str | None = None
    image_url: str | None = None
    is_active: bool = True


class WebinarOut(BaseModel):
    id: int
    title: str
    description: str | None
    date: datetime
    platform: str
    link: str | None
    image_url: str | None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


class WebinarUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    date: datetime | None = None
    platform: str | None = None
    link: str | None = None
    image_url: str | None = None
    is_active: bool | None = None


# ── 2FA ──────────────────────────────────────────────────────────

class TwoFactorRequest(BaseModel):
    email: str
    password: str


class TwoFactorVerify(BaseModel):
    email: str
    code: str
