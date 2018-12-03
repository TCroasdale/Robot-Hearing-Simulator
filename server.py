from flask import Flask, redirect, url_for, request, render_template, jsonify, send_file
import json
import os
from robothearingsim import RobotHearingSim as sim
from utilities import Utilities as util
app = Flask(__name__)


@app.route("/")
def index():
    return render_template('index.html', user=None)

@app.route('/signup', methods = ['POST', 'GET'])
def signup():
   if request.method == 'POST':
      user = request.form['nm']
      return redirect(url_for('index', name = user))
   else:
      return render_template('signup.html', user=None)

@app.route('/simulator', methods=['POST', 'GET'])
def simulator():
    if request.method == 'GET':
        return render_template('simulator.html', user=None)
    else:
        return render_template('simulator.html', user=None)

@app.route('/simulator/run_simulation', methods=['POST'])
def run_simulation():
    strdict = json.loads(request.form['config'])
    config = util.objectifyJson(strdict)
    downloadPath = sim.run_from_json_config(config)

    return jsonify({"success": "true", "file": downloadPath})


@app.route('/upload_config', methods=['POST'])
def review_config():
    if 'file' in request.files:
        file = request.files['file']
        myfile = file.read()
        ret = {"success": "true", "config": json.loads(myfile)}

        # Needs to check validity of uploaded file too.

        return jsonify(ret)
    else:
        return "{\"success\": \"false\"}"

@app.route("/dl/<path>")
def DownloadLogFile (path = None):
    filename = os.path.join(app.root_path, 'static' ,'dl', path)
    return send_file(filename, as_attachment=True)
if __name__ == "__main__":
    app.run(debug=True)
