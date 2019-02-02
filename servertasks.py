from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
import sqlite3 as sql# Temporary
from celery import Celery

celeryApp = Celery('servertasks', broker='pyamqp://guest@localhost//')

def endTask(taskID):
    celeryApp.control.revoke(taskID, terminate=True)

@celeryApp.task(bind=True)
def runSimulation(self, db, simconfig, roboconfig, filename, simid):
    sim_config = util.objectifyJson(simconfig)
    robo_config = util.objectifyJson(roboconfig)
    downloadPath = "{0}.zip".format(filename)

    db.run_query("UPDATE simulations SET state = ?, taskID = ? WHERE id = ?" , ("running", self.request.id, simid))

    try:
        dlFile = sim.run_from_json_config(sim_config, robo_config, filename)
        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("finished", simid))
        db.run_query("UPDATE simulations SET pathToZip = ? WHERE id = ?" , (dlFile, simid))

    except:
        db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("errored", simid))