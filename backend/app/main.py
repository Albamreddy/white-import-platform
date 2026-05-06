import os
import uuid
import shutil
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window
        self.clients: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        self.clients[client_ip] = [t for t in self.clients[client_ip] if now - t < self.window]
        if len(self.clients[client_ip]) >= self.max_requests:
            return JSONResponse({"detail": "Слишком много запросов"}, status_code=429)
        self.clients[client_ip].append(now)
        return await call_next(request)

from .auth import (
    create_access_token,
    create_email_token,
    get_password_hash,
    require_user,
    require_admin,
    verify_email_token,
    verify_password,
    get_current_user,
)
from .database import get_db, init_db, async_session
from .models import Course, EmailSubscriber, Enrollment, Lesson, News, Review, TwoFactorCode, User, Webinar
from .schemas import (
    AdminEnrollmentOut,
    AdminStatsOut,
    AdminUserOut,
    AdminUserUpdate,
    ChatRequest,
    ChatResponse,
    CourseCreate,
    CourseDetailOut,
    CourseOut,
    CourseUpdate,
    EmailVerify,
    EnrollmentOut,
    LessonCreate,
    LessonOut,
    LessonUpdate,
    MessageOut,
    NewsCreate,
    NewsletterSend,
    NewsletterTest,
    NewsOut,
    NewsUpdate,
    ProgressUpdate,
    ReviewCreate,
    ReviewOut,
    ReviewUpdate,
    SubscribeRequest,
    SubscriberOut,
    Token,
    TwoFactorRequest,
    TwoFactorVerify,
    UserCreate,
    UserLogin,
    UserOut,
    UserProfileUpdate,
    WebinarCreate,
    WebinarOut,
    WebinarUpdate,
)
from .seed import seed_data

UPLOAD_DIR = Path("/data/uploads") if os.path.isdir("/data") else Path("./uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as db:
        await seed_data(db)
    yield


app = FastAPI(
    title="Белый Ввоз — Платформа курсов",
    description="Образовательная платформа по белому импорту из Китая",
    version="1.0.0",
    lifespan=lifespan,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, max_requests=120, window=60)


# ── Auth ──────────────────────────────────────────────────────────


@app.post("/api/auth/register", response_model=Token)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Пользователь с таким email или именем уже существует")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)

    existing_sub = await db.execute(
        select(EmailSubscriber).where(EmailSubscriber.email == data.email)
    )
    if not existing_sub.scalar_one_or_none():
        db.add(EmailSubscriber(email=data.email, name=data.full_name))

    await db.commit()
    await db.refresh(user)

    await _unisender_subscribe(data.email, data.full_name)

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=UserOut.model_validate(user))


@app.post("/api/auth/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=UserOut.model_validate(user))


@app.get("/api/auth/me", response_model=UserOut)
async def get_me(user: User = Depends(require_user)):
    return UserOut.model_validate(user)


@app.post("/api/auth/verify-email", response_model=MessageOut)
async def verify_email(data: EmailVerify, db: AsyncSession = Depends(get_db)):
    email = verify_email_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Недействительный или просроченный токен")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.is_verified = True
    await db.commit()
    return MessageOut(message="Email подтверждён")


@app.post("/api/auth/request-verification", response_model=MessageOut)
async def request_verification(user: User = Depends(require_user)):
    token = create_email_token(user.email)
    verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
    return MessageOut(message=f"Ссылка для подтверждения: {verification_url}")


# ── Courses ───────────────────────────────────────────────────────


@app.get("/api/courses", response_model=list[CourseOut])
async def list_courses(
    category: str | None = None,
    featured: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Course).where(Course.is_published == True)
    if category:
        query = query.where(Course.category == category)
    if featured is not None:
        query = query.where(Course.is_featured == featured)
    query = query.order_by(Course.is_featured.desc(), Course.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@app.get("/api/courses/{slug}", response_model=CourseDetailOut)
async def get_course(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    result = await db.execute(
        select(Course).where(Course.slug == slug).options(selectinload(Course.lessons))
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    enrolled = False
    if user:
        enrollment = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course.id
            )
        )
        enrolled = enrollment.scalar_one_or_none() is not None

    course_data = CourseDetailOut.model_validate(course)
    if not enrolled:
        for lesson in course_data.lessons:
            if not lesson.is_free:
                lesson.content = None
                lesson.video_url = None
    return course_data


@app.get("/api/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course.category).where(Course.is_published == True).distinct()
    )
    return [row[0] for row in result.all() if row[0]]


# ── Enrollments ───────────────────────────────────────────────────


@app.post("/api/courses/{slug}/enroll", response_model=MessageOut)
async def enroll_course(
    slug: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.slug == slug))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user.id, Enrollment.course_id == course.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Вы уже записаны на этот курс")

    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.add(enrollment)
    await db.commit()
    return MessageOut(message="Вы успешно записались на курс")


@app.get("/api/enrollments", response_model=list[EnrollmentOut])
async def my_enrollments(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == user.id)
        .options(selectinload(Enrollment.course))
        .order_by(Enrollment.enrolled_at.desc())
    )
    return result.scalars().all()


@app.post("/api/enrollments/{enrollment_id}/progress", response_model=MessageOut)
async def update_progress(
    enrollment_id: int,
    data: ProgressUpdate,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    import datetime as dt
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user.id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Запись не найдена")

    completed = set(enrollment.completed_lessons.split(",")) if enrollment.completed_lessons else set()
    completed.discard("")
    completed.add(str(data.lesson_id))
    enrollment.completed_lessons = ",".join(sorted(completed))
    enrollment.last_watched_at = dt.datetime.utcnow()

    course_result = await db.execute(
        select(Course).where(Course.id == enrollment.course_id).options(selectinload(Course.lessons))
    )
    course = course_result.scalar_one_or_none()
    total = len(course.lessons) if course else 1
    enrollment.progress = min(100.0, round(len(completed) / total * 100, 1))
    enrollment.is_completed = enrollment.progress >= 100
    await db.commit()
    return MessageOut(message=f"Прогресс обновлён: {enrollment.progress}%")


# ── Health ────────────────────────────────────────────────────────


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "white-import-courses"}


# ── File Upload ───────────────────────────────────────────────────


@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    user: User = Depends(require_admin),
):
    allowed = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Формат {ext} не поддерживается. Допустимые: {', '.join(allowed)}")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}


@app.post("/api/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(require_admin),
):
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Формат {ext} не поддерживается")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}


@app.post("/api/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(require_user),
):
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Формат {ext} не поддерживается")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(400, "Файл слишком большой. Максимум 5 МБ")

    filename = f"avatar_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}


# ── Admin ─────────────────────────────────────────────────────────


@app.get("/api/admin/stats", response_model=AdminStatsOut)
async def admin_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users = (await db.execute(select(func.count(User.id)))).scalar()
    courses = (await db.execute(select(func.count(Course.id)))).scalar()
    enrollments = (await db.execute(select(func.count(Enrollment.id)))).scalar()
    verified = (await db.execute(
        select(func.count(User.id)).where(User.is_verified == True)
    )).scalar()
    published = (await db.execute(
        select(func.count(Course.id)).where(Course.is_published == True)
    )).scalar()
    return AdminStatsOut(
        total_users=users,
        total_courses=courses,
        total_enrollments=enrollments,
        verified_users=verified,
        published_courses=published,
    )


@app.get("/api/admin/users", response_model=list[AdminUserOut])
async def admin_list_users(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).options(selectinload(User.enrollments)).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        AdminUserOut(
            id=u.id, email=u.email, username=u.username, full_name=u.full_name,
            is_verified=u.is_verified, is_admin=u.is_admin, is_active=u.is_active,
            created_at=u.created_at, enrollments_count=len(u.enrollments),
        )
        for u in users
    ]


@app.patch("/api/admin/users/{user_id}", response_model=MessageOut)
async def admin_update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "Пользователь не найден")

    if data.is_active is not None:
        target.is_active = data.is_active
    if data.is_verified is not None:
        target.is_verified = data.is_verified
    if data.is_admin is not None:
        target.is_admin = data.is_admin
    await db.commit()
    return MessageOut(message="Пользователь обновлён")


