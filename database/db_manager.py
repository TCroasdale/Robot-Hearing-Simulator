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

class Microphone:
    def __init__(self, name, pathToFile, userID, id=0, visibility=0):
        self.id = id
        self.name = name
        self.pathToFile = pathToFile
        self.userID = userID
        self.visibility = visibility

    def from_DB(data):
        if data is None: return None
        return Microphone(data[1], data[2], data[3], data[0], data[4])

    def from_DB_ls(data_list):
        return [Microphone.from_DB(d) for d in data_list]

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
    
    def __init__(self): pass

    def is_email_used(self, email): pass

    def get_user(self, email=None, id=None): pass
    
    def get_user_sims(self, id): pass

    def get_user_robots(self, id): pass

    def get_user_sounds(self, id): pass

    def run_query(self, q, a): pass

    def get_one(self, q, a, type=None): pass


    def get_all(self, q, a, type=None): pass

    def insert_microphone(self, mic): pass

    def insert_simulation(self, sim): pass

    def insert_robot(self, robo): pass

    def get_simulation(self, id): pass

    def get_sound(self, id): pass

    def get_microphone(self, id): pass

    def get_robot(self, id): pass


    def delete_simulation(self, id): pass

    def delete_sound(self, id): pass

    def delete_robot(self, id): pass


    def insert_user(self, user): pass

    def insert_sound(self, sound): pass
