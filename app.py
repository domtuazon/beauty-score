from flask import Flask, render_template, json, request
import base64
import datetime

app = Flask(__name__, static_url_path='/static')


@app.route("/")
def index():
    return render_template('index.html')

@app.route("/save-image", methods=["POST"])
def save_image():

    imageData = request.get_data()
    fileName = datetime.datetime.now().strftime("%Y%m%d%H%M%S")

    with open("faces/{0}.jpeg".format(fileName), "wb") as fh:
        fh.write(base64.decodebytes(imageData))

    return "ok"

if __name__ == "__main__":
    app.debug = True
    app.run()
    app.run(debug = True)
