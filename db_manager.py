import sqlite3 as sql

class User:
    def __init__(self, email, hash, salt, id=0, access=0):
        self.id = id
        self.email = email
        self.hash = hash
        self.salt = salt
        self.access_level = access

    def from_DB(data):
        if data is None: return None
        return User(data[1], data[2], data[3], data[0], data[4])

    def from_DB_ls(data_list):
        return [User.from_DB(d) for d in data_list]

class Sound:
    def __init__(self, name, path, userID, id=0, visibility=0):
        self.id = id
        self.name = name
        self.pathToFile = path
        self.userID = userID
        self.visibility = visibility

    def from_DB(data):
        if data is None: return None
        return Sound(data[1], data[2], data[4], data[0], data[3])

    def from_DB_ls(data_list):
        return [Sound.from_DB(d) for d in data_list]

class Robot:
    def __init__(self, name, path, userID, id=0, visibility=0):
        self.id = id
        self.name = name
        self.pathToConfig = path
        self.userID = userID
        self.visibility = visibility

    def from_DB(data):
        if data is None: return None
        return Robot(data[1], data[2], data[3], data[0], data[4])

    def from_DB_ls(data_list):
        return [Robot.from_DB(d) for d in data_list]


class Simulation:
    def __init__(self, path, date, seed, userID, id=0, state="scheduled", zip="", visibility=0, tID=""):
        self.id = id
        self.pathToConfig = path
        self.dateCreated = date
        self.state = state
        self.seed = seed
        self.pathToZip = zip
        self.userID = userID
        self.visibility = visibility
        self.taskID = tID

    def from_DB(data):
        if data is None: return None
        return Simulation(data[1], data[2], data[4], data[6], data[0], data[3], data[5], data[7], data[8])

    def from_DB_ls(data_list):
        return [Simulation.from_DB(d) for d in data_list]

class DB_Manager:
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

            # print(sound_id)
            cur.execute(q, a)
            if type is None:
                return cur.fetchone()
            else:
                return type.from_DB(cur.fetchone())



    def get_all(self, q, a, type=None):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()

            # print(sound_id)
            cur.execute(q, a)

            if type is None:
                return cur.fetchall()
            else:
                return type.from_DB(cur.fetchall())


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


    def delete_simulation(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute("DELETE FROM simulations WHERE id=?", [id])

    def delete_sound(self, id):
        with sql.connect("Database/database.db") as con:
            cur = con.cursor()
            cur.execute("DELETE FROM sounds WHERE id=?", [id])


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
