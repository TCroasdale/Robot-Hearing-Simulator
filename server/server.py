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

from flask import Flask, session, redirect, url_for, request, render_template, jsonify, send_file, Markup
import hashlib
import json
import os
import uuid
from datetime import datetime as dt
from datetime import timedelta
from servertasks import *
from database.db_manager import *
from database.db_manager_sqlite import DB_Manager_SQLite
from config import *
from utilities import Utilities as util
import markdown

ALLOWED_EXTENSIONS = set(['wav', 'txt'])

class WebServer:
    def __init__(self, database):
        self.db = database
        self.app = Flask(__name__)

        UPLOAD_FOLDER = "\\uploads\\sounds"
        self.app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

        self.app.secret_key = SECRET_KEY

        self.set_routes()

    def get_app(self):
        return self.app.test_client()

    def start(self):
        self.app.run(debug=False, host='0.0.0.0')

    def shutdown_server(self):
        func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')
        func()

    #Returns true if filename has an allowed extension
    def allowed_file(filename):

        return WebServer.get_file_ext(filename) in ALLOWED_EXTENSIONS

    def get_file_ext(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower()

    def set_routes(self):
        @self.app.route("/")
        def index():
            user = self.db.get_user(id=session['userID']) if 'userID' in session else None
            return render_template('index.html', user=user)

        @self.app.route('/signup', methods = ['POST', 'GET'])
        def signup():
           if request.method == 'POST':
              email = request.form['email']
              if not self.db.is_email_used(email):
                  salt = uuid.uuid4().hex
                  if len(request.form['password']) < 8:
                      return render_template('signup.html', message="short-pass")

                  if request.form['password'] == request.form['confpass']:
                      pass_hash = hashlib.sha512(str(request.form['password'] + salt).encode('utf-8')).hexdigest()
                      user = User(email, pass_hash, salt)
                      user = self.db.insert_user(user)
                      session['userID'] = user.id
                      return redirect('/')
                  else:
                      return render_template('signup.html', message="no-match-pass")
              else:
                return render_template('signup.html', message="used-email")
           else:
              return render_template('signup.html', message="")

        @self.app.route('/login', methods = ['POST', 'GET'])
        def login():
            if request.method == 'POST':
                email = request.form['email']
                if self.db.is_email_used(email):
                    user = self.db.get_user(email=email)
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
                        # user = self.db.get_user(id=session['userID']) if 'userID' in session else None
                        return render_template('login.html', message="wrong-pass")
                else:
                    # user = self.db.get_user(id=session['userID']) if 'userID' in session else None
                    return render_template('login.html', message="no-match-email")
            else: # GET
                if 'ref' in request.args:
                    session['ref_url'] = request.args.get('ref')


                # user = self.db.get_user(id=session['userID']) if 'userID' in session else None
                return render_template('login.html', message="")


        @self.app.route('/logout', methods=['GET'])
        def logout():
            session.pop('userID', None)
            return redirect('/')


        @self.app.route('/dashboard', methods=['GET'])
        def dashboard():
            if 'userID' not in session: return redirect('/login?ref=dashboard')

            simulations = self.db.get_user_sims(session['userID'])
            sounds = self.db.get_user_sounds(session['userID'])
            robots = self.db.get_user_robots(session['userID'])
            microphones = self.db.get_user_mics(session['userID'])

            user_added_items = self.db.get_all('SELECT * FROM user_added_items WHERE userID = ?', [session['userID']], type=UserAddedItem)

            added_items = [self.db.get_one('SELECT * FROM public_items WHERE id = ?', [x.itemID], type=PublicItem) for x in user_added_items]
            add_count = {x.id: len(self.db.get_all('SELECT * FROM user_added_items WHERE itemID = ?', [x.id], type=UserAddedItem)) for x in added_items}

            return render_template('dashboard.html', user=self.db.get_user(id=session['userID']), \
                                    simulations=simulations, sounds=sounds, robots=robots, microphones=microphones, addedItems=added_items, addCount=add_count)

        @self.app.route('/simulator', methods=['GET'])
        def simulator():
            if 'userID' not in session: return redirect('/login?ref=simulator')

            simconf = ""
            if 'sim' in request.args:
                sim = self.db.get_simulation(request.args['sim'])

                if sim.userID == session['userID']:
                    simconf = open(sim.pathToConfig).read()

            sounds = self.db.get_user_sounds(session['userID'])
            robots = self.db.get_user_robots(session['userID'])

            return render_template('simulator.html', user=self.db.get_user(id=session['userID']), sounds=sounds, robots=robots, simconf=simconf)

        @self.app.route("/removesimulation", methods=['POST'])
        def remove_sim():
            if 'userID' not in session: return jsonify({'success': 'false'})
            sim = self.db.get_simulation(request.form['sim_id'])
            try:
                os.remove(sim.pathToConfig)
                os.remove(sim.pathToZip)
            except:
                print("Cannot delete simulation files!")

            self.db.delete_simulation(request.form['sim_id'])

            return jsonify({'success': 'true'})

        @self.app.route("/removesound", methods=['POST'])
        def remove_sound():
            if 'userID' not in session: return jsonify({'success': 'false'})
            sound = self.db.get_sound(request.form['sound_id'])
            try:
                os.remove(sound.pathToFile)
            except:
                print("Cannot delete sound file!")

            self.db.delete_sound(request.form['sound_id'])

            return jsonify({'success': 'true'})

        @self.app.route("/removerobot", methods=['POST'])
        def remove_robot():
            if 'userID' not in session: return jsonify({'success': 'false'})
            robot = self.db.get_robot(request.form['robot_id'])
            try:
                os.remove(robot.pathToConfig)
            except:
                print("Cannot delete robot file!")

            self.db.delete_robot(request.form['robot_id'])

            return jsonify({'success': 'true'})

        @self.app.route("/removemic", methods=['POST'])
        def remove_mic():
            if 'userID' not in session: return jsonify({'success': 'false'})
            mic = self.db.get_microphone(request.form['mic_id'])
            try:
                os.remove(mic.pathToConfig)
            except:
                print("Cannot delete microphone file!")

            self.db.delete_microphone(request.form['mic_id'])

            return jsonify({'success': 'true'})


        @self.app.route('/revoke_simulation', methods=['POST'])
        def revoke_simulation():
            if 'userID' not in session: return jsonify({"success": "false"})

            simid = request.form['sim_id']
            sim = self.db.get_simulation(simid)
            endTask(sim.taskID)

            self.db.run_query("UPDATE simulations SET state = ? WHERE id = ?" , ("cancelled", simid))

            return jsonify({"success": "true"})


        @self.app.route('/simulator/run_simulation', methods=['POST'])
        def run_simulation():
            if 'userID' not in session: return jsonify({"success": "false", "reason": "no user found"})

            if 'sim_id' in request.form:
                old_sim = self.db.get_simulation(request.form['sim_id'])

                sim_file = open(old_sim.pathToConfig).read()
                sim_conf = json.loads(sim_file)
            else:
                sim_conf = json.loads(request.form['config'])

            # Link variables
            sim_conf['simulation_config'] = util.link_vars(sim_conf['simulation_config'], sim_conf['variables'])

            seed = str(uuid.uuid4())
            sim_conf['simulation_config']['seed'] = seed

            if 'sim_to_update' in request.form:
                sim = self.db.get_simulation(request.form['sim_to_update'])
                if sim.userID == session['userID']:
                    filename = sim.pathToConfig

                    with open(filename, 'w') as f:
                        json.dump(sim_conf, f, sort_keys=False, indent=4, ensure_ascii = False)

                    return jsonify({"success": "true"})
                else:
                    return jsonify({"success": "false"})
            else:
                # Save the JSON config to a file
                unique_name = uuid.uuid4()
                filename = UPLOAD_DIR + "simulation_configs/{0}.json".format(unique_name)
                print("putting sim file in: {0}".format(filename))
                with open(filename, 'w') as f:
                    json.dump(sim_conf, f, sort_keys=False, indent=4, ensure_ascii = False)

                sounds = {'utterance': None, 'bgnoise': None}

                # Check for utterance ID
                if 'utterance' in request.files:
                    sounds['utterance'] = processFileUpload(request.files['utterance'], session['userID'])
                else:
                    sounds['utterance'] = self.db.get_sound(request.form['utterance_id'])

                # Checking the utterance file.
                utt = sounds['utterance']
                if utt is None or (utt.userID != session['userID'] and not self.db.item_is_public(utt.id, "SOUND")):
                    return jsonify({"success": "false", "reason": "No sound found."})

                if 'bgnoise' in request.files:
                    sounds['bgnoise'] = processFileUpload(request.files['bgnoise'], session['userID'])
                else:
                    if int(request.form['bgnoise_id']) >= 0:
                        sounds['bgnoise'] = self.db.get_sound(request.form['bgnoise_id'])

                bgn = sounds['bgnoise']
                if bgn is not None and (bgn.userID != session['userID'] and not self.db.item_is_public(bgn.id, "SOUND")):
                    return jsonify({"success": "false", "reason": "No background noise sound found."})

                sounds['utterance'] = sounds['utterance'].pathToFile
                sounds['bgnoise'] = sounds['bgnoise'].pathToFile if sounds['bgnoise'] is not None else None

                robotid = request.form['robot_id']
                robot = self.db.get_one("SELECT * FROM robots WHERE id =?", [robotid], type=Robot)

                if robot is None or (robot.userID != session['userID'] and not self.db.item_is_public(robot.id, "ROBOT")):
                    print("Robot: {0}".format(robot))
                    if robot is not None:
                        print("userID {0}, sessionID {1}".format(robot.userID, session['userID']))
                    print("public item {0}".format(self.db.item_is_public(robot.id, "ROBOT")))
                    return jsonify({"success": "false", "reason": "No robot found."})

                robot_conf = open(robot.pathToConfig).read()
                robot_conf_dict = json.loads(robot_conf)

                date = str(dt.now().date())
                sim = Simulation(filename, date, seed, session['userID'])
                sim = self.db.insert_simulation(sim)

                print("Running sim with: ", sim_cong, robot_conf_dict, sounds)

                runSimulation.delay(sim_conf, robot_conf_dict, sounds, unique_name, sim.id)

                return jsonify({"success": "true"})


        def processFileUpload(file, user_id):
            # if user does not select file, browser also submit a empty part without filename
            if file.filename == '':
                # print("no file selected in uploads!")
                return None
            if file and WebServer.allowed_file(file.filename):
                unique_name = uuid.uuid4()

                if WebServer.get_file_ext(file.filename) == 'wav':
                    savename = UPLOAD_DIR + 'sounds/{0}.wav'.format(unique_name)
                    file.save(savename)
                    sound = self.db.insert_sound(Sound(file.filename, savename, user_id))
                    return sound
                else: # Must be a txt/mic response file
                    savename = UPLOAD_DIR + 'mic_responses/{0}.txt'.format(unique_name)
                    file.save(savename)
                    mic = self.db.insert_microphone(Microphone(file.filename, savename, user_id))
                    return mic
            else:
                return None

        # Conf = the robot config_robot
        # files = the dictionary or sound and file paths
        def insertFilePaths(conf, files, mot_id_map, mic_id_map):
            motors = conf['robot_config']['motors']
            mics = conf['robot_config']['microphones']
            for motor in motors:
                if str(motor['id']) in mot_id_map:
                    snd_id = str(mot_id_map[str(motor['id'])])
                    if snd_id in files['sounds']:
                        motor['sound']['uid'] = files['sounds'][snd_id].id
                        motor['sound']['path'] = files['sounds'][snd_id].pathToFile
                    else: # else Must be a pre existing sound
                        sound_obj =  self.db.get_sound(snd_id)
                        motor['sound']['uid'] = sound_obj.id
                        motor['sound']['path'] = sound_obj.pathToFile

            for mic in mics:
                if str(mic['id']) in mic_id_map:
                    res_id = str(mic_id_map[str(mic['id'])])
                    if res_id in files['responses']:
                        mic['mic_style']['uid'] = files['responses'][res_id].id
                        mic['mic_style']['path'] = files['responses'][res_id].pathToFile
                    else: # else Must be a pre existing response
                        mic_obj = self.db.get_microphone(res_id)
                        mic['mic_style']['uid'] = mic_obj.id
                        mic['mic_style']['path'] = mic_obj.pathToFile

            return conf

        @self.app.route('/designer/save', methods=['POST'])
        def save_robot_config():
            if 'userID' not in session: return jsonify({"success": "false"})

            # Process Sounds
            files = {'sounds': {}, 'responses': {}}
            for id in request.files:
                f = request.files[id]
                file_obj = processFileUpload(f, session['userID'])
                if file_obj == None:
                    return jsonify({"success": "false", "reason": "invalid file"})
                elif isinstance(file_obj, Sound):
                    files['sounds'][str(id)] = file_obj
                else:
                    files['responses'][str(id)] = file_obj

            #Load config and mot_id to i map
            conf = json.loads(request.form['robot-config']) # robot config
            mot_id_map = json.loads(request.form['mot_id_map']) # map of motor id to motor sound file/id
            mic_id_map = json.loads(request.form['mic_id_map']) # map of mic id to mic response file/id

            # Update the config with new id values
            conf = insertFilePaths(conf, files, mot_id_map, mic_id_map)

            if 'robot_to_update' in request.form:
                robot = self.db.get_robot(request.form['robot_to_update'])
                if robot.userID == session['userID']:
                    filename = robot.pathToConfig

                    with open(filename, 'w') as f:
                        json.dump(conf, f, sort_keys=False, indent=4, ensure_ascii = False)


            else:
                # Write the config to a file
                unique_name = uuid.uuid4()
                filename = UPLOAD_DIR + 'robot_configs/{0}.json'.format(unique_name)

                with open(filename, 'w') as f:
                    json.dump(conf, f, sort_keys=False, indent=4, ensure_ascii = False)

                robot = Robot(request.form['robot_name'], filename, session['userID'])
                robot = self.db.insert_robot(robot)

            return jsonify({"success": "true"})

        @self.app.route('/robotdesign', methods=['GET'])
        def robotdesigner():
            if 'userID' not in session: return redirect('/login?ref=robotdesign')

            sounds = self.db.get_user_sounds(session['userID'])
            mics = self.db.get_user_mics(session['userID'])

            if 'robot' in request.args:
                robotID = request.args['robot']
                robot = self.db.get_robot(robotID)

                if robot.userID != session['userID']:
                    robot = None
                    robot_conf = ""
                else:
                    robot_conf = open(robot.pathToConfig).read()
            else:
                robot_conf = ""
                robot = None


            return render_template('robotdesign.html', user=self.db.get_user(id=session['userID']), sounds=sounds, mic_responses=mics, robotconfig=robot_conf, robot=robot)

        @self.app.route('/upload_config', methods=['POST'])
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

        @self.app.route("/dl/<path>")
        def downloadLogFile (path = None):
            filename = os.path.join(self.app.root_path, 'static' ,'dl', path)
            return send_file(filename, as_attachment=True)

        @self.app.route("/uploads/sounds/<name>")
        def serveSound(name = None):
            # //filename = os.path.join(self.app.root_path, 'uploads' ,'sounds', name)
            return send_file("server/uploads/sounds/{0}".format(name), as_attachment=True)


        @self.app.route("/search")
        def search():
            query = request.args['query'] if 'query' in request.args else None
            searchFor = request.args['type'] if 'type' in request.args else '%'

            relevantItems = []

            if query == None:
                relevantItems = self.db.get_all('SELECT * FROM public_items WHERE type LIKE ?', [searchFor], type=PublicItem)
            else:
                relevantItems = self.db.get_all("SELECT * FROM public_items WHERE type LIKE ? AND (name LIKE ? OR description LIKE ?)" , [searchFor, '%'+query+'%', '%'+query+'%'], type=PublicItem)

            add_count = {x.id: len(self.db.get_all('SELECT * FROM user_added_items WHERE itemID = ?', [x.id], type=UserAddedItem)) for x in relevantItems}

            return render_template('search.html', user=self.db.get_user(id=session['userID']), items=relevantItems, addCount = add_count)

        @self.app.route("/quicksearch")
        def quick_search():
            query = request.args['query'] if 'query' in request.args else None
            searchFor = request.args['type'] if 'type' in request.args else '%'

            relevantItems = []

            if query == None:
                relevantItems = self.db.get_all('SELECT * FROM public_items WHERE type LIKE ?', [searchFor], type=PublicItem)
            else:
                relevantItems = self.db.get_all("SELECT * FROM public_items WHERE type LIKE ? AND (name LIKE ? OR description LIKE ?)" , [searchFor, '%'+query+'%', '%'+query+'%'], type=PublicItem)

            processedItems = [{'id': x.id, 'name': x.name, 'desc': x.description, 'likes': x.likes, 'type': x.type, 'itemID': x.itemID} for x in relevantItems]

            return jsonify({'result': processedItems})

        @self.app.route("/publish", methods=['POST'])
        def publish():
            item = None
            if request.form['type'] == "ROBOT":
                item = self.db.get_robot(request.form['id'])
            elif request.form['type'] == "SIM":
                item = self.db.get_simulation(request.form['id'])
            elif request.form['type'] == "SOUND":
                item = self.db.get_sound(request.form['id'])
            elif request.form['type'] == "MIC":
                item = self.db.get_microphone(request.form['id'])

            if item == None or item.userID != session['userID']:
                return redirect('/dashboard')

            date = str(dt.now().date())
            publicItem = PublicItem(request.form['name'], request.form['desc'], request.form['type'], request.form['id'], session['userID'], publishDate = date)
            publicItem = self.db.insert_public_item(publicItem)

            return redirect('/search?query={0}&type={1}'.format(publicItem.name, publicItem.type))

        @self.app.route("/toggle_like", methods=["POST"])
        def toggleLike():
            if 'userID' not in session: return jsonify({"success": "false"})

            if 'item' not in request.form:
                return jsonify({"success": "false"})

            existing_like = self.db.get_one("SELECT * FROM user_liked_items WHERE itemID = ? AND userID = ?", [request.form['item'], session['userID']], type=UserLikedItem)

            if existing_like is None:
                likedItem = UserLikedItem(session['userID'], request.form['item'])
                self.db.insert_user_liked_item(likedItem)
            else:
                self.db.run_query('DELETE FROM user_liked_items WHERE id = ?', [existing_like.id])

            allLikes = self.db.get_all('SELECT * FROM user_liked_items WHERE itemID = ?', [request.form['item']], type=UserLikedItem)

            self.db.run_query('UPDATE public_items SET likes = ? WHERE id = ?', [len(allLikes), request.form['item']])
            return jsonify({"success": "true", "like_count": len(allLikes)})

        @self.app.route("/toggle_add", methods=["POST"])
        def toggle_add():
            if 'userID' not in session: return jsonify({"success": "false"})

            if 'item' not in request.form:
                return jsonify({"success": "false"})

            existing_add = self.db.get_one("SELECT * FROM user_added_items WHERE itemID = ? AND userID = ?", [request.form['item'], session['userID']], type=UserAddedItem)

            if existing_add is None:
                addedItem = UserAddedItem(session['userID'], request.form['item'])
                self.db.insert_user_added_item(addedItem)
            else:
                self.db.run_query('DELETE FROM user_added_items WHERE id = ?', [existing_add.id])

            allAdds = self.db.get_all('SELECT * FROM user_added_items WHERE itemID = ?', [request.form['item']], type=UserAddedItem)

            return jsonify({"success": "true", "add_count": len(allAdds)})

        @self.app.route('/documentation')
        def documentation():
            p = request.args['p'] if 'p' in request.args else 'introduction'

            doc = ""
            try:
                with open('server/doc_files/{0}.md'.format(p), 'r') as f:
                    doc = f.read()
            except:
                return jsonify({'success': 'false'})
            doc_html = Markup(markdown.markdown(doc, extensions=['fenced_code']))

            return jsonify({'success': 'true', 'html': doc_html})

        @self.app.route('/getrobotconfig')
        def getrobotconfig():
            if 'userID' not in session: return jsonify({"success": "false", "reason": "No user session"})

            robotID = request.args['robot'] if 'robot' in request.args else None
            print(robotID)
            if robotID is not None:
                robot = self.db.get_one("SELECT * FROM robots WHERE id =?", [robotID], type=Robot)

                if robot is not None and (robot.userID == session['userID'] or self.db.item_is_public(robot.id, "ROBOT")):
                    robot_conf = open(robot.pathToConfig).read()
                    return jsonify({"success": "true", "robot": json.loads(robot_conf)})
                else:
                    return jsonify({"success": "false", "reason": "robot not found"})
            else:
                return jsonify({"success": "false", "reason": "robotID not sent"})



class BadRobotIDException(Exception):
    pass

class BadSoundIDException(Exception):
    pass
