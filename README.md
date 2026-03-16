# СЭД-СТАВ (Laravel + MySQL)

Система электронного документооборота перенесена в папку STAV и переведена на Laravel и MySQL.

## Требования

- PHP 8.2+
- Composer
- MySQL 5.7+ / MariaDB
- Расширения PHP: pdo_mysql, mbstring, xml, ctype, json, bcrypt

## Установка

1. **Настройка БД**

   Создайте базу MySQL и укажите параметры в `.env`:

   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=stav_sed
   DB_USERNAME=root
   DB_PASSWORD=ваш_пароль
   ```

2. **Миграции и сидер**

   ```bash
   cd STAV
   php artisan migrate --force
   php artisan db:seed --force
   ```

3. **Запуск**

   ```bash
   php artisan serve
   ```

   Откройте в браузере: http://localhost:8000

   - **Вход:** http://localhost:8000/login  
   - **Тестовый пользователь:** `admin@stav.ltd` / `admin123`

## Структура

- **Маршруты:** `routes/web.php` — страницы и API под префиксом `/api` (сессия).
- **Контроллеры:** `app/Http/Controllers/Auth/LoginController.php`, `app/Http/Controllers/Api/*`.
- **Модели:** `app/Models/` — User, Department, Document, DocumentType, Category, ApprovalProcess, ApprovalStep и др.
- **Фронт:** Blade-шаблоны в `resources/views/`, статика в `public/` (style, script, img).  
  Данные загружаются через `public/script/api.js` (вызовы Laravel API вместо localStorage).

## Основные URL

| URL           | Описание        |
|---------------|-----------------|
| /login        | Вход            |
| /             | Главная         |
| /documents    | Документы       |
| /approvals    | Согласования    |
| /reports      | Отчеты          |
| /settings     | Настройки       |
| /profile      | Профиль         |

API (JSON): `/api/user`, `/api/documents`, `/api/approvals`, `/api/categories`, `/api/users` и др.
