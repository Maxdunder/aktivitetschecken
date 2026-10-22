from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "fdfca33e2f84589b2e4a98275b56b0f4a60287e0164cfa405fc1b588808633c2"

DATABASE = "database.db"


def get_db():
    return sqlite3.connect(DATABASE)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/registrera", methods=["GET", "POST"])
def registrera():
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