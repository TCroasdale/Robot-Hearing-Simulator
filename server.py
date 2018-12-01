from flask import Flask, redirect, url_for, request, render_template
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
        return render_template('simulator', user=None)

if __name__ == "__main__":
    app.run()