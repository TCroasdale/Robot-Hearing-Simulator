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
    def __init__(self, name, pathToFile, userID, id=0):
        self.id = id
        self.name = name
        self.pathToFile = pathToFile
        self.userID = userID

    def from_DB(data):
        if data is None: return None
        return Microphone(data[1], data[2], data[3], data[0])

    def from_DB_ls(data_list):
        return [Microphone.from_DB(d) for d in data_list]

class Sound:
    def __init__(self, name, path, userID, id=0):
        self.id = id
        self.name = name
        self.pathToFile = path
        self.userID = userID

    def from_DB(data):
        if data is None: return None
        return Sound(data[1], data[2], data[3], data[0])

    def from_DB_ls(data_list):
        return [Sound.from_DB(d) for d in data_list]

class Robot:
    def __init__(self, name, path, userID, id=0):
        self.id = id
        self.name = name
        self.pathToConfig = path
        self.userID = userID

    def from_DB(data):
        if data is None: return None
        return Robot(data[1], data[2], data[3], data[0])

    def from_DB_ls(data_list):
        return [Robot.from_DB(d) for d in data_list]

    def __str__(self):
        return "id: {0}, name: {1}, pathToConfig: {2}, uID: {3}".format(self.id, self.name, self.pathToConfig, self.userID)


class Simulation:
    def __init__(self, path, date, seed, userID, id=0, df="", state="scheduled", zip="", tID=""):
        self.id = id
        self.pathToConfig = path
        self.dateCreated = date
        self.dateFinished = df
        self.state = state
        self.seed = seed
        self.pathToZip = zip
        self.userID = userID
        self.taskID = tID

    def from_DB(data):
        if data is None: return None
        return Simulation(data[1], data[2], data[5], data[7], id=data[0], df=data[3], state=data[4], zip=data[6], tID=data[8])

    def from_DB_ls(data_list):
        return [Simulation.from_DB(d) for d in data_list]

class UserAddedItem:
    def __init__(self, userID, itemID, id=0):
        self.id = id
        self.userID = userID
        self.itemID = itemID

    def from_DB(data):
        if data is None: return None
        return UserAddedItem(data[1], data[2], data[0])

    def from_DB_ls(data_list):
        return [UserAddedItem.from_DB(d) for d in data_list]

class UserLikedItem:
    def __init__(self, userID, itemID, id=0):
        self.id = id
        self.userID = userID
        self.itemID = itemID

    def from_DB(data):
        if data is None: return None
        return UserLikedItem(data[1], data[2], data[0])

    def from_DB_ls(data_list):
        return [UserLikedItem.from_DB(d) for d in data_list]

class PublicItem:
    def __init__(self, name, description, type, itemID, publisherID, id=0, likes=1, publishDate="06/03/2019"):
        self.id = id
        self.name = name
        self.description = description
        self.type = type
        self.itemID = itemID
        self.likes = likes
        self.publisherID = publisherID
        self.publishDate = publishDate

    def from_DB(data):
        if data is None: return None
        return PublicItem(data[1], data[2], data[3], data[4], data[6], data[0], data[5], data[7])

    def from_DB_ls(data_list):
        return [PublicItem.from_DB(d) for d in data_list]

class DB_Manager:

    def __init__(self): pass

    def is_email_used(self, email): pass

    def get_user(self, email=None, id=None): pass

    def get_user_sims(self, id): pass

    def get_user_robots(self, id): pass

    def get_user_sounds(self, id): pass

    def get_user_mics(self, id): pass

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

    def delete_microphone(self, id): pass

    def insert_user(self, user): pass

    def insert_sound(self, sound): pass

    def insert_public_item(self, item): pass

    def insert_user_liked_item(self, likedItem): pass

    def insert_user_added_item(self, addedItem): pass

    def item_is_public(self, type): pass
