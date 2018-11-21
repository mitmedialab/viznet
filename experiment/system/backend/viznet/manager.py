'''
Populate and clean database

Run from viznet/experiment as 'flask command_name [args]'

Not used for initialization or migration (use flask db init/migrate/upgrade)
'''
import os
from os.path import join
import json
import shutil

import click
from flask.cli import with_appcontext

from viznet import app, db
from viznet.models import Question, Response, User, Event

@app.cli.command()
def create():
    print("Creating tables")
    db.session.commit()
    db.create_all()
    db.session.commit()

@app.cli.command()
def recreate():
    db.session.commit()
    db.create_all()
    db.session.commit()
    db.reflect()
    db.drop_all()    

@app.cli.command()
def drop_all():
    print("Dropping all tables")
    try:
        shutil.rmtree('migrations')
    except OSError as e:
        pass
    db.session.commit()
    db.reflect()
    db.drop_all()   

@app.cli.command()
def populate_questions():
    print('Deleting existing questions')
    num_questions_deleted = Question.query.delete()
    print('Deleted {} questions'.format(num_questions_deleted))

    print('Populating questions')
    experiment_data_directory = '../../'
    questions_file = open(join(experiment_data_directory, 'questions.json'), 'r')

    all_questions = json.load(questions_file)
    num_questions = 0
    for task_type, task_questions in all_questions.items():
        print(task_type)
        print(len(task_questions))
        num_questions += len(task_questions)
        for q in task_questions:
            q['task'] = task_type
            try:
                question_to_add = Question(**q)
                db.session.add(question_to_add)
            except Exception as e:
                print('Cannnot insert', q)
                print('Exception', e)
                continue
    db.session.commit()
    print('Populated {} questions'.format(num_questions))