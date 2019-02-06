from database.db_manager import Simulation

class Utilities:
    def objectifyJson(json):
        if isinstance(json, dict):
            for key in json:
                if isinstance(json[key], dict): #Check if it is a dict
                    Utilities.objectifyJson(json[key])
                elif isinstance(json[key], list):
                    for val in json[key]:
                        Utilities.objectifyJson(val)
                else:
                    try: # CHeck if it has numeric
                        json[key] = float(json[key])
                    except ValueError:
                        0 # Do Nothing
        else:
            if isinstance(json, list):
                for val in json:
                    Utilities.objectifyJson(val)
            else:
                try: # CHeck if it has numeric
                    json[key] = float(json[key])
                except ValueError:
                    0 # Do Nothing
        return json

    # Deletes files older than a week
    def cleanup_old_files(db):
        allsims = db.get_all('SELECT * FROM simulations WHERE state="finished"', [], type=Simulation)
        for sim in allsims:
            finishDate = dt.strptime(sim.dateFinished, '%Y-%m-%d')
            if dt.now() - timedelta(days=FILE_EXPIRY_DAYS) > finishDate:
                db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("expired", sim.id))
                db.run_query("UPDATE simulations SET pathToZip = ? WHERE id = ?" , ("", sim.id))
                try:
                    os.remove(sim.pathToZip)
                except:
                    print("Cannot delete simulation file, they're not here!")
