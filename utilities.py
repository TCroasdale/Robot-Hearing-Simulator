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
