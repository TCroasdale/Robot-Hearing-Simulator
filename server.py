from flask import Flask, redirect, url_for, request, render_template, jsonify, send_file
import json
import os
import sqlite3 as sql# Temporary
import uuid
from servertasks import *
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

    # Save the JSON config to a file
    unique_name = uuid.uuid4()
    filename = "uploads/simulation_configs/{0}.json".format(unique_name)
    print("putting sim file in: {0}".format(filename))
    rowid = 0
    with open(filename, 'w') as f:
        f.write(request.form['config'])
    with sql.connect("Database/database.db") as con:
        cur = con.cursor()
            
        cur.execute("INSERT INTO simulations (pathToConfig, dateCreated, state, seed, userID, visibility) \
            VALUES (?,?,?,?,?,?)",(filename,'1-1-2018','scheduled','5', 0, 0))
        rowid = cur.lastrowid
        con.commit()

    runSimulation.delay(strdict, unique_name, rowid)

    return jsonify({"success": "true"})


@app.route('/upload_config', methods=['POST'])
def review_config():
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



if __name__ == "__main__":
    app.run(debug=True)
