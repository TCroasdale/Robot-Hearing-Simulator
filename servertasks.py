from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
from database.db_manager import User, Simulation, Sound, Robot
from database.db_manager_sqlite import DB_Manager_SQLite
from celery import Celery
from datetime import datetime as dt

celeryApp = Celery('servertasks', broker='pyamqp://guest@localhost//')

def endTask(taskID):
    celeryApp.control.revoke(taskID, terminate=True)

@celeryApp.task(bind=True)
def runSimulation(self, db, simconfig, roboconfig, filename, simid):
    print("a")
    sim_config = util.objectifyJson(simconfig)
    print("a")
    robo_config = util.objectifyJson(roboconfig)
    print("a")
    downloadPath = "{0}.zip".format(filename)

    print("a")
    db.run_query("UPDATE simulations SET state = ?, taskID = ? WHERE id = ?" , ("running", self.request.id, simid))
    print("a")

    try:
        print("a")
        dlFile = sim.run_from_json_config(sim_config, robo_config, filename)
        print("a")
        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("finished", simid))
        print("a")
        db.run_query("UPDATE simulations SET pathToZip = ? WHERE id = ?" , (dlFile, simid))
        print("a")
        db.run_query("UPDATE simulations SET dateFinished = ? WHERE id = ?" , (str(dt.now().date()), simid))

    except Exception as e:
        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("errored", simid))


