"""
Авторизация Kruel AI: регистрация, верификация email, вход, проверка сессии.
"""
import json
import os
import random
import string
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1841729_ai_assistant_kruel")
SMTP_FROM = "kruelcompany2@gmail.com"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def gen_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def gen_token() -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=64))


def send_verification_email(to_email: str, code: str):
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Kruel AI — код подтверждения"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;border-radius:16px;padding:40px;color:#fff;">
      <h1 style="font-size:28px;letter-spacing:4px;background:linear-gradient(90deg,#a855f7,#3b82f6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 8px;">KRUEL AI</h1>
      <p style="color:#888;margin:0 0 32px;font-size:13px;">Твой AI-помощник</p>
      <p style="color:#ccc;margin:0 0 16px;">Твой код подтверждения:</p>
      <div style="background:#1a1a2e;border:1px solid #a855f7;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#a855f7;">{code}</span>
      </div>
      <p style="color:#666;font-size:12px;">Код действителен 10 минут. Если ты не регистрировался — просто проигнорируй это письмо.</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SMTP_FROM, smtp_password)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # POST /register — регистрация
    if method == "POST" and path.endswith("/register"):
        email = body.get("email", "").strip().lower()
        nickname = body.get("nickname", "").strip()
        password = body.get("password", "")

        if not email or not nickname or not password:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Заполни все поля"})}

        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Пароль должен быть не менее 6 символов"})}

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = '{email}'")
        existing = cur.fetchone()
        if existing:
            cur.execute(f"SELECT is_verified FROM {SCHEMA}.users WHERE email = '{email}'")
            row = cur.fetchone()
            if row and row[0]:
                conn.close()
                return {"statusCode": 409, "headers": CORS_HEADERS,
                        "body": json.dumps({"error": "Email уже зарегистрирован"})}

        pw_hash = hash_password(password)
        code = gen_code()
        expires = datetime.utcnow() + timedelta(minutes=10)
        expires_str = expires.strftime("%Y-%m-%d %H:%M:%S")

        if existing:
            cur.execute(f"UPDATE {SCHEMA}.users SET nickname='{nickname}', password_hash='{pw_hash}', is_verified=FALSE WHERE email='{email}'")
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.users (email, nickname, password_hash) VALUES ('{email}', '{nickname}', '{pw_hash}')")

        cur.execute(f"UPDATE {SCHEMA}.verification_codes SET used=TRUE WHERE email='{email}'")
        cur.execute(f"INSERT INTO {SCHEMA}.verification_codes (email, code, expires_at) VALUES ('{email}', '{code}', '{expires_str}')")
        conn.commit()
        conn.close()

        send_verification_email(email, code)

        return {"statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"success": True, "message": "Код отправлен на почту"})}

    # POST /verify — подтверждение кода
    if method == "POST" and path.endswith("/verify"):
        email = body.get("email", "").strip().lower()
        code = body.get("code", "").strip()

        if not email or not code:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Укажи email и код"})}

        conn = get_conn()
        cur = conn.cursor()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        cur.execute(f"SELECT id FROM {SCHEMA}.verification_codes WHERE email='{email}' AND code='{code}' AND used=FALSE AND expires_at > '{now_str}' ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Неверный или просроченный код"})}

        code_id = row[0]
        cur.execute(f"UPDATE {SCHEMA}.verification_codes SET used=TRUE WHERE id={code_id}")
        cur.execute(f"UPDATE {SCHEMA}.users SET is_verified=TRUE WHERE email='{email}'")

        cur.execute(f"SELECT id, nickname FROM {SCHEMA}.users WHERE email='{email}'")
        user = cur.fetchone()
        user_id, nickname = user[0], user[1]

        token = gen_token()
        expires = datetime.utcnow() + timedelta(days=30)
        expires_str = expires.strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES ({user_id}, '{token}', '{expires_str}')")
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"success": True, "token": token, "nickname": nickname, "email": email})}

    # POST /login — вход
    if method == "POST" and path.endswith("/login"):
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return {"statusCode": 400, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Введи email и пароль"})}

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id, nickname, is_verified FROM {SCHEMA}.users WHERE email='{email}' AND password_hash='{pw_hash}'")
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Неверный email или пароль"})}

        user_id, nickname, is_verified = row
        if not is_verified:
            conn.close()
            return {"statusCode": 403, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Email не подтверждён", "need_verify": True})}

        token = gen_token()
        expires = datetime.utcnow() + timedelta(days=30)
        expires_str = expires.strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES ({user_id}, '{token}', '{expires_str}')")
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"success": True, "token": token, "nickname": nickname, "email": email})}

    # GET /me — проверка сессии
    if method == "GET" and path.endswith("/me"):
        token = event.get("headers", {}).get("X-Session-Token", "")
        if not token:
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Не авторизован"})}

        conn = get_conn()
        cur = conn.cursor()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(f"SELECT u.id, u.nickname, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id=s.user_id WHERE s.token='{token}' AND s.expires_at > '{now_str}'")
        row = cur.fetchone()
        conn.close()

        if not row:
            return {"statusCode": 401, "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Сессия истекла"})}

        return {"statusCode": 200, "headers": CORS_HEADERS,
                "body": json.dumps({"id": row[0], "nickname": row[1], "email": row[2]})}

    return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Not found"})}
