from .db_manager import DB_Manager, User, Simulation, Sound, Robot
from pymongo import MongoClient

class DB_Manager_MongoDB(DB_Manager):
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
