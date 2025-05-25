from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv
from datetime import datetime


# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Initialize login manager
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    messages = db.relationship('Message', backref='author', lazy=True)

    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

# Message model for contact form submissions
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    def __repr__(self):
        return f"Message('{self.subject}', '{self.date_posted}')"

# Project model for portfolio section
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(200), nullable=True)
    project_url = db.Column(db.String(200), nullable=True)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"Project('{self.title}', '{self.date_posted}')"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    projects = Project.query.order_by(Project.date_posted.desc()).limit(3).all()
    return render_template('index.html', projects=projects, active_page='home')

@app.route('/about')
def about():
    return render_template('about.html', active_page='about')

@app.route('/projects')
def projects():
    projects = Project.query.order_by(Project.date_posted.desc()).all()
    return render_template('projects.html', projects=projects, active_page='projects')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message_text = request.form.get('message')
        
        # Validate input
        if not name or not email or not subject or not message_text:
            flash('Please fill out all fields', 'danger')
            return redirect(url_for('contact'))
        
        # Create and save message
        message = Message(
            name=name, 
            email=email, 
            subject=subject, 
            message=message_text,
            user_id=current_user.id if current_user.is_authenticated else None
        )
        db.session.add(message)
        db.session.commit()
        
        flash('Your message has been sent!', 'success')
        return redirect(url_for('contact'))
    
    return render_template('contact.html', active_page='contact')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Login unsuccessful. Please check email and password', 'danger')
    
    return render_template('login.html', active_page='login')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Check if email already exists
        user_email = User.query.filter_by(email=email).first()
        user_username = User.query.filter_by(username=username).first()
        
        if user_email:
            flash('Email already exists', 'danger')
            return redirect(url_for('register'))
        
        if user_username:
            flash('Username already exists', 'danger')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('register'))
        
        # Create new user
        hashed_password = generate_password_hash(password)
        user = User(username=username, email=email, password=hashed_password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Your account has been created! You can now log in', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', active_page='register')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('index'))
    
    messages = Message.query.order_by(Message.date_posted.desc()).all()
    projects = Project.query.order_by(Project.date_posted.desc()).all()
    users = User.query.all()
    
    return render_template('admin.html', messages=messages, projects=projects, users=users, active_page='admin')

@app.route('/admin/add_project', methods=['GET', 'POST'])
@login_required
def add_project():
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        image_url = request.form.get('image_url')
        project_url = request.form.get('project_url')
        
        project = Project(
            title=title,
            description=description,
            image_url=image_url,
            project_url=project_url
        )
        
        db.session.add(project)
        db.session.commit()
        
        flash('Project added successfully!', 'success')
        return redirect(url_for('admin'))
    
    return render_template('add_project.html', active_page='admin')

@app.route('/api/messages', methods=['GET'])
@login_required
def api_messages():
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    messages = Message.query.order_by(Message.date_posted.desc()).all()
    
    message_list = []
    for message in messages:
        message_list.append({
            'id': message.id,
            'name': message.name,
            'email': message.email,
            'subject': message.subject,
            'message': message.message,
            'date_posted': message.date_posted.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify(message_list)

# Initialize the database
with app.app_context():
    db.create_all()
    
    # Create admin user if none exists
    admin = User.query.filter_by(is_admin=True).first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password=generate_password_hash('admin123'),
            is_admin=True
        )
        db.session.add(admin)
        
        # Add some sample projects
        projects = [
            Project(
                title='E-commerce Website',
                description='A fully functional e-commerce website with payment integration.',
                image_url='https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg',
                project_url='#'
            ),
            Project(
                title='Portfolio Website',
                description='A personal portfolio website to showcase projects and skills.',
                image_url='https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg',
                project_url='#'
            ),
            Project(
                title='Task Management App',
                description='A task management application to help organize daily tasks.',
                image_url='https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
                project_url='#'
            )
        ]
        
        for project in projects:
            db.session.add(project)
        
        db.session.commit()

@app.context_processor
def inject_now():
    return {'now': datetime.now()}


if __name__ == '__main__':
    app.run(debug=True)