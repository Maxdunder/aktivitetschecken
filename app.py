from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
app.secret_key = "fdfca33e2f84589b2e4a98275b56b0f4a60287e0164cfa405fc1b588808633c2"

DATABASE = "database.db"



def get_db():
    return sqlite3.connect(DATABASE)

def json_to_database():
    with open("static/activities.json", "r", encoding="utf-8") as file:
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

        

    return render_template("Registrera.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if "username" in session:
        return redirect(url_for("index"))
    if request.method == "POST":
        username = request.form['username']
        password = request.form['password']

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE name = ?",
            (username,)
        ).fetchone()
        conn.close()

        if user and check_password_hash(user[7], password):
            session["username"] = username
            return redirect(url_for("index"))
        else:
            return "Wrong username or password!"

    return render_template("Login.html")


if __name__ == "__main__":
    app.run(debug=True)