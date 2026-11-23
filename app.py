from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json
import uuid
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # reject uploads over 5 MB

ACTIVITIES_FILE = os.path.join(BASE_DIR, "static", "activities.json")      # approved, shown on the map
PENDING_FILE = os.path.join(BASE_DIR, "data", "pending_activities.json")   # waiting for an admin
ACTIVITY_IMAGE_DIR = os.path.join(BASE_DIR, "static", "activity_images")
ALLOWED_IMAGES = {"png", "jpg", "jpeg", "gif", "webp"}
MARKERS = {"Sport": "/images/sport.png"}


@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory(os.path.join(BASE_DIR, "images"), filename)



def get_db():
    conn = sqlite3.connect(
        DATABASE,
        timeout=30
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def update_database():
    conn = get_db()

    columns = [
        "accepted INTEGER DEFAULT 1",
        "user_id INTEGER",
        "activity_id TEXT"
    ]

    existing_columns = [
        row["name"]
        for row in conn.execute("PRAGMA table_info(map)").fetchall()
    ]

    for column in columns:
        column_name = column.split()[0]

        if column_name not in existing_columns:
            conn.execute(f"ALTER TABLE map ADD COLUMN {column}")

    conn.commit()
    conn.close()


def json_to_database():
    activities = read_json_list(ACTIVITIES_FILE)
    conn = get_db()

    changed = False

    for activity in activities:

        if not activity.get("id"):
            activity["id"] = str(uuid.uuid4())
            changed = True

        exists = conn.execute("""
            SELECT id FROM map
            WHERE activity_id = ?
        """, (activity["id"],)).fetchone()

        if exists:
            continue

        conn.execute("""
            INSERT INTO map
            (latitude, longitude, title, category, description,
             date, time, location, image_path, marker_image,
             accepted, user_id, activity_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity["latitude"],
            activity["longitude"],
            activity["title"],
            activity["category"],
            activity["description"],
            activity["date"],
            activity["time"],
            activity["location"],
            activity.get("image", ""),
            activity.get("markerImage"),
            activity.get("accepted", True),
            activity.get("user_id"),
            activity["id"]
        ))

    conn.commit()
    conn.close()

    if changed:
        write_json_list(ACTIVITIES_FILE, activities)


def read_json_list(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_json_list(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    os.replace(tmp, path)


def user_activities(user_id):
    """Pending activities first, then approved ones, for one user."""
    pending = [a for a in read_json_list(PENDING_FILE) if a.get("user_id") == user_id]
    approved = [a for a in read_json_list(ACTIVITIES_FILE) if a.get("user_id") == user_id]
    return pending + approved


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


@app.route("/")
def index():
    json_to_database()
    return render_template("index.html")


@app.route("/mat")
def mat():
    return render_template("mat.html")

@app.route("/Alkohol")
def Alkohol():
    return render_template("Alkohol.html")

@app.route("/registrera", methods=["GET", "POST"])
def registrera():
    if "user_id" in session:
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

        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            return redirect(url_for("index"))
        else:
            return "Wrong username or password!"

    return render_template("Login.html")


@app.route("/profile", methods=["GET", "POST"])
def profile():
    user = get_session_user()

    if request.method == "POST":
        if not user:
            return redirect(url_for("login"))

        action = request.form["action"]
        conn = get_db()

        if action == "username":
            conn.execute(
                "UPDATE users SET name = ? WHERE id = ?",
                (request.form["changeusername"], session["user_id"])
            )

        elif action == "email":
            conn.execute(
                "UPDATE users SET email = ? WHERE id = ?",
                (request.form["changeemail"], session["user_id"])
            )

        elif action == "phone":
            conn.execute(
                "UPDATE users SET phone = ? WHERE id = ?",
                (request.form["changephone"], session["user_id"])
            )

        elif action == "password":
            new_password = request.form["changepassword"]
            confirm_password = request.form["confirmpassword"]
            if new_password == confirm_password:
                conn.execute(
                    "UPDATE users SET password_hash = ? WHERE id = ?",
                    (generate_password_hash(new_password), session["user_id"])
                )

        elif action == "company":
            conn.execute(
                "UPDATE users SET company = ? WHERE id = ?",
                (request.form["companyname"], session["user_id"])
            )

        elif action == "picture":
            file = request.files["profile_picture"]

            if file and file.filename:
                allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
                extension = file.filename.rsplit(".", 1)[-1].lower()

                if extension not in allowed_extensions:
                    conn.close()
                    return "Invalid image format!"

                filename = secure_filename(str(uuid.uuid4()) + "." + extension)

                upload_folder = os.path.join(BASE_DIR, "static", "profile_pictures")
                os.makedirs(upload_folder, exist_ok=True)
                file.save(os.path.join(upload_folder, filename))

                image_path = "/static/profile_pictures/" + filename
                conn.execute(
                    "UPDATE users SET profile_picture = ? WHERE id = ?",
                    (image_path, session["user_id"])
                )

        conn.commit()
        conn.close()
        return redirect(url_for("profile"))

    my_activities = []
    if user:
        my_activities = user_activities(session["user_id"])

    return render_template("profile.html", user=user, activities=my_activities)


@app.route("/add_activity", methods=["GET", "POST"])
def add_activity():
    if "user_id" not in session:
        return redirect(url_for("login"))

    if request.method == "POST":
        image_path = ""
        file = request.files.get("image")

        if file and file.filename:
            extension = file.filename.rsplit(".", 1)[-1].lower()
            if extension not in ALLOWED_IMAGES:
                return "Invalid image format!", 400

            filename = str(uuid.uuid4()) + "." + extension
            os.makedirs(ACTIVITY_IMAGE_DIR, exist_ok=True)
            file.save(os.path.join(ACTIVITY_IMAGE_DIR, filename))
            image_path = "/static/activity_images/" + filename

        category = request.form["category"].strip().capitalize()
        activity = {
            "latitude": float(request.form["latitude"]),
            "longitude": float(request.form["longitude"]),
            "title": request.form["title"],
            "category": category,
            "description": request.form["description"],
            "date": request.form["date"],
            "time": request.form["time"],
            "location": request.form["location"],
            "image": image_path,
            "markerImage": MARKERS.get(category),
            "accepted": False,
            "user_id": session["user_id"],
            "id": str(uuid.uuid4()),
        }

        pending = read_json_list(PENDING_FILE)
        pending.append(activity)
        write_json_list(PENDING_FILE, pending)

        return redirect(url_for("profile") + "#tab-aktiviteter")

    return render_template("add_activity.html")


def is_admin(user):
    return bool(user and user["admin"])


@app.route("/admin", methods=["GET", "POST"])
def admin():
    conn = get_db()
    conn.row_factory = sqlite3.Row
    users = conn.execute("SELECT * FROM users").fetchall()
    if not is_admin(get_session_user()):
        return "Forbidden", 403

    return render_template("admin.html", users=users)


@app.route("/api/admin/pending")
def get_pending_activities():
    if not is_admin(get_session_user()):
        return {"error": "Forbidden"}, 403

    return {
        "pending": read_json_list(PENDING_FILE),
        "approved_count": len(read_json_list(ACTIVITIES_FILE))
    }

@app.route("/admin/activities/<activity_id>/accept", methods=["POST"])
def accept_activity(activity_id):
    if not is_admin(get_session_user()):
        return "Forbidden", 403

    pending = read_json_list(PENDING_FILE)
    entry = next((a for a in pending if a.get("id") == activity_id), None)

    if entry is not None:
        entry["accepted"] = True

        approved = read_json_list(ACTIVITIES_FILE)
        approved.append(entry)
        write_json_list(ACTIVITIES_FILE, approved)

        remaining = [a for a in pending if a.get("id") != activity_id]
        write_json_list(PENDING_FILE, remaining)

        json_to_database()

    return redirect(url_for("admin"))


@app.route("/admin/activities/<activity_id>/reject", methods=["POST"])
def reject_activity(activity_id):
    if not is_admin(get_session_user()):
        return "Forbidden", 403

    pending = read_json_list(PENDING_FILE)
    remaining = [a for a in pending if a.get("id") != activity_id]
    write_json_list(PENDING_FILE, remaining)

    return redirect(url_for("admin"))

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect(url_for("index"))

@app.route("/users", methods=["GET", "POST"])
def users():

    conn = get_db()
    conn.row_factory = sqlite3.Row

    if request.method == "POST":

        user_id = request.form["user_id"]
        name = request.form["name"]
        email = request.form["email"]
        phone = request.form["phone"]
        company = request.form["company"]
        admin = 1 if request.form.get("admin") else 0

        conn.execute("""
            UPDATE users SET name = ?, email = ?, phone = ?, company = ?, admin = ? WHERE id = ? """,
            (name, email, phone, company, admin, user_id))

        conn.commit()
        conn.close()

        return redirect(url_for("users"))

    users = conn.execute("SELECT * FROM users").fetchall()

    conn.close()

    return render_template("users.html", users=users)


if __name__ == "__main__":
    app.run(debug=True)
