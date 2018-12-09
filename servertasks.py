from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
import sqlite3 as sql# Temporary
from celery import Celery

celeryApp = Celery('servertasks', broker='pyamqp://guest@localhost//')

@celeryApp.task
def runSimulation(simconfig, filename, simid):
    config = util.objectifyJson(simconfig)
    downloadPath = "{0}.zip".format(filename)
    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
        cur.execute("UPDATE simulations SET state = ? WHERE id = ?" , ("running", simid))
        con.commit()

    sim.run_from_json_config(config, filename)

    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
        cur.execute("UPDATE simulations SET state = ? WHERE id = ?" , ("finished", simid))
        con.commit()