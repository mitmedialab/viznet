from datetime import datetime
from viznet import db
from sqlalchemy.dialects.postgresql.json import JSONB

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String)
    event = db.Column(db.String)
    event_time = db.Column(db.DateTime, index=True, default=datetime.utcnow)    
    ip = db.Column(db.String)

    def __repr__(self):
        return '<Event {}>'.format(self.id)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String)
    referrer = db.Column(db.String)
    mturk = db.Column(db.Boolean)
    gender = db.Column(db.String)
    education = db.Column(db.String)
    age = db.Column(db.String)
    vision_deficiency = db.Column(db.String)
    data_frequency = db.Column(db.String)
    freeform_text = db.Column(db.String)
    ip = db.Column(db.String)

    def __repr__(self):
        return '<Event {}>'.format(self.id)


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    responses = db.relationship('Response', backref='question', lazy='dynamic')
    q_field = db.Column(db.String)
    c = db.Column(db.String)    
    q1 = db.Column(db.String)
    q2 = db.Column(db.String)
    task = db.Column(db.String, index=True)
    corpus = db.Column(db.String)
    question = db.Column(JSONB)
    options = db.Column(JSONB)
    cardinality = db.Column(db.Integer)
    correct = db.Column(db.Integer)
    annotated = db.Column(JSONB)
    name = db.Column(db.String)
    spec_id = db.Column(db.Integer, index=True)
    dataset_id = db.Column(db.String)
    original_dataset_id = db.Column(db.String)    
    flagged = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return '<Question {}>'.format(self.id)

class Response(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    response_time = db.Column(db.Integer)
    submit_time = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'))
    user_id = db.Column(db.String)
    honeypot = db.Column(db.Boolean)
    response = db.Column(db.Integer)
    stimuli_turn = db.Column(db.Integer)
    count_for_current_spec = db.Column(db.Integer)
    correct = db.Column(db.Boolean)
    user_info = db.Column(JSONB)
    display = db.Column(JSONB)
    session = db.Column(JSONB)
    ip = db.Column(db.String)

    def __repr__(self):
        return '<Response {}>'.format(self.id)