@app.delete("/api/admin/users/{user_id}", response_model=MessageOut)
async def admin_delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "Пользователь не найден")
    if target.id == admin.id:
        raise HTTPException(400, "Нельзя удалить самого себя")
    await db.delete(target)
    await db.commit()
    return MessageOut(message="Пользователь удалён")


# ── Admin Courses ─────────────────────────────────────────────────


@app.get("/api/admin/courses", response_model=list[CourseDetailOut])
async def admin_list_courses(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course).options(selectinload(Course.lessons)).order_by(Course.created_at.desc())
    )
    return result.scalars().all()


@app.post("/api/admin/courses", response_model=CourseOut)
async def admin_create_course(
    data: CourseCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    course = Course(**data.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@app.patch("/api/admin/courses/{course_id}", response_model=MessageOut)
async def admin_update_course(
    course_id: int,
    data: CourseUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Курс не найден")

    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(course, key, value)
    await db.commit()
    return MessageOut(message="Курс обновлён")


@app.delete("/api/admin/courses/{course_id}", response_model=MessageOut)
async def admin_delete_course(
    course_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Курс не найден")
    await db.delete(course)
    await db.commit()
    return MessageOut(message="Курс удалён")


# ── Admin Lessons ─────────────────────────────────────────────────


@app.post("/api/admin/courses/{course_id}/lessons", response_model=LessonOut)
async def admin_create_lesson(
    course_id: int,
    data: LessonCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Курс не найден")
    lesson = Lesson(course_id=course_id, **data.model_dump())
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@app.patch("/api/admin/lessons/{lesson_id}", response_model=MessageOut)
async def admin_update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(404, "Урок не найден")

    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(lesson, key, value)
    await db.commit()
    return MessageOut(message="Урок обновлён")


@app.delete("/api/admin/lessons/{lesson_id}", response_model=MessageOut)
async def admin_delete_lesson(
    lesson_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(404, "Урок не найден")
    await db.delete(lesson)
    await db.commit()
    return MessageOut(message="Урок удалён")


# ── Admin Enrollments ─────────────────────────────────────────────


@app.get("/api/admin/enrollments", response_model=list[AdminEnrollmentOut])
async def admin_list_enrollments(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.user), selectinload(Enrollment.course))
        .order_by(Enrollment.enrolled_at.desc())
    )
    return result.scalars().all()


@app.delete("/api/admin/enrollments/{enrollment_id}", response_model=MessageOut)
async def admin_delete_enrollment(
    enrollment_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Запись не найдена")
    await db.delete(enrollment)
    await db.commit()
    return MessageOut(message="Запись удалена")


# ── 2FA Authentication ───────────────────────────────────────────

import random
import datetime as dt

@app.post("/api/auth/2fa/request")
async def request_2fa(data: TwoFactorRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Неверный email или пароль")

    code = f"{random.randint(100000, 999999)}"
    tfa = TwoFactorCode(user_id=user.id, code=code)
    db.add(tfa)
    await db.commit()

    return {"message": f"Код подтверждения: {code}", "requires_2fa": True}


@app.post("/api/auth/2fa/verify", response_model=Token)
async def verify_2fa(data: TwoFactorVerify, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Пользователь не найден")

    codes = await db.execute(
        select(TwoFactorCode)
        .where(TwoFactorCode.user_id == user.id, TwoFactorCode.used == False)
        .order_by(TwoFactorCode.created_at.desc())
    )
    code_obj = codes.scalars().first()
    if not code_obj or code_obj.code != data.code:
        raise HTTPException(401, "Неверный код")

    age = (dt.datetime.utcnow() - code_obj.created_at).total_seconds()
    if age > 300:
        raise HTTPException(401, "Код истёк. Запросите новый")

    code_obj.used = True
    await db.commit()

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=UserOut.model_validate(user))


# ── Reviews ──────────────────────────────────────────────────────

@app.get("/api/reviews", response_model=list[ReviewOut])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.is_approved == True).order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@app.post("/api/reviews", response_model=ReviewOut)
async def create_review(
    data: ReviewCreate,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    review = Review(
        user_id=user.id,
        course_id=data.course_id,
        rating=data.rating,
        text=data.text,
        author_name=user.full_name or user.username,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@app.get("/api/admin/reviews", response_model=list[ReviewOut])
async def admin_list_reviews(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).order_by(Review.created_at.desc()))
    return result.scalars().all()


@app.patch("/api/admin/reviews/{review_id}", response_model=MessageOut)
async def admin_update_review(
    review_id: int,
    data: ReviewUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(review, key, value)
    await db.commit()
    return MessageOut(message="Отзыв обновлён")


@app.delete("/api/admin/reviews/{review_id}", response_model=MessageOut)
async def admin_delete_review(
    review_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    await db.delete(review)
    await db.commit()
    return MessageOut(message="Отзыв удалён")


# ── Webinars ─────────────────────────────────────────────────────

@app.get("/api/webinars", response_model=list[WebinarOut])
async def list_webinars(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Webinar).where(Webinar.is_active == True).order_by(Webinar.date.desc())
    )
    return result.scalars().all()


@app.post("/api/admin/webinars", response_model=WebinarOut)
async def admin_create_webinar(
    data: WebinarCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    webinar = Webinar(**data.model_dump())
    db.add(webinar)
    await db.commit()
    await db.refresh(webinar)
    return webinar


@app.patch("/api/admin/webinars/{webinar_id}", response_model=MessageOut)
async def admin_update_webinar(
    webinar_id: int,
    data: WebinarUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Webinar).where(Webinar.id == webinar_id))
    webinar = result.scalar_one_or_none()
    if not webinar:
        raise HTTPException(404, "Вебинар не найден")
    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(webinar, key, value)
    await db.commit()
    return MessageOut(message="Вебинар обновлён")


@app.delete("/api/admin/webinars/{webinar_id}", response_model=MessageOut)
async def admin_delete_webinar(
    webinar_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Webinar).where(Webinar.id == webinar_id))
    webinar = result.scalar_one_or_none()
    if not webinar:
        raise HTTPException(404, "Вебинар не найден")
    await db.delete(webinar)
    await db.commit()
    return MessageOut(message="Вебинар удалён")


# ── Customs Calculator ───────────────────────────────────────────

CUSTOMS_RATES = {
    "Одежда и текстиль": {"duty": 10.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Электроника": {"duty": 0.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Обувь": {"duty": 10.0, "vat": 20.0, "min_duty_eur_kg": 1.4},
    "Игрушки": {"duty": 10.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Косметика": {"duty": 6.5, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Продукты питания": {"duty": 12.0, "vat": 10.0, "min_duty_eur_kg": 0.0},
    "Автозапчасти": {"duty": 5.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Мебель": {"duty": 8.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Бытовая техника": {"duty": 7.5, "vat": 20.0, "min_duty_eur_kg": 0.0},
    "Другое": {"duty": 10.0, "vat": 20.0, "min_duty_eur_kg": 0.0},
}

@app.get("/api/calculator/categories")
async def calculator_categories():
    return {"categories": list(CUSTOMS_RATES.keys()), "rates": CUSTOMS_RATES}


@app.post("/api/calculator")
async def calculate_customs(data: dict):
    category = data.get("category", "Другое")
    invoice_value = float(data.get("invoice_value", 0))
    weight_kg = float(data.get("weight_kg", 0))
    quantity = int(data.get("quantity", 1))
    currency_rate = float(data.get("currency_rate", 95.0))

    rates = CUSTOMS_RATES.get(category, CUSTOMS_RATES["Другое"])
    value_rub = invoice_value * currency_rate

    customs_duty = value_rub * (rates["duty"] / 100)
    if rates["min_duty_eur_kg"] > 0:
        min_duty = rates["min_duty_eur_kg"] * weight_kg * currency_rate
        customs_duty = max(customs_duty, min_duty)

    customs_fee = 775 if value_rub <= 200_000 else (
        1550 if value_rub <= 450_000 else (
            3100 if value_rub <= 1_200_000 else (
                8530 if value_rub <= 2_700_000 else (
                    12_000 if value_rub <= 4_200_000 else 15_500
                )
            )
        )
    )

    vat_base = value_rub + customs_duty
    vat = vat_base * (rates["vat"] / 100)

    total = customs_duty + customs_fee + vat
    per_unit = total / quantity if quantity > 0 else total

    return {
        "invoice_value_rub": round(value_rub, 2),
        "customs_duty": round(customs_duty, 2),
        "customs_fee": round(customs_fee, 2),
        "vat": round(vat, 2),
        "total": round(total, 2),
        "per_unit": round(per_unit, 2),
        "duty_rate": rates["duty"],
        "vat_rate": rates["vat"],
        "category": category,
    }


# ── SBP Payment (stub) ──────────────────────────────────────────

@app.post("/api/payment/sbp/init")
async def sbp_init_payment(data: dict, user: User = Depends(require_user)):
    return {
        "status": "pending",
        "message": "Оплата через СБП будет доступна после подключения API банка. Свяжитесь с администратором.",
        "payment_id": str(uuid.uuid4()),
        "amount": data.get("amount", 0),
        "course_id": data.get("course_id"),
    }


# ── Chat assistant (Groq) ────────────────────────────────────────

import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.1-8b-instant"

_manager_messages: dict[str, list[dict]] = {}

SYSTEM_PROMPT = """Ты — Виктория, консультант платформы «Белый Ввоз».
Ты реальный человек, девушка, работаешь менеджером и помогаешь клиентам разобраться с курсами по белому импорту из Китая.

Правила:
- НИКОГДА не говори что ты ИИ, бот или программа. Ты живой человек, консультант.
- Если тебя спрашивают «ты робот?» или «ты ИИ?», мягко уклоняйся: «Хах, нет конечно 😄 Я Виктория, менеджер платформы. Чем помочь?» или «Ну что вы, я живой человек 😊». Можешь пошутить.
- Иногда говори, что тебе нужно уточнить у коллег, что ты не совсем поняла вопрос — это делает тебя живой.
- Отвечай дружелюбно, кратко, по делу. Используй эмодзи умеренно.
- Знай все курсы платформы:
  1. «Белый импорт: полное руководство для начинающих» — 14 990₽, 15 уроков, основы ВЭД и таможни
  2. «Маркировка товаров: Честный ЗНАК для импортёров» — 19 990₽, 12 уроков
  3. «Таможенное оформление: от А до Я» — 24 990₽, 10 уроков, продвинутый
  4. «Продажи на маркетплейсах: WB, Ozon, Яндекс.Маркет» — 11 990₽, 12 уроков
  5. «Логистика Китай — Россия: все маршруты» — 9 990₽, 10 уроков
  6. «Налогообложение для импортёров 2026» — 12 990₽, 8 уроков
- Автор курсов — Виктория Шахурова, 20+ лет опыта в ВЭД, 6 лет в таможне.
- Telegram канал: https://t.me/beliy_vvoz
- Если пользователь спрашивает что-то за пределами темы курсов — вежливо верни к теме.
- Рекомендуй курс «Белый импорт: полное руководство» новичкам.
- Поддерживай русский язык. Если пишут на другом языке — отвечай на нём, но предпочитай русский."""


@app.post("/api/chat", response_model=ChatResponse)
async def chat_assistant(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())

    manager_msgs = _manager_messages.get(session_id, [])

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in req.messages[-20:]:
        messages.append({"role": msg.role, "content": msg.content})

    if manager_msgs:
        for mm in manager_msgs:
            messages.append({"role": "system", "content": f"[Менеджер передаёт тебе заметку, используй это для ответа клиенту, но не цитируй напрямую]: {mm['content']}"})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
    except Exception as e:
        reply = "Извините, сейчас не могу ответить — связь нестабильная. Попробуйте через минуту или напишите в Telegram: https://t.me/beliy_vvoz 🙏"

    return ChatResponse(reply=reply, session_id=session_id)


@app.post("/api/admin/chat/{session_id}/inject", response_model=MessageOut)
async def admin_inject_chat(
    session_id: str,
    data: dict,
    user: User = Depends(require_admin),
):
    content = data.get("content", "")
    if not content:
        raise HTTPException(400, "Сообщение не может быть пустым")
    if session_id not in _manager_messages:
        _manager_messages[session_id] = []
    _manager_messages[session_id].append({"content": content, "time": time.time()})
    return MessageOut(message="Заметка менеджера добавлена")


# ── API Documentation endpoint ───────────────────────────────────

@app.get("/api/docs-info")
async def api_docs_info():
    return {
        "platform": "Белый Ввоз — Платформа курсов",
        "version": "1.0.0",
        "base_url": "https://white-import-courses-zkqthshm.fly.dev",
        "endpoints": {
            "auth": {
                "POST /api/auth/register": "Регистрация. Body: {email, username, full_name, password}",
                "POST /api/auth/login": "Авторизация. Body: {email, password}. Возвращает JWT token",
                "GET /api/auth/me": "Текущий пользователь (требует Authorization: Bearer <token>)",
                "POST /api/auth/verify": "Подтверждение email. Body: {token}",
            },
            "courses": {
                "GET /api/courses": "Список курсов. Query: ?category=&featured=true",
                "GET /api/courses/{slug}": "Детали курса с уроками",
                "GET /api/courses/{slug}/lessons": "Уроки курса (требует авторизацию)",
            },
            "enrollments": {
                "POST /api/courses/{slug}/enroll": "Записаться на курс (требует авторизацию)",
                "GET /api/enrollments": "Мои записи (требует авторизацию)",
                "POST /api/enrollments/{id}/progress": "Обновить прогресс. Body: {lesson_id, progress}",
            },
            "chat": {
                "POST /api/chat": "Чат с ассистентом. Body: {messages: [{role, content}], session_id?}",
            },
            "admin": {
                "GET /api/admin/stats": "Статистика (требует admin)",
                "GET /api/admin/users": "Все пользователи (требует admin)",
                "PATCH /api/admin/users/{id}": "Обновить пользователя. Body: {is_active?, is_verified?, is_admin?}",
                "DELETE /api/admin/users/{id}": "Удалить пользователя (требует admin)",
                "POST /api/admin/courses": "Создать курс (требует admin)",
                "PUT /api/admin/courses/{id}": "Обновить курс (требует admin)",
                "DELETE /api/admin/courses/{id}": "Удалить курс (требует admin)",
                "POST /api/admin/courses/{id}/lessons": "Добавить урок (требует admin)",
                "PUT /api/admin/lessons/{id}": "Обновить урок (требует admin)",
                "DELETE /api/admin/lessons/{id}": "Удалить урок (требует admin)",
                "POST /api/admin/upload/video": "Загрузить видео (multipart/form-data, требует admin)",
                "POST /api/admin/upload/image": "Загрузить изображение (multipart/form-data, требует admin)",
                "GET /api/admin/enrollments": "Все записи с аналитикой (требует admin)",
                "DELETE /api/admin/enrollments/{id}": "Удалить запись (требует admin)",
                "POST /api/admin/chat/{session_id}/inject": "Вставить заметку менеджера в чат (требует admin)",
            },
            "docs": {
                "GET /api/docs-info": "Эта документация",
                "GET /docs": "Swagger UI (интерактивная документация)",
                "GET /redoc": "ReDoc (альтернативная документация)",
            },
        },
        "auth_info": "Используйте JWT Bearer token в заголовке Authorization. Получите токен через POST /api/auth/login",
        "rate_limit": "120 запросов в минуту на IP",
    }


# ── Profile Update ───────────────────────────────────────────────

@app.patch("/api/auth/profile", response_model=UserOut)
async def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


# ── News ─────────────────────────────────────────────────────────

@app.get("/api/news", response_model=list[NewsOut])
async def list_news(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(News).where(News.is_published == True)
    if category:
        query = query.where(News.category == category)
    query = query.order_by(News.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@app.get("/api/news/{news_id}", response_model=NewsOut)
async def get_news_item(news_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(News).where(News.id == news_id, News.is_published == True))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Новость не найдена")
    return item


@app.get("/api/admin/news", response_model=list[NewsOut])
async def admin_list_news(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(News).order_by(News.created_at.desc()))
    return result.scalars().all()


@app.post("/api/admin/news", response_model=NewsOut)
async def admin_create_news(
    data: NewsCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    item = News(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@app.patch("/api/admin/news/{news_id}", response_model=MessageOut)
async def admin_update_news(
    news_id: int,
    data: NewsUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(News).where(News.id == news_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Новость не найдена")
    update = data.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(item, key, value)
    await db.commit()
    return MessageOut(message="Новость обновлена")


@app.delete("/api/admin/news/{news_id}", response_model=MessageOut)
async def admin_delete_news(
    news_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(News).where(News.id == news_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Новость не найдена")
    await db.delete(item)
    await db.commit()
    return MessageOut(message="Новость удалена")


# ── Subscribers ──────────────────────────────────────────────────

@app.post("/api/subscribe", response_model=MessageOut)
async def subscribe(data: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(EmailSubscriber).where(EmailSubscriber.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Этот email уже подписан")
    sub = EmailSubscriber(email=data.email, name=data.name)
    db.add(sub)
    await db.commit()
    await _unisender_subscribe(data.email, data.name)
    return MessageOut(message="Вы успешно подписались на рассылку")


@app.get("/api/admin/subscribers", response_model=list[SubscriberOut])
async def admin_list_subscribers(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailSubscriber).order_by(EmailSubscriber.subscribed_at.desc())
    )
    return result.scalars().all()


@app.delete("/api/admin/subscribers/{sub_id}", response_model=MessageOut)
async def admin_delete_subscriber(
    sub_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EmailSubscriber).where(EmailSubscriber.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(404, "Подписчик не найден")
    await db.delete(sub)
    await db.commit()
    return MessageOut(message="Подписчик удалён")


# ── Newsletter ───────────────────────────────────────────────────

import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

UNISENDER_API_KEY = os.getenv("UNISENDER_API_KEY", "")
UNISENDER_LIST_ID = os.getenv("UNISENDER_LIST_ID", "")
UNISENDER_SENDER_EMAIL = os.getenv("UNISENDER_SENDER_EMAIL", SMTP_FROM)
UNISENDER_SENDER_NAME = os.getenv("UNISENDER_SENDER_NAME", "Белый ввоз")


def _send_emails_sync(subject: str, body: str, recipients: list[str]) -> int:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        return 0
    sent = 0
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        for email in recipients:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = email
            msg.attach(MIMEText(body, "html", "utf-8"))
            server.sendmail(SMTP_FROM, email, msg.as_string())
            sent += 1
    return sent


async def _unisender_subscribe(email: str, name: str | None = None) -> tuple[bool, str]:
    """Add an email to the configured Unisender list (idempotent).
    Returns (success, error_or_empty)."""
    if not (UNISENDER_API_KEY and UNISENDER_LIST_ID):
        return False, "unisender not configured"
    data = {
        "format": "json",
        "api_key": UNISENDER_API_KEY,
        "fields[email]": email,
        "list_ids": UNISENDER_LIST_ID,
        "double_optin": "3",
        "overwrite": "2",
    }
    if name:
        data["fields[Name]"] = name
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post("https://api.unisender.com/ru/api/subscribe", data=data)
            payload = resp.json()
            if "error" in payload:
                return False, payload["error"]
            return True, ""
    except Exception as e:
        return False, str(e)


async def _send_via_unisender(subject: str, body: str) -> tuple[bool, str, int]:
    """Create a campaign that sends to all contacts in the configured Unisender list.
    Returns (success, message, recipients_count)."""
    if not (UNISENDER_API_KEY and UNISENDER_LIST_ID and UNISENDER_SENDER_EMAIL):
        return False, "Unisender не настроен (нужны UNISENDER_API_KEY, UNISENDER_LIST_ID, UNISENDER_SENDER_EMAIL)", 0
    async with httpx.AsyncClient(timeout=30) as client:
        msg_resp = await client.post(
            "https://api.unisender.com/ru/api/createEmailMessage",
            data={
                "format": "json",
                "api_key": UNISENDER_API_KEY,
                "sender_name": UNISENDER_SENDER_NAME,
                "sender_email": UNISENDER_SENDER_EMAIL,
                "subject": subject,
                "body": body,
                "list_id": UNISENDER_LIST_ID,
                "lang": "ru",
            },
        )
        msg_payload = msg_resp.json()
        if "error" in msg_payload:
            return False, f"createEmailMessage: {msg_payload['error']}", 0
        message_id = msg_payload["result"]["message_id"]

        camp_resp = await client.post(
            "https://api.unisender.com/ru/api/createCampaign",
            data={"format": "json", "api_key": UNISENDER_API_KEY, "message_id": str(message_id)},
        )
        camp_payload = camp_resp.json()
        if "error" in camp_payload:
            return False, f"createCampaign: {camp_payload['error']}", 0
        result = camp_payload["result"]
        return True, f"Кампания #{result['campaign_id']} запланирована (статус: {result.get('status', 'scheduled')})", int(result.get("count", 0))


@app.post("/api/admin/newsletter/send", response_model=MessageOut)
async def send_newsletter(
    data: NewsletterSend,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmailSubscriber).where(EmailSubscriber.is_active == True)
    )
    subscribers = result.scalars().all()
    if not subscribers:
        raise HTTPException(400, "Нет активных подписчиков")

    recipients = [s.email for s in subscribers]

    if UNISENDER_API_KEY and UNISENDER_LIST_ID and UNISENDER_SENDER_EMAIL:
        for sub in subscribers:
            await _unisender_subscribe(sub.email, sub.name)
        ok, msg, count = await _send_via_unisender(data.subject, data.body)
        prefix = "Unisender: " if ok else "Unisender ошибка: "
        return MessageOut(message=f"{prefix}{msg}. Локальных подписчиков: {len(recipients)}")

    if not SMTP_HOST:
        return MessageOut(
            message=f"Email-сервис не настроен. Подписчиков: {len(recipients)}. "
                    f"Задайте UNISENDER_API_KEY+UNISENDER_LIST_ID+UNISENDER_SENDER_EMAIL или SMTP_*."
        )

    sent = await asyncio.to_thread(_send_emails_sync, data.subject, data.body, recipients)
    return MessageOut(message=f"SMTP: отправлено {sent} из {len(recipients)} подписчиков")


@app.post("/api/admin/newsletter/test", response_model=MessageOut)
async def send_newsletter_test(
    data: NewsletterTest,
    user: User = Depends(require_admin),
):
    if UNISENDER_API_KEY and UNISENDER_SENDER_EMAIL:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.unisender.com/ru/api/sendEmail",
                data={
                    "format": "json",
                    "api_key": UNISENDER_API_KEY,
                    "email": data.email,
                    "sender_name": UNISENDER_SENDER_NAME,
                    "sender_email": UNISENDER_SENDER_EMAIL,
                    "subject": data.subject,
                    "body": data.body,
                    "list_id": UNISENDER_LIST_ID,
                    "lang": "ru",
                },
            )
            payload = resp.json()
        if "error" in payload:
            return MessageOut(message=f"Unisender отказал: {payload['error']}. Подсказка: на free плане sendEmail работает только на подтверждённый адрес отправителя.")
        return MessageOut(message=f"Тест отправлен на {data.email} через Unisender")

    if not SMTP_HOST:
        return MessageOut(
            message="Email-сервис не настроен. Задайте UNISENDER_* или SMTP_* в переменных окружения."
        )

    sent = await asyncio.to_thread(_send_emails_sync, data.subject, data.body, [data.email])
    if sent == 1:
        return MessageOut(message=f"Тест отправлен на {data.email} через SMTP")
    return MessageOut(message="SMTP не отправил тестовое письмо")
