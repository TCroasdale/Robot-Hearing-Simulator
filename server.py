#######################################
# Author: Thomas Croasdale
#
# This file is responsible for running
# serving pages to the user and
# provessing the data they provide,
# and then sending that to the task
# server.
#
#######################################

from flask import Flask, session, redirect, url_for, request, render_template, jsonify, send_file
import hashlib
import json
import os
import uuid
from datetime import datetime as dt
from datetime import timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from servertasks import *
from database.db_manager import User, Simulation, Sound, Robot
from database.db_manager_sqlite import DB_Manager_SQLite
from config import *
app = Flask(__name__)

UPLOAD_FOLDER = "\\uploads\\sounds"
ALLOWED_EXTENSIONS = set(['wav'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#Returns true if filename has an allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    user = db.get_user(id=session['userID']) if 'userID' in session else None
    return render_template('index.html', user=user)

@app.route('/signup', methods = ['POST', 'GET'])
def signup():
   if request.method == 'POST':
      email = request.form['email']
      if not db.is_email_used(email):
          salt = uuid.uuid4().hex
          if len(request.form['password']) < 8:
              return render_template('signup.html', message="short-pass")

          if request.form['password'] == request.form['confirm-password']:
              pass_hash = hashlib.sha512(str(request.form['password'] + salt).encode('utf-8')).hexdigest()
              user = User(email, pass_hash, salt)
              user = db.insert_user(user)
              session['userID'] = user.id
              return redirect('/')
          else:
              return render_template('signup.html', message="no-match-pass")
      else:
        return render_template('signup.html', message="used-email")
   else:
      return render_template('signup.html', message="")

@app.route('/login', methods = ['POST', 'GET'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        if db.is_email_used(email):
            user = db.get_user(email=email)
            input_pass_hash = hashlib.sha512(str(request.form['password'] + user.salt).encode('utf-8')).hexdigest()
            if input_pass_hash == user.hash:
                session['userID'] = user.id
                if 'ref_url' in session:
                    ref = session['ref_url']
                    session.pop('ref_url', None)
                    return redirect('/' + ref)
                else:
                    return redirect('/')
            else:
                # user = db.get_user(id=session['userID']) if 'userID' in session else None
                return render_template('login.html', message="wrong-pass")
        else:
            # user = db.get_user(id=session['userID']) if 'userID' in session else None
            return render_template('login.html', message="no-match-email")
    else: # GET
        if 'ref' in request.args:
            session['ref_url'] = request.args.get('ref')


        # user = db.get_user(id=session['userID']) if 'userID' in session else None
        return render_template('login.html', message="")


@app.route('/logout', methods=['GET'])
def logout():
    session.pop('userID', None)
    return redirect('/')


@app.route('/dashboard', methods=['GET'])
def dashboard():
    if 'userID' not in session: return redirect('/login?ref=dashboard')

    simulations = db.get_user_sims(session['userID'])
    sounds = db.get_user_sounds(session['userID'])
    robots = db.get_user_robots(session['userID'])

    return render_template('dashboard.html', user=db.get_user(id=session['userID']), \
                            simulations=simulations, sounds=sounds, robots=robots)

@app.route('/simulator', methods=['GET'])
def simulator():
    if 'userID' not in session: return redirect('/login?ref=simulator')

    sounds = db.get_user_sounds(session['userID'])
    robots = db.get_user_robots(session['userID'])

    return render_template('simulator.html', user=db.get_user(id=session['userID']), sounds=sounds, robots=robots)

@app.route("/removesimulation", methods=['POST'])
def remove_sim():
    if 'userID' not in session: return jsonify({'success': 'false'})
    sim = db.get_simulation(request.form['sim_id'])
    try:
        os.remove(sim.pathToConfig)
        os.remove(sim.pathToZip)
    except:
        print("Cannot delete simulation files, they're not here!")

    db.delete_simulation(request.form['sim_id'])

    return jsonify({'success': 'true'})

@app.route("/removesound", methods=['POST'])
def remove_sound():
    if 'userID' not in session: return jsonify({'success': 'false'})
    sound = db.get_sound(request.form['sound_id'])
    try:
        os.remove(sound.pathToFile)
    except:
        print("Cannot delete sound file, it's not here!")

    db.delete_sound(request.form['sound_id'])

    return jsonify({'success': 'true'})

@app.route("/removerobot", methods=['POST'])
def remove_robot():
    if 'userID' not in session: return jsonify({'success': 'false'})
    robot = db.get_robot(request.form['robot_id'])
    try:
        os.remove(robot.pathToConfig)
    except:
        print("Cannot delete robot file, it's not here!")

    db.delete_robot(request.form['robot_id'])

    return jsonify({'success': 'true'})


@app.route('/revoke_simulation', methods=['POST'])
def revoke_simulation():
    if 'userID' not in session: return jsonify({"success": "false"})

    simid = request.form['sim_id']
    sim = db.get_simulation(simid)
    endTask(sim.taskID)

    db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("cancelled", simid))

    return jsonify({"success": "true"})


def insert_config_paths(dict):
    # attach the utterance path
    utteranceid = dict['simulation_config']['source_config']['input_utterance']['uid']
    utterance = db.get_one("SELECT * FROM sounds WHERE id=?", [utteranceid], type=Sound)
    if utterance is not None and (utterance.userID == session['userID'] or utterance.visibility > 0):
        dict['simulation_config']['source_config']['input_utterance']['path'] = utterance.pathToFile
    else:
        raise BadSoundIDException

    # attach the bgnoise path
    bgnoiseid = dict['simulation_config']['source_config']['background_noise']['uid']
    bgnoise = db.get_one("SELECT * FROM sounds WHERE id=?", [bgnoiseid], type=Sound)
    if bgnoise is not None and (bgnoise.userID == session['userID'] or bgnoise.visibility > 0):
        dict['simulation_config']['source_config']['background_noise']['path'] = bgnoise.pathToFile
    else:
        raise BadSoundIDException

    # Attach the robot config path
    robotid = dict['simulation_config']['robot_config']['uid']
    robot = db.get_one("SELECT * FROM robots WHERE id =?", [robotid], type=Robot)
    print(robotid)
    if robot is not None and (robot.userID == session['userID'] or robot.visibility > 0):
        dict['simulation_config']['robot_config']['path'] = robot.pathToConfig
    else:
        raise BadRobotIDException

    return (dict, robot.pathToConfig)

@app.route('/simulator/run_simulation', methods=['POST'])
def run_simulation():
    if 'userID' not in session: return jsonify({"success": "false"})

    strdict = json.loads(request.form['config'])
    print(request.form)
    print(request.files)

    if 'utterance' in request.files:
        utt = processSoundUpload(request.files['utterance'], session['userID']) 
        strdict['simulation_config']['source_config']['input_utterance']['uid'] = utt.id
    else:
        strdict['simulation_config']['source_config']['input_utterance']['uid'] = request.form['utterance_id']
    if 'bgnoise' in request.files:
        bgnoise = processSoundUpload(request.files['bgnoise'], session['userID']) 
        strdict['simulation_config']['source_config']['background_noise']['uid'] = bgnoise.id
    else:
        strdict['simulation_config']['source_config']['background_noise']['uid'] = request.form['bgnoise_id']
    
    strdict['simulation_config']['robot_config']['uid'] = request.form['robot_id']

    # Fix the file paths
    try:
        (strdict, robotPath) = insert_config_paths(strdict)
    except BadSoundIDException:
        return jsonify({"success": "false", "reason": "bad sound id"})
    except BadRobotIDException:
        return jsonify({"success": "false", "reason": "bad robot id"})

    # Save the JSON config to a file
    unique_name = uuid.uuid4()
    filename = "uploads/simulation_configs/{0}.json".format(unique_name)
    # print("putting sim file in: {0}".format(filename))
    with open(filename, 'w') as f:
        json.dump(strdict, f, sort_keys=False, indent=4, ensure_ascii = False)

    date = str(dt.now().date())
    sim = Simulation(filename, date, str(uuid.uuid4()), session['userID'])
    sim = db.insert_simulation(sim)


    robot_conf = open(robotPath).read()
    robot_conf_dict = json.loads(robot_conf)


    runSimulation.delay(db, strdict, robot_conf_dict, unique_name, sim.id)

    return jsonify({"success": "true"})


def processSoundUpload(file, user_id):
    # if user does not select file, browser also submit a empty part without filename
    if file.filename == '':
        # print("no file selected in uploads!")
        return None
    if file and allowed_file(file.filename):
        unique_name = uuid.uuid4()
        file.save('uploads/sounds/{0}.wav'.format(unique_name))

        sound = db.insert_sound(Sound(file.filename, 'uploads/sounds/{0}.wav'.format(unique_name), user_id))
        return sound
    return None


def insertSoundPaths(conf, sounds, motid_to_id):
    motors = conf['robot_config']['motors']
    for motor in motors:
        if motor['id'] in motid_to_id:
            snd_id = '{0}'.format(motid_to_id[motor['id']])
            if snd_id in sounds:
                motor['sound']['uid'] = sounds[snd_id].id
            else: # else Must be a direct sound id
                motor['sound']['uid'] = db.get_sound(snd_id).id
    return conf

@app.route('/designer/save', methods=['POST'])
def save_robot_config():
    if 'userID' not in session: return jsonify({"success": "false"})
    
    # Process Sounds
    sounds = {}
    for id in request.files:
        f = request.files[id]
        sound = processSoundUpload(f, session['userID']) 
        sounds[str(id)] = sound

    #Load config and mot_id to i map
    conf = json.loads(request.form['robot-config'])
    id_map = json.loads(request.form['id_map'])
    # Update the config with new id values
    print(conf)
    print(id_map)
    conf = insertSoundPaths(conf, sounds, id_map)

    # Write the config to a file
    unique_name = uuid.uuid4()
    filename = "uploads/robot_configs/{0}.json".format(unique_name)

    with open(filename, 'w') as f:
        json.dump(conf, f, sort_keys=False, indent=4, ensure_ascii = False)

    robot = Robot(request.form['robot_name'], filename, session['userID'])
    robot = db.insert_robot(robot)

    return jsonify({"success": "true"})

@app.route('/robotdesign', methods=['GET'])
def robotdesigner():
    if 'userID' not in session: return redirect('/login?ref=robotdesign')

    sounds = db.get_user_sounds(session['userID'])

    return render_template('robotdesign.html', user=db.get_user(id=session['userID']), sounds=sounds)

@app.route('/upload_config', methods=['POST'])
def review_config():
    if 'userID' not in session: return jsonify({"success": "false"})

    if 'file' in request.files:
        file = request.files['file']
        myfile = file.read()
        ret = {"success": "true", "config": json.loads(myfile)}

        # Needs to check validity of uploaded file too.

        return jsonify(ret)
    else:
        return jsonify({"success": "false"})

@app.route("/dl/<path>")
def downloadLogFile (path = None):
    filename = os.path.join(app.root_path, 'static' ,'dl', path)
    return send_file(filename, as_attachment=True)

@app.route("/uploads/sounds/<name>")
def serveSound(name = None):
    # //filename = os.path.join(app.root_path, 'uploads' ,'sounds', name)
    return send_file("uploads/sounds/{0}".format(name), as_attachment=True)


class BadRobotIDException(Exception):
    pass

class BadSoundIDException(Exception):
    pass

# Deletes files older than a week
def cleanup_old_files():
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
    

if __name__ == "__main__":
    if DATABASE == "SQLite":
        db = DB_Manager_SQLite("Database/database.db")
    else:
        db = DB_Manager

    
    scheduler = BackgroundScheduler()
    # scheduler.add_job(cleanup_old_files, 'interval', hours=24)
    scheduler.add_job(cleanup_old_files, 'interval', seconds=20)
    scheduler.start()


    app.secret_key = SECRET_KEY
    app.run(debug=True)
