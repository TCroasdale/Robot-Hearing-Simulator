from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
import sqlite3 as sql# Temporary
from celery import Celery

celeryApp = Celery('servertasks', broker='pyamqp://guest@localhost//')

def endTask(taskID):
    celeryApp.control.revoke(taskID, terminate=True)

@celeryApp.task(bind=True)
def runSimulation(self, simconfig, roboconfig, filename, simid):
    sim_config = util.objectifyJson(simconfig)
    robo_config = util.objectifyJson(roboconfig)
    downloadPath = "{0}.zip".format(filename)
    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
        cur.execute("UPDATE simulations SET state = ?, taskID = ? WHERE id = ?" , ("running", self.request.id, simid))
        con.commit()

    # try:
    dlFile = sim.run_from_json_config(sim_config, robo_config, filename)

    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
        cur.execute("UPDATE simulations SET state = ? WHERE id = ?" , ("finished", simid))
        con.commit()
        cur.execute("UPDATE simulations SET pathToZip = ? WHERE id = ?" , (dlFile, simid))
        con.commit()
    # except:
    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
        cur.execute("UPDATE simulations SET state = ? WHERE id = ?" , ("errored", simid))
        con.commit()
