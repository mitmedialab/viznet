import datetime 

import json
import random
from flask import jsonify, request, send_from_directory
from sqlalchemy.sql.expression import func

from pprint import pprint

from viznet import app, db
from viznet.models import Question, Response, Event, User

def row_to_dict(r, custom_fields=[]):
    d = { c.name: getattr(r, c.name) for c in r.__table__.columns }
    if custom_fields:
        for custom_field in custom_fields:
            d[custom_field] = getattr(r, custom_field)
    return d


@app.route('/data/<path:path>')
def send_file(path):
    return send_from_directory('../../../data', path)

task_to_task_name = {
    0: 'read_value',
    1: 'compare_values',
    2: 'find_maximum',
    3: 'compare_averages',
    4: 'detect_outliers'
}

specs = [{"description": {"id": 0}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"x": {"field": "Q1", "type": "quantitative"}, "y": {"field": "Q2", "type": "quantitative"}, "color": {"field": "name", "type": "nominal"}}}, {"description": {"id": 1}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"x": {"field": "Q1", "type": "quantitative"}, "y": {"field": "Q2", "type": "quantitative"}, "row": {"field": "name", "type": "nominal"}}}, {"description": {"id": 2}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"x": {"field": "Q1", "type": "quantitative"}, "color": {"field": "Q2", "type": "quantitative"}, "y": {"field": "name", "type": "nominal"}}}, {"description": {"id": 3}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"x": {"field": "Q1", "type": "quantitative"}, "size": {"field": "Q2", "type": "quantitative", "scale": {"range": [1, 400]}}, "y": {"field": "name", "type": "nominal"}}}, {"description": {"id": 4}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"color": {"field": "Q1", "type": "quantitative"}, "x": {"field": "Q2", "type": "quantitative"}, "y": {"field": "name", "type": "nominal"}}}, {"description": {"id": 5}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"size": {"field": "Q1", "type": "quantitative", "scale": {"range": [1, 400]}}, "x": {"field": "Q2", "type": "quantitative"}, "y": {"field": "name", "type": "nominal"}}}, {"description": {"id": 6}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"y": {"field": "Q1", "type": "quantitative"}, "x": {"field": "Q2", "type": "quantitative"}, "color": {"field": "name", "type": "nominal"}}}, {"description": {"id": 7}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"y": {"field": "Q1", "type": "quantitative"}, "x": {"field": "Q2", "type": "quantitative"}, "row": {"field": "name", "type": "nominal"}}}, {"description": {"id": 8}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"y": {"field": "Q1", "type": "quantitative"}, "color": {"field": "Q2", "type": "quantitative"}, "x": {"field": "name", "type": "nominal"}}}, {"description": {"id": 9}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"y": {"field": "Q1", "type": "quantitative"}, "size": {"field": "Q2", "type": "quantitative", "scale": {"range": [1, 400]}}, "x": {"field": "name", "type": "nominal"}}}, {"description": {"id": 10}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"color": {"field": "Q1", "type": "quantitative"}, "y": {"field": "Q2", "type": "quantitative"}, "x": {"field": "name", "type": "nominal"}}}, {"description": {"id": 11}, "$schema": "https://vega.github.io/schema/vega-lite/v2.json", "mark": "point", "encoding": {"size": {"field": "Q1", "type": "quantitative", "scale": {"range": [1, 400]}}, "y": {"field": "Q2", "type": "quantitative"}, "x": {"field": "name", "type": "nominal"}}}]

def turn_into_honey_pot(q):
    spec = specs[q['spec_id']]

    q1_encoding = [ enc for (enc, field) in spec["encoding"].items() if field["field"] == "Q1" ][0]
    
    if q1_encoding in ['x', 'y']:
        new_question = {
            "text": "What information is presented along the <i>{}-axis</i>?".format(q1_encoding)
        }

    if q1_encoding in ['color', 'size', 'row']:
        new_question = {
            "text": "What information is presented by the <i>{}</i> property?".format(q1_encoding)
        }  

    correctOption = random.choice([0, 1])
    options = [ q['q1'], q['q2']]
    if correctOption == 1:
        options = [ q['q2'], q['q1']]

    q['correct'] = correctOption
    q['question'] = new_question
    q['options'] = options
    q['honeypot'] = True
    return q

@app.route('/api/flag_question', methods=['GET'])
def flag_question():
    question_id = request.args.get('question_id', 0)
    print('Flagging question ID', question_id)

    question = Question.query.get_or_404(question_id)
    setattr(question, 'flagged', True)
    db.session.add(question)
    db.session.commit()

    return jsonify({ 'question_id': question_id, 'flagged': True })

@app.route('/api/question', methods=['GET'])
def get_question():
    task_id = request.args.get('taskId', 0)
    spec_id = request.args.get('specId', 0)
    previous_question_ids = json.loads(request.args.get('previous', '[]'))
    if not previous_question_ids:
        previous_question_ids = []
    hp = request.args.get('hp', False)
    task_name = task_to_task_name[int(task_id)]

    random_question = Question.query.filter((~Question.id.in_(previous_question_ids)),
        (Question.task==task_name),
        (Question.spec_id==spec_id),
        (Question.flagged.is_(False))).order_by(func.random()).first()


    if hp and random_question:
        return jsonify(turn_into_honey_pot(row_to_dict(random_question)))

    if random_question:
        return jsonify(row_to_dict(random_question))

    else:
        return jsonify({ 'status': 'Error', }), 400


@app.route('/api/response', methods=['POST'])
def post_response():
    j = request.get_json()
    j['ip'] = request.environ.get('HTTP_X_REAL_IP', request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr))
    j['start_time'] = datetime.datetime.fromtimestamp(j['start_time'] / 1000)
    j['submit_time'] = datetime.datetime.fromtimestamp(j['submit_time'] / 1000)

    r = Response(**j)
    db.session.add(r)
    db.session.commit()
    db.session.refresh(r)

    return jsonify({
        'status': 'success',
        'response_id': r.id
    })

@app.route('/api/event', methods=['POST'])
def post_event():
    j = request.get_json()

    j['ip'] = request.environ.get('HTTP_X_REAL_IP', request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr))
    j['event_time'] = datetime.datetime.fromtimestamp(j['event_time'] / 1000)

    r = Event(**j)
    db.session.add(r)
    db.session.commit()
    db.session.refresh(r)
    
    return jsonify({
        'status': 'success',
        'response_id': r.id
    })

@app.route('/api/start_user', methods=['POST'])
def inititialize_user():
    j = request.get_json()

    j['ip'] = request.environ.get('HTTP_X_REAL_IP', request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr))
    u = User(**j)
    db.session.add(u)
    db.session.commit()
    db.session.refresh(u)
    
    return jsonify({
        'status': 'success',
        'response_id': u.id
    })

@app.route('/api/end_user', methods=['POST'])
def post_user_demographics():
    j = request.get_json()

    j['ip'] = request.environ.get('HTTP_X_REAL_IP', request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr))
    try:
        u = User.query.filter_by(user_id=j['user_id']).one()
        for k, v in j.items():
            setattr(u, k, v)

        db.session.add(u)
        db.session.commit()
        db.session.refresh(u)
        return jsonify({
            'status': 'success',
            'response_id': u.id
        })        
    except:
        u = User(**j)
        db.session.add(u)
        db.session.commit()
        db.session.refresh(u)
    
        return jsonify({
            'status': 'success',
            'response_id': u.id
        })
