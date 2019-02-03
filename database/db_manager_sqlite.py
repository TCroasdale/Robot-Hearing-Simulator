from .db_manager import DB_Manager, User, Simulation, Sound, Robot
import sqlite3 as sql

class DB_Manager_SQLite(DB_Manager):
    def __init__(self, db):
        self.dbLocation = db

    def is_email_used(self, email):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM users WHERE email=?", [email])
            return cur.fetchone() != None

    def get_user(self, email=None, id=None):
        if email is None and id is None:
            return None
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            if id is None:
                cur.execute("SELECT * FROM users WHERE email=?", [email])
            else:
                cur.execute("SELECT * FROM users WHERE id=?", [id])
            return User.from_DB(cur.fetchone())

    def get_user_sims(self, id):
        sims = []
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM simulations WHERE userID=?", [id])
            allsims = cur.fetchall()
            sims = Simulation.from_DB_ls(allsims)
        return sims

    def get_user_robots(self, id):
        robots = []
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM robots WHERE userID=?", [id])
            allrobots = cur.fetchall()
            robots = Robot.from_DB_ls(allrobots)
        return robots

    def get_user_sounds(self, id):
        sounds = []
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM sounds WHERE userID=?", [id])
            allsounds = cur.fetchall()
            sounds = Sound.from_DB_ls(allsounds)
        return sounds


    def run_query(self, q, a):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute(q , a)
            con.commit()

    def get_one(self, q, a, type=None):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute(q, a)
            if type is None:
                return cur.fetchone()
            else:
                return type.from_DB(cur.fetchone())



    def get_all(self, q, a, type=None):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute(q, a)

            if type is None:
                return cur.fetchall()
            else:
                return type.from_DB_ls(cur.fetchall())

    def insert_microphone(self, mic):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("INSERT INTO microphones (name, pathToFile) VALUES (?,?,?)",(mic.name, mic.pathToFile, mic.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM microphone WHERE id=?", [rowid])
            return Microphone.from_DB(cur.fetchone())


    def insert_simulation(self, sim):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("INSERT INTO simulations (pathToConfig, dateCreated, state, seed, userID, visibility) \
                VALUES (?,?,?,?,?,?)",(sim.pathToConfig, sim.dateCreated, sim.state, sim.seed, sim.userID, sim.visibility))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM simulations WHERE id=?", [rowid])
            return Simulation.from_DB(cur.fetchone())

    def insert_robot(self, robo):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("INSERT INTO robots (name, pathToConfig, userID, visibility) \
                VALUES (?,?,?,?)",(robo.name, robo.pathToConfig, robo.userID, robo.visibility))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM robots WHERE id=?", [rowid])
            return Robot.from_DB(cur.fetchone())

    def get_simulation(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM simulations WHERE id=?", [id])
            return Simulation.from_DB(cur.fetchone())

    def get_sound(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM sounds WHERE id=?", [id])
            return Sound.from_DB(cur.fetchone())

    def get_microphone(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM microphones WHERE id=?", [id])
            return Microphone.from_DB(cur.fetchone())

    def get_robot(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM robots WHERE id=?", [id])
            return Robot.from_DB(cur.fetchone())


    def delete_simulation(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute("DELETE FROM simulations WHERE id=?", [id])

    def delete_sound(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute("DELETE FROM sounds WHERE id=?", [id])

    def delete_robot(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute("DELETE FROM robots WHERE id=?", [id])


    def insert_user(self, user):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("INSERT INTO users (email, passHash, passSalt) \
                VALUES (?,?,?)",(user.email, user.hash, user.salt))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM users WHERE id=?", [rowid])
            return User.from_DB(cur.fetchone())

    def insert_sound(self, sound):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO sounds (name, pathToFile, visibility, userID) VALUES (?,?,?,?)",\
                        (sound.name, sound.pathToFile, sound.visibility, sound.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM sounds WHERE id=?", [rowid])
            return Sound.from_DB(cur.fetchone())
