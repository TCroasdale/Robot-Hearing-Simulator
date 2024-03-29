from .db_manager import *
import sqlite3 as sql

class DB_Manager_SQLite(DB_Manager):
    def __init__(self, db):
        self.dbLocation = db

    def set_test_db(self):
        self.dbLocation = 'server/database/test.db'
        self.delete_user('*')
        self.delete_simulation('*')
        self.delete_microphone('*')
        self.delete_robot('*')
        self.delete_sound('*')

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

    def get_user_mics(self, id):
        sounds = []
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("SELECT * FROM microphones WHERE userID=?", [id])
            allmics = cur.fetchall()
            mics = Microphone.from_DB_ls(allmics)
        return mics



    def run_query(self, q, a):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute(q , a)
            con.commit()

    def get_one(self, q, a, type=None):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute(q, a)
            if type is None:
                return cur.fetchone()
            else:
                return type.from_DB(cur.fetchone())



    def get_all(self, q, a, type=None):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute(q, a)

            if type is None:
                return cur.fetchall()
            else:
                return type.from_DB_ls(cur.fetchall())

    def insert_microphone(self, mic):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO microphones (name, pathToFile, userID) VALUES (?,?,?)",(mic.name, mic.pathToFile, mic.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM microphones WHERE id=?", [rowid])
            return Microphone.from_DB(cur.fetchone())


    def insert_simulation(self, sim):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO simulations (pathToConfig, dateCreated, state, seed, userID) \
                VALUES (?,?,?,?,?)",(sim.pathToConfig, sim.dateCreated, sim.state, sim.seed, sim.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM simulations WHERE id=?", [rowid])
            return Simulation.from_DB(cur.fetchone())

    def insert_robot(self, robo):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO robots (name, pathToConfig, userID) \
                VALUES (?,?,?)",(robo.name, robo.pathToConfig, robo.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM robots WHERE id=?", [rowid])
            return Robot.from_DB(cur.fetchone())

    def get_simulation(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM simulations WHERE id=?", [id])
            return Simulation.from_DB(cur.fetchone())

    def get_sound(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM sounds WHERE id=?", [id])
            return Sound.from_DB(cur.fetchone())

    def get_microphone(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM microphones WHERE id=?", [id])
            return Microphone.from_DB(cur.fetchone())

    def get_robot(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM robots WHERE id=?", [id])
            return Robot.from_DB(cur.fetchone())

    def delete_public_item(self, itemid, item_type):
        public_item = self.get_one('SELECT * FROM public_items WHERE itemID=? and type=?', [itemid, item_type], type=PublicItem)

        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM public_items WHERE itemID=? and type=?", [itemid, item_type])
            cur.execute("DELETE FROM user_added_items WHERE itemID=?", [public_item.id])
            cur.execute("DELETE FROM user_liked_items WHERE itemID=?", [public_item.id])


    def delete_simulation(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM simulations WHERE id=?", [id])
        if self.item_is_public(id, "SIM"):
            self.delete_public_item(id, "SIM")


    def delete_sound(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM sounds WHERE id=?", [id])

        if self.item_is_public(id, "SOUND"):
            self.delete_public_item(id, "SOUND")

    def delete_user(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM users WHERE id=?", [id])


    def delete_robot(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM robots WHERE id=?", [id])
        if self.item_is_public(id, "ROBOT"):
            self.delete_public_item(id, "ROBOT")

    def delete_microphone(self, id):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()
            cur.execute("DELETE FROM microphones WHERE id=?", [id])
        if self.item_is_public(id, "MIC"):
            self.delete_public_item(id, "MIC")


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

            cur.execute("INSERT INTO sounds (name, pathToFile, userID) VALUES (?,?,?)",\
                        (sound.name, sound.pathToFile, sound.userID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM sounds WHERE id=?", [rowid])
            return Sound.from_DB(cur.fetchone())

    def insert_public_item(self, item):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO public_items (name, description, type, itemID, publisherID, publishDate) VALUES (?,?,?,?,?,?)",\
                        (item.name, item.description, item.type, item.itemID, item.publisherID, item.publishDate))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM public_items WHERE id=?", [rowid])
            return PublicItem.from_DB(cur.fetchone())

    def insert_user_liked_item(self, likedItem):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO user_liked_items (userID, itemID) VALUES (?,?)",\
                        (likedItem.userID, likedItem.itemID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM user_liked_items WHERE id=?", [rowid])
            return UserLikedItem.from_DB(cur.fetchone())


    def insert_user_added_item(self, addedItem):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("INSERT INTO user_added_items (userID, itemID) VALUES (?,?)",\
                        (addedItem.userID, addedItem.itemID))
            rowid = cur.lastrowid
            con.commit()
            cur.execute("SELECT * FROM user_added_items WHERE id=?", [rowid])
            return UserAddedItem.from_DB(cur.fetchone())

    def item_is_public(self, itemID, type):
        with sql.connect(self.dbLocation) as con:
            cur = con.cursor()

            cur.execute("SELECT * FROM public_items WHERE itemID = ? AND type = ?", [itemID, type])

            result = cur.fetchone()

            return (result is not None)
