import os
from flask import Flask, render_template, request, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import pandas as pd
from pathlib import Path

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "messagebox")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = Flask(__name__)

# Ensure exports directory exists
EXPORT_DIR = Path("exports")
EXPORT_DIR.mkdir(exist_ok=True)


def save_to_csv():
    """Query all messages and write to exports/messages.csv. Called after inserts/deletes."""
    try:
        with engine.begin() as conn:
            df = pd.read_sql(
                text("SELECT id, username, content, created_at FROM messages ORDER BY created_at DESC, id DESC"),
                conn
            )
        out_path = EXPORT_DIR / "messages.csv"
        if not df.empty:
            df = df.iloc[::-1]

            df.to_csv(out_path, index=False)
        else:
            empty_df = pd.DataFrame(columns=["id", "username", "content", "created_at"])
            empty_df.to_csv(out_path, index=False)
    except Exception as e:
        print("csv save failed:", e)

@app.route("/")
def home():
    return render_template("index.htm")

@app.route("/api/messages", methods=["GET", "POST", "DELETE"])
def messages():
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        username = (data.get("username") or "").strip()
        content = (data.get("content") or "").strip()

        if not username or not content:
            return jsonify({"ok": False, "error": "Username and message are required."}), 400

        try:
            with engine.begin() as conn:
                conn.execute(
                    text("INSERT INTO messages (username, content) VALUES (:username, :content)"),
                    {"username": username, "content": content}
                )
            save_to_csv()
            return jsonify({"ok": True})
        except SQLAlchemyError as e:
            print("POST /api/messages failed:", e)
            return jsonify({"ok": False, "error": str(e)}), 500

    elif request.method == "GET":
        try:
            with engine.begin() as conn:
                result = conn.execute(
                    text("SELECT id, username, content, created_at FROM messages ORDER BY created_at DESC, id DESC")
                )
                messages = [dict(row._mapping) for row in result]
            return jsonify({"ok": True, "messages": messages})
        except SQLAlchemyError as e:
            print("GET /api/messages failed:", e)
            return jsonify({"ok": False, "error": str(e)}), 500

    elif request.method == "DELETE":
        data = request.get_json(silent=True)
        msg_id = data.get("id")
        username = (data.get("username") or "").strip()

        if not msg_id or not username:
            return jsonify({"ok": False, "error": "Message ID and username required."}), 400

        try:
            with engine.begin() as conn:
                result = conn.execute(
                    text("DELETE FROM messages WHERE id = :id AND username = :username"),
                    {"id": msg_id, "username": username}
                )

            if result.rowcount == 0:
                return jsonify({"ok": False, "error": "No message found for this ID and username"}), 404
            

            save_to_csv()
            return jsonify({"ok": True})
        
        except SQLAlchemyError as e:
            print("DELETE /api/messages failed:", e)
            return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")