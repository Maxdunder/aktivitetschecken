import sqlite3

DB = "database.db"

def restore_food_drinks():

    conn = sqlite3.connect(DB)

    conn.execute("DELETE FROM map")
    conn.commit()
    conn.close()
if __name__ == "__main__":
    restore_food_drinks()
    print("Database updated!")