from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
from database.db_manager import User, Simulation, Sound, Robot
from database.db_manager_sqlite import DB_Manager_SQLite
from celery import Celery
from datetime import datetime as dt
from config import *
from celery.utils.log import get_task_logger


celeryApp = Celery('servertasks', broker='pyamqp://guest@localhost//')

def endTask(taskID):
    celeryApp.control.revoke(taskID, terminate=True)

@celeryApp.task(bind=True)
def runSimulation(self, simconfig, roboconfig, sounds, filename, simid):
    if DATABASE == "SQLite":
        db = DB_Manager_SQLite(SQLITE_DB_LOCATION)
    else:
        db = DB_Manager()

    sim_config = util.objectifyJson(simconfig)
    robo_config = util.objectifyJson(roboconfig)
    downloadPath = "{0}.zip".format(filename)

    db.run_query("UPDATE simulations SET state = ?, taskID = ? WHERE id = ?" , ("running", self.request.id, simid))

    try:
        dlFile = sim.run_from_json_config(sim_config, robo_config, sounds, filename)

        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("finished", simid))
        db.run_query("UPDATE simulations SET pathToZip = ? WHERE id = ?" , (dlFile, simid))
        db.run_query("UPDATE simulations SET dateFinished = ? WHERE id = ?" , (str(dt.now().date()), simid))

    except Exception as e:
        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("errored", simid))
