from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models import Course, Lesson
from .auth import get_password_hash
from .models import User


async def seed_data(db: AsyncSession):
    result = await db.execute(select(Course).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    # Create admin user
    admin = User(
        email="admin@belyi-vvoz.ru",
        username="admin",
        full_name="Администратор",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_verified=True,
        is_admin=True,
    )
    db.add(admin)

    courses_data = [
        {
            "title": "Белый импорт: полное руководство для начинающих",
            "slug": "white-import-beginners-guide",
            "description": """Полный курс для тех, кто хочет начать легальный импорт товаров из Китая в Россию.

В этом курсе вы узнаете:
• Что такое белый импорт и почему он выгоднее серых схем
• Как правильно оформлять все необходимые документы
• Как работать с таможней без стресса
• Как избежать штрафов и конфискации товаров
• Реальные кейсы успешных импортёров

Курс основан на 20-летнем опыте работы в сфере ВЭД и 6 годах в таможенных органах.""",
            "short_description": "Всё о легальном импорте из Китая: от документов до выпуска товара",
            "price": 14990,
            "old_price": 24990,
            "image_url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800",
            "category": "Основы импорта",
            "difficulty": "beginner",
            "duration_hours": 12,
            "lessons_count": 15,
            "is_featured": True,
            "lessons": [
                {"title": "Введение в белый импорт", "description": "Что такое белый ввоз и почему это важно", "duration_minutes": 45, "order": 1, "is_free": True, "content": "Белый импорт — это легальный способ ввоза товаров с полным оформлением всех документов и уплатой таможенных пошлин."},
                {"title": "Контракт с поставщиком", "description": "Как правильно составить контракт ВЭД", "duration_minutes": 60, "order": 2, "is_free": False, "content": "Контракт — это основа любой внешнеэкономической сделки."},
                {"title": "Инвойс: паспорт вашего груза", "description": "Всё об инвойсах для импорта", "duration_minutes": 50, "order": 3, "is_free": False, "content": "Инвойс — основной документ для таможенного оформления."},
                {"title": "Пэкинг-лист", "description": "Как составить пэкинг-лист без ошибок", "duration_minutes": 40, "order": 4, "is_free": False, "content": "Пэкинг-лист описывает содержимое каждого грузового места."},
                {"title": "Таможенная декларация", "description": "Подача и заполнение декларации", "duration_minutes": 55, "order": 5, "is_free": False, "content": "Таможенная декларация — свидетельство о рождении вашего товара."},
                {"title": "Пошлины и налоги", "description": "Как рассчитать и уплатить", "duration_minutes": 50, "order": 6, "is_free": False, "content": "Правильный расчёт пошлин и налогов — залог спокойного импорта."},
                {"title": "Транспортные документы", "description": "CMR, коносамент и накладные", "duration_minutes": 45, "order": 7, "is_free": False, "content": "Транспортные документы обеспечивают отслеживание груза."},
                {"title": "Платёжные документы", "description": "Подтверждение оплаты для таможни", "duration_minutes": 40, "order": 8, "is_free": False, "content": "Платёжные документы подтверждают легальность сделки."},
                {"title": "Сертификация товаров", "description": "Какие сертификаты нужны и где их получить", "duration_minutes": 60, "order": 9, "is_free": False, "content": "Сертификаты и декларации подтверждают безопасность товара."},
                {"title": "Код ТН ВЭД", "description": "Правильное определение кода товара", "duration_minutes": 50, "order": 10, "is_free": False, "content": "Код ТН ВЭД определяет ставку пошлины и необходимые разрешения."},
                {"title": "Работа с брокером", "description": "Как выбрать и работать с таможенным брокером", "duration_minutes": 45, "order": 11, "is_free": False, "content": "Таможенный брокер — ваш проводник через все процедуры."},
                {"title": "Страхование грузов", "description": "Зачем и как страховать товар", "duration_minutes": 35, "order": 12, "is_free": False, "content": "Страхование защищает вас от непредвиденных потерь."},
                {"title": "Логистика из Китая", "description": "Выбор маршрута и способа доставки", "duration_minutes": 55, "order": 13, "is_free": False, "content": "Выбор логистической схемы влияет на стоимость и сроки."},
                {"title": "Типичные ошибки импортёров", "description": "10 ошибок, которые стоят денег", "duration_minutes": 50, "order": 14, "is_free": False, "content": "Разбираем самые частые ошибки начинающих импортёров."},
                {"title": "Пошаговый план запуска", "description": "Ваш первый белый импорт от А до Я", "duration_minutes": 60, "order": 15, "is_free": False, "content": "Пошаговый план для первой легальной поставки."},
            ],
        },
        {
            "title": "Маркировка товаров: Честный ЗНАК для импортёров",
            "slug": "marking-honest-sign",
            "description": """Подробный курс по работе с системой маркировки «Честный ЗНАК» для импортёров.

Вы научитесь:
• Регистрироваться и работать в системе «Честный ЗНАК»
• Правильно маркировать импортные товары
• Соблюдать все требования законодательства
• Избегать штрафов за нарушение маркировки
• Работать с маркетплейсами (Wildberries, Ozon, Яндекс.Маркет)

Актуальная информация с учётом всех изменений 2025-2026 года.""",
            "short_description": "Система маркировки «Честный ЗНАК»: регистрация, работа, требования 2025-2026",
            "price": 19990,
            "old_price": 34990,
            "image_url": "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800",
            "category": "Маркировка",
            "difficulty": "intermediate",
            "duration_hours": 16,
            "lessons_count": 12,
            "is_featured": True,
            "lessons": [
                {"title": "Что такое «Честный ЗНАК»", "description": "Обзор системы маркировки", "duration_minutes": 45, "order": 1, "is_free": True, "content": "Система «Честный ЗНАК» — государственная система маркировки товаров."},
                {"title": "Регистрация в системе", "description": "Пошаговая регистрация в ЧЗ", "duration_minutes": 60, "order": 2, "is_free": False, "content": "Регистрация в системе «Честный ЗНАК»."},
                {"title": "Категории товаров", "description": "Какие товары подлежат маркировке", "duration_minutes": 50, "order": 3, "is_free": False, "content": "Перечень товаров, подлежащих обязательной маркировке."},
                {"title": "Заказ кодов маркировки", "description": "Как заказывать и наносить коды", "duration_minutes": 55, "order": 4, "is_free": False, "content": "Процесс заказа и нанесения кодов маркировки."},
                {"title": "Маркировка при импорте", "description": "Особенности маркировки для импортёров", "duration_minutes": 60, "order": 5, "is_free": False, "content": "Специфика маркировки импортных товаров."},
                {"title": "Работа с маркетплейсами", "description": "Маркировка для WB, Ozon, Яндекс.Маркет", "duration_minutes": 55, "order": 6, "is_free": True, "content": "Требования маркетплейсов к маркировке товаров."},
                {"title": "Перемаркировка товаров", "description": "Когда и как перемаркировать", "duration_minutes": 45, "order": 7, "is_free": False, "content": "Правила и процедуры перемаркировки."},
                {"title": "Штрафы и ответственность", "description": "Что грозит за нарушения", "duration_minutes": 40, "order": 8, "is_free": False, "content": "Штрафы и санкции за нарушение маркировки."},
                {"title": "Изменения 2025-2026", "description": "Новые правила и сроки", "duration_minutes": 50, "order": 9, "is_free": False, "content": "Актуальные изменения в законодательстве о маркировке."},
                {"title": "Игрушки и детские товары", "description": "Маркировка игрушек по новым правилам", "duration_minutes": 55, "order": 10, "is_free": False, "content": "Маркировка игрушек и детских товаров — ТН ВЭД 9503."},
                {"title": "Практика: от заказа до полки", "description": "Полный цикл маркировки на примере", "duration_minutes": 70, "order": 11, "is_free": False, "content": "Практический кейс маркировки партии товара."},
                {"title": "Автоматизация процессов", "description": "Сервисы и инструменты для маркировки", "duration_minutes": 50, "order": 12, "is_free": False, "content": "Инструменты автоматизации маркировки."},
            ],
        },
        {
            "title": "Таможенное оформление: от А до Я",
            "slug": "customs-clearance-a-to-z",
            "description": """Профессиональный курс по таможенному оформлению для импортёров.

Программа курса:
• Таможенное законодательство ЕАЭС
• Таможенные процедуры и режимы
• Расчёт таможенных платежей
• Заполнение деклараций
• Работа с таможенными органами
• Решение спорных ситуаций

Для тех, кто хочет разбираться в таможне как профессионал.""",
            "short_description": "Профессиональный курс по таможенному оформлению для импортёров",
            "price": 24990,
            "old_price": 39990,
            "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
            "category": "Таможня",
            "difficulty": "advanced",
            "duration_hours": 20,
            "lessons_count": 10,
            "is_featured": True,
            "lessons": [
                {"title": "Таможенное законодательство ЕАЭС", "description": "Основы правовой базы", "duration_minutes": 60, "order": 1, "is_free": True, "content": "Нормативно-правовая база таможенного дела в ЕАЭС."},
                {"title": "Таможенные процедуры", "description": "Виды и особенности процедур", "duration_minutes": 70, "order": 2, "is_free": False, "content": "Обзор таможенных процедур."},
                {"title": "Таможенная стоимость", "description": "Методы определения стоимости", "duration_minutes": 65, "order": 3, "is_free": False, "content": "Определение таможенной стоимости товаров."},
                {"title": "Расчёт платежей", "description": "Пошлины, НДС, акцизы", "duration_minutes": 60, "order": 4, "is_free": False, "content": "Расчёт таможенных платежей."},
                {"title": "Заполнение ДТ", "description": "Декларация на товары пошагово", "duration_minutes": 75, "order": 5, "is_free": False, "content": "Пошаговое заполнение декларации на товары."},
                {"title": "Классификация товаров", "description": "Определение кода ТН ВЭД", "duration_minutes": 60, "order": 6, "is_free": False, "content": "Правила классификации товаров."},
                {"title": "Таможенный контроль", "description": "Виды проверок и досмотров", "duration_minutes": 55, "order": 7, "is_free": False, "content": "Таможенный контроль и его формы."},
                {"title": "Валютный контроль", "description": "Валютные операции при импорте", "duration_minutes": 50, "order": 8, "is_free": False, "content": "Валютный контроль при внешнеэкономических операциях."},
                {"title": "Спорные ситуации", "description": "Обжалование решений таможни", "duration_minutes": 55, "order": 9, "is_free": False, "content": "Разрешение споров с таможенными органами."},
                {"title": "Практические кейсы", "description": "Реальные примеры оформления", "duration_minutes": 70, "order": 10, "is_free": False, "content": "Разбор реальных кейсов таможенного оформления."},
            ],
        },
        {
            "title": "Налогообложение для импортёров 2026",
            "slug": "tax-for-importers-2026",
            "description": """Актуальный курс по налогообложению для импортёров с учётом изменений 2026 года.

Темы курса:
• Изменения в УСН и ПСН с 2026 года
• НДС при импорте
• АУСН — новая система налогообложения
• Экологический сбор
• Оптимизация налоговой нагрузки
• Работа с ФНС""",
            "short_description": "Налоги для импортёров: все изменения 2026 года, УСН, НДС, АУСН",
            "price": 12990,
            "old_price": 19990,
            "image_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
            "category": "Налоги",
            "difficulty": "intermediate",
            "duration_hours": 10,
            "lessons_count": 8,
            "is_featured": False,
            "lessons": [
                {"title": "Обзор изменений 2026", "description": "Что изменится в налогах с 2026 года", "duration_minutes": 50, "order": 1, "is_free": True, "content": "Обзор ключевых налоговых изменений."},
                {"title": "УСН для импортёров", "description": "Особенности и ограничения УСН", "duration_minutes": 55, "order": 2, "is_free": False, "content": "Применение УСН при импортной деятельности."},
                {"title": "НДС при импорте", "description": "Расчёт и уплата НДС", "duration_minutes": 60, "order": 3, "is_free": False, "content": "Расчёт и уплата НДС при импорте."},
                {"title": "АУСН: плюсы и минусы", "description": "Новый налоговый режим", "duration_minutes": 55, "order": 4, "is_free": False, "content": "Автоматизированная упрощённая система налогообложения."},
                {"title": "Экологический сбор", "description": "Расчёт и уплата экосбора", "duration_minutes": 45, "order": 5, "is_free": False, "content": "Экологический сбор для импортёров."},
                {"title": "Валютный контроль", "description": "Операции с иностранной валютой", "duration_minutes": 50, "order": 6, "is_free": False, "content": "Валютный контроль при ВЭД."},
                {"title": "Оптимизация налогов", "description": "Легальные способы экономии", "duration_minutes": 60, "order": 7, "is_free": False, "content": "Легальная оптимизация налоговой нагрузки."},
                {"title": "Работа с ФНС", "description": "Отчётность и проверки", "duration_minutes": 50, "order": 8, "is_free": False, "content": "Взаимодействие с налоговыми органами."},
            ],
        },
        {
            "title": "Логистика Китай — Россия: все маршруты",
            "slug": "logistics-china-russia",
            "description": """Практический курс по логистике из Китая в Россию.

Вы изучите:
• Все актуальные маршруты доставки
• Морской, ж/д, авиа и автомобильный транспорт
• Транзит через Казахстан и Кыргызстан
• Страхование грузов
• Работа с логистическими компаниями
• Отслеживание грузов""",
            "short_description": "Все маршруты и способы доставки товаров из Китая в Россию",
            "price": 9990,
            "old_price": 16990,
            "image_url": "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800",
            "category": "Логистика",
            "difficulty": "beginner",
            "duration_hours": 8,
            "lessons_count": 10,
            "is_featured": False,
            "lessons": [
                {"title": "Обзор маршрутов", "description": "Все актуальные маршруты из Китая", "duration_minutes": 40, "order": 1, "is_free": True, "content": "Обзор логистических маршрутов Китай-Россия."},
                {"title": "Морская доставка", "description": "Контейнерные перевозки морем", "duration_minutes": 50, "order": 2, "is_free": False, "content": "Морские контейнерные перевозки."},
                {"title": "Железнодорожная доставка", "description": "ЖД перевозки из Китая", "duration_minutes": 45, "order": 3, "is_free": False, "content": "Железнодорожные перевозки."},
                {"title": "Авиадоставка", "description": "Авиаперевозки грузов", "duration_minutes": 40, "order": 4, "is_free": False, "content": "Авиаперевозки грузов из Китая."},
                {"title": "Автоперевозки", "description": "Доставка автотранспортом", "duration_minutes": 45, "order": 5, "is_free": False, "content": "Автомобильные перевозки."},
                {"title": "Транзит через ЕАЭС", "description": "Доставка через Казахстан и Кыргызстан", "duration_minutes": 50, "order": 6, "is_free": False, "content": "Транзит через страны ЕАЭС."},
                {"title": "Страхование грузов", "description": "Виды страхования и как оформить", "duration_minutes": 35, "order": 7, "is_free": False, "content": "Страхование грузов при международных перевозках."},
                {"title": "Работа с логистами", "description": "Выбор логистической компании", "duration_minutes": 40, "order": 8, "is_free": False, "content": "Выбор и работа с логистическими компаниями."},
                {"title": "Отслеживание грузов", "description": "Системы трекинга и контроля", "duration_minutes": 35, "order": 9, "is_free": False, "content": "Отслеживание грузов на всех этапах."},
                {"title": "Решение проблем", "description": "Что делать, когда груз застрял", "duration_minutes": 45, "order": 10, "is_free": False, "content": "Решение проблемных ситуаций в логистике."},
            ],
        },
        {
            "title": "Продажи на маркетплейсах: WB, Ozon, Яндекс.Маркет",
            "slug": "marketplace-sales",
            "description": """Курс по продаже импортных товаров на российских маркетплейсах.

Программа:
• Выход на Wildberries, Ozon, Яндекс.Маркет
• Оформление карточек товаров
• Маркировка для маркетплейсов
• Ценообразование и аналитика
• Продвижение товаров
• Работа с отзывами и рейтингом""",
            "short_description": "Как продавать импортные товары на WB, Ozon и Яндекс.Маркет",
            "price": 11990,
            "old_price": 21990,
            "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
            "category": "Маркетплейсы",
            "difficulty": "beginner",
            "duration_hours": 14,
            "lessons_count": 12,
            "is_featured": False,
            "lessons": [
                {"title": "Выбор маркетплейса", "description": "Сравнение площадок", "duration_minutes": 45, "order": 1, "is_free": True, "content": "Сравнение маркетплейсов для продажи импортных товаров."},
                {"title": "Регистрация продавца", "description": "Как стать продавцом на WB/Ozon/ЯМ", "duration_minutes": 50, "order": 2, "is_free": True, "content": "Процесс регистрации на маркетплейсах."},
                {"title": "Карточки товаров", "description": "Создание продающих карточек", "duration_minutes": 55, "order": 3, "is_free": False, "content": "Создание эффективных карточек товаров."},
                {"title": "Маркировка для МП", "description": "Требования маркетплейсов к маркировке", "duration_minutes": 50, "order": 4, "is_free": False, "content": "Маркировка товаров для маркетплейсов."},
                {"title": "Ценообразование", "description": "Как считать unit-экономику", "duration_minutes": 55, "order": 5, "is_free": False, "content": "Ценообразование на маркетплейсах."},
                {"title": "Логистика на МП", "description": "FBO, FBS, DBS — что выбрать", "duration_minutes": 45, "order": 6, "is_free": False, "content": "Логистические схемы маркетплейсов."},
                {"title": "Продвижение товаров", "description": "Реклама и SEO на маркетплейсах", "duration_minutes": 50, "order": 7, "is_free": False, "content": "Продвижение товаров на маркетплейсах."},
                {"title": "Отзывы и рейтинг", "description": "Работа с отзывами", "duration_minutes": 40, "order": 8, "is_free": False, "content": "Управление отзывами и рейтингом."},
                {"title": "Аналитика продаж", "description": "Ключевые метрики и инструменты", "duration_minutes": 50, "order": 9, "is_free": False, "content": "Аналитика продаж на маркетплейсах."},
                {"title": "Возвраты и споры", "description": "Работа с возвратами и претензиями", "duration_minutes": 45, "order": 10, "is_free": False, "content": "Работа с возвратами."},
                {"title": "Масштабирование", "description": "Рост продаж и ассортимента", "duration_minutes": 50, "order": 11, "is_free": False, "content": "Масштабирование бизнеса на маркетплейсах."},
                {"title": "Кейсы успешных продавцов", "description": "Разбор реальных примеров", "duration_minutes": 55, "order": 12, "is_free": False, "content": "Реальные кейсы."},
            ],
        },
    ]

    for course_data in courses_data:
        lessons_data = course_data.pop("lessons")
        course = Course(**course_data)
        db.add(course)
        await db.flush()

        for lesson_data in lessons_data:
            lesson = Lesson(course_id=course.id, **lesson_data)
            db.add(lesson)

    await db.commit()
