from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")

@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory(os.path.join(BASE_DIR, "images"), filename)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")

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

    conn = get_db()

    if request.method == 'POST':
        action = request.form["action"]

        if action == 'username':
            username = request.form["changeusername"]

            conn.execute(
                "UPDATE users SET name = ? WHERE id = ?",
                (username, session["user_id"])
            )

        if action == 'email':
            email = request.form["changeemail"]
        
            conn.execute(
                "UPDATE users SET email = ? WHERE id = ?",
                (email, session["user_id"])
            )

        if action == 'phone':
            phone = request.form["changephone"]
                
            conn.execute(
                "UPDATE users SET phone = ? WHERE id = ?",
                (phone, session["user_id"])
            )

        if action == 'password':
            newPassword = request.form['changepassword']
            confrimPassword = request.form['confirmpassword']
            if confrimPassword == newPassword:
                newPassword_hash = generate_password_hash(newPassword)
                conn.execute(
                    "UPDATE users SET password_hash = ? WHERE id = ?",
                    (newPassword, session['user_id'])
                )

        if action == 'company':
            company = request.form["companyname"]
                
            conn.execute(
                "UPDATE users SET company = ? WHERE id = ?",
                (company, session["user_id"])
            )

        if action == 'picture':
            file = request.files["profile_picture"]

            if file and file.filename:
                allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
                extension = file.filename.rsplit(".", 1)[-1].lower()

                if extension not in allowed_extensions:
                    conn.close
                    return "Invalid image format!"

                filename = secure_filename(str(uuid.uuid4()) + "." + extension)

               upload_folder = os.path.join(BASE_DIR, "static", "profile_pictures")
                os.makedirs(upload_folder, exist_ok=True)

                file.save(os.path.join(upload_folder, filename))

                image_path = "/static/profile_pictures/" + filename

                conn.execute(
                    "UPDATE users SET profile_picture = ? WHERE id = ?",
                    (image_path, session['user_id'])
                )

            

        conn.commit()
        conn.close()

        return redirect(url_for("profile"))
    

    return render_template("profile.html", user=user)


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
