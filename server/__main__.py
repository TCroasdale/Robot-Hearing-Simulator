from server import WebServer
from utilities import Utilities
from database.db_manager import User, Simulation, Sound, Robot
from database.db_manager_sqlite import DB_Manager_SQLite
from database.db_manager_mongodb import DB_Manager_MongoDB
from config import *
from apscheduler.schedulers.background import BackgroundScheduler

if __name__ == "__main__":

    if DATABASE == "SQLite":
        db = DB_Manager_SQLite("server/{0}".format(SQLITE_DB_LOCATION))
    else:
        db = DB_Manager()

    server = WebServer(db)

    scheduler = BackgroundScheduler()
    scheduler.add_job(Utilities.cleanup_old_files, 'interval', hours=24, kwargs={'db': db})
    # scheduler.add_job(server.cleanup_old_files, 'interval', seconds=20)
    scheduler.start()

    server.start()
