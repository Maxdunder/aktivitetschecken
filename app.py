from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def json_to_database():
    with open(os.path.join(BASE_DIR, "static", "activities.json"), "r", encoding="utf-8") as file:
        activities = json.load(file)
    conn = get_db()

    for activity in activities:
        conn.execute("""
            INSERT INTO map
            (latitude, longitude, title, category, description,
             date, time, location, image_path, marker_image, user_id, activity_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity["latitude"],
            activity["longitude"],
            activity["title"],
            activity["category"],
            activity["description"],
            activity["date"],
            activity["time"],
            activity["location"],
            activity["image"],
            activity["markerImage"],
            "test",
            "testid"
        ))

    conn.commit()
    conn.close()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/mat")
def mat():
    return render_template("mat.html")


@app.route("/registrera", methods=["GET", "POST"])
def registrera():
    if "username" in session:
        return redirect(url_for("index"))
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        phone = request.form["phone"]
        password_hash = generate_password_hash(request.form["password"])

        conn = get_db()
        conn.execute(
            "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
            (username, email, phone, password_hash)
        )
        conn.commit()
        conn.close()

        return redirect(url_for("login"))

    return render_template("Registrera.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("index"))
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE name = ?",
            (username,)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user[7], password):
            session["user_id"] = user[0]
            return redirect(url_for("index"))
        else:
            return "Wrong username or password!"
    
    return render_template("Login.html")

def get_session_user():
    if "user_id" not in session:
        return None
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (session["user_id"],)
    ).fetchone()
    conn.close()

    return user

@app.route("/profile", methods=["GET", "POST"])
def profile():
    user = get_session_user()

    print(user['profile_picture'])

    return render_template("profile.html", user=user)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
