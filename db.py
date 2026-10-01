# db.py  (bara Python, ingen webbserver)
import sqlite3

DB = "database.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  profile_picture TEXT,
  admin BOOLEAN,
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS map (
  id INTEGER NOT NULL,
  user_id BIGINT NOT NULL,
  activity_id BIGINT NOT NULL,
  latitude DECIMAL(10,2),
  longitude DECIMAL(10,2),
  bio TEXT,
  image_path TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER NOT NULL,
  type VARCHAR(50),
  image_path TEXT,
  start_time TIMESTAMP,
  stop_time TIMESTAMP,
  admin_accpeted BOOLEAN,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS food_drinks (
  id INTEGER NOT NULL,
  activity_id BIGINT NOT NULL,
  name VARCHAR(255),
  price DECIMAL(10,2),
  description VARCHAR(255),
  menu_link TEXT,
  image_path TEXT,
  PRIMARY KEY (id),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
"""

def get_db():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row  # rader kan läsas som dictar
    db.execute("PRAGMA foreign_keys = ON")  # SQLite kollar FK först när detta är på
    return db

def init_db():
    with get_db() as db:  # "with" sparar (commit) ändringarna
        db.executescript(SCHEMA)

# ---- users ----
def add_users(name, email, phone, company, profile_picture, admin, password_hash):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO users (name, email, phone, company, profile_picture, admin, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, email, phone, company, profile_picture, admin, password_hash))
        return cur.lastrowid

def get_users():
    with get_db() as db:
        return [dict(r) for r in db.execute("SELECT id, name, email, phone, company, profile_picture, admin, created_at FROM users")]

# ---- map ----
def add_map(user_id, activity_id, latitude, longitude, bio, image_path):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO map (user_id, activity_id, latitude, longitude, bio, image_path) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, activity_id, latitude, longitude, bio, image_path))
        return cur.lastrowid

def get_map():
    with get_db() as db:
        return [dict(r) for r in db.execute("SELECT * FROM map")]

# ---- activities ----
def add_activities(type, image_path, start_time, stop_time, admin_accpeted):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO activities (type, image_path, start_time, stop_time, admin_accpeted) VALUES (?, ?, ?, ?, ?)",
            (type, image_path, start_time, stop_time, admin_accpeted))
        return cur.lastrowid

def get_activities():
    with get_db() as db:
        return [dict(r) for r in db.execute("SELECT * FROM activities")]

# ---- food_drinks ----
def add_food_drinks(activity_id, name, price, description, menu_link, image_path):
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO food_drinks (activity_id, name, price, description, menu_link, image_path) VALUES (?, ?, ?, ?, ?, ?)",
            (activity_id, name, price, description, menu_link, image_path))
        return cur.lastrowid

def get_food_drinks():
    with get_db() as db:
        return [dict(r) for r in db.execute("SELECT * FROM food_drinks")]

# ---- JOIN: data från två tabeller via FK ----
def get_map_with_users():
    with get_db() as db:
        rows = db.execute(
            "SELECT c.*, p.name AS users_name "
            "FROM map c JOIN users p ON c.user_id = p.id"
        )
        return [dict(r) for r in rows]

if __name__ == "__main__":
    init_db()
    print("users:", get_users())
    print("map:", get_map())
    print("activities:", get_activities())
    print("food_drinks:", get_food_drinks())
    print(get_map_with_users())