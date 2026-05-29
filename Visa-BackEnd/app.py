from flask import Flask, render_template
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

template_dir = os.path.abspath(
    os.path.join(BASE_DIR, '../Visa-FrontEnd/templates')
)

static_dir = os.path.abspath(
    os.path.join(BASE_DIR, '../Visa-FrontEnd/static')
)

app = Flask(
    __name__,
    template_folder=template_dir,
    static_folder=static_dir
)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)