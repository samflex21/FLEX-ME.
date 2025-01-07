from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from db import verify_user, create_user
import os

app = Flask(__name__, static_folder='static', static_url_path='/static', template_folder='templates')
app.secret_key = os.urandom(24)  # for session management

# Add this route for direct CSS testing
@app.route('/test-css')
def test_css():
    return send_from_directory('static/css', 'login.css')

# Main routes
@app.route('/')
def home():
    return render_template('Register.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        success, message = create_user(
            data['email'],
            data['password'],
            data['firstName'],
            data['lastName']
        )
        return jsonify({"success": success, "message": message})
    return render_template('Register.html')


@app.route('/login')
def loginMain():
    return render_template('login.html')


@app.route('/login-post', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        user = verify_user(data['email'], data['password'])
        if user:
            session['user'] = {
                'email': user['email'],
                'first_name': user['first_name'],
                'trust_level': user['trust_level']
            }
            return jsonify({"success": True, "redirect": url_for('dashboard')})
        return jsonify({"success": False, "message": "Invalid credentials"})
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

# Protected route example
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('Dashboard.html', user=session['user'])

@app.route('/about')
def about():
    return render_template('About.html')

@app.route('/contact')
def contact():
    return render_template('Contact.html')

@app.route('/homepage')
def homepage():
    return render_template('home page.html')

if __name__ == '__main__':
    app.run(debug=True) 