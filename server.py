from flask import Flask, render_template
import os

template_dir = os.path.abspath('web/templates')
app = Flask(__name__, template_folder=template_dir)




@app.route("/")
def hello():
    return render_template('index.html', title='Home')

if __name__ == "__main__":
    app.run()
