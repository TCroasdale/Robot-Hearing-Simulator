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
import sqlite3 as sql# Temporary
import uuid
from datetime import datetime as dt
from servertasks import *
from db_manager import *
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
          pass_hash = hashlib.sha512(str(request.form['password'] + salt).encode('utf-8')).hexdigest()
          user = User(email, pass_hash, salt)
          user = db.insert_user(user)
          session['userID'] = user.id
          return redirect('/')
      else:
        return render_template('signup.html')
   else:
      return render_template('signup.html')

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
                user = db.get_user(id=session['userID']) if 'userID' in session else None
                return render_template('login.html')
        else:
            user = db.get_user(id=session['userID']) if 'userID' in session else None
            return render_template('login.html', user=user)
    else: # GET
        if 'ref' in request.args:
            session['ref_url'] = request.args.get('ref')


        user = db.get_user(id=session['userID']) if 'userID' in session else None
        return render_template('login.html', user=user)


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
        print("Cannot delete simulation file, it's not here!")

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

@app.route('/simulator/uploadsounds', methods=['POST'])
def processSoundUploads():
    if 'userID' not in session: return redirect('/login?ref=simulator')

    # check if the post request has the file part
    if 'utterancefile' not in request.files:
        # print("no file in uploads!")
        return jsonify({'success': 'false'})
    file = request.files['utterancefile']
    # if user does not select file, browser also submit a empty part without filename
    if file.filename == '':
        # print("no file selected in uploads!")
        return jsonify({'success': 'false'})
    if file and allowed_file(file.filename):
        unique_name = uuid.uuid4()
        file.save('uploads/sounds/{0}.wav'.format(unique_name))

        utt_sound = db.insert_sound(Sound(file.filename, 'uploads/sounds/{0}.wav'.format(unique_name), session['userID']))

        return jsonify({'success': 'true', 'sound_ids': {'utterance_id': utt_sound.id}})
    return jsonify({'success': 'false'})

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
    if utterance is not None or sound.userID == session['userID'] or sound.visibility > 0:
        dict['simulation_config']['source_config']['input_utterance']['path'] = utterance.pathToFile
    else:
        raise BadSoundIDException

    # Attach the robot config path
    robotid = dict['simulation_config']['robot_config']['uid']
    robot = db.get_one("SELECT * FROM robots WHERE id =?", [robotid], type=Robot)
    if robot is not None or robot.userID == session['userID'] or robot.visibility > 0:
        dict['simulation_config']['robot_config']['path'] = robot.pathToConfig
    else:
        raise BadRobotIDException

    return (dict, robot.pathToConfig)

@app.route('/simulator/run_simulation', methods=['POST'])
def run_simulation():
    if 'userID' not in session: return jsonify({"success": "false"})

    strdict = json.loads(request.form['config'])

    # Save the JSON config to a file
    unique_name = uuid.uuid4()
    filename = "uploads/simulation_configs/{0}.json".format(unique_name)
    # print("putting sim file in: {0}".format(filename))
    with open(filename, 'w') as f:
        f.write(request.form['config'])


    # Fix the file paths

    try:
        (strdict, robotPath) = insert_config_paths(strdict)
    except BadSoundIDException:
        return jsonify({"success": "false", "reason": "bad sound id"})
    except BadRobotIDException:
        return jsonify({"success": "false", "reason": "bad robot id"})

    date = str(dt.now().date())
    sim = Simulation(filename, date, str(uuid.uuid4()), session['userID'])
    sim = db.insert_simulation(sim)


    robot_conf = open(robotPath).read()
    robot_conf_dict = json.loads(robot_conf)


    runSimulation.delay(strdict, robot_conf_dict, unique_name, sim.id)

    return jsonify({"success": "true"})


@app.route('/designer/save', methods=['POST'])
def save_robot_config():
    if 'userID' not in session: return jsonify({"success": "false"})

    unique_name = uuid.uuid4()
    filename = "uploads/robot_configs/{0}.json".format(unique_name)

    with open(filename, 'w') as f:
        f.write(request.form['config'])

    robot = Robot(request.form['robot_name'], filename, session['userID'])
    robot = db.insert_robot(robot)

    return jsonify({"success": "true"})

@app.route('/robotdesign', methods=['GET'])
def robotdesigner():
    if 'userID' not in session: return redirect('/login?ref=robotdesigner')

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

if __name__ == "__main__":
    db = DB_Manager("Database/database.db")
    app.secret_key = SECRET_KEY
    app.run(debug=True)
