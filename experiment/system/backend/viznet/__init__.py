import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import DevelopmentConfig, ProductionConfig

app = Flask(__name__)
mode = os.environ.get('FLASK_ENV', 'development')

print('Loading config with mode', mode)
if mode == 'development':
    app.config.from_object(DevelopmentConfig)
elif mode == 'production':
    app.config.from_object(ProductionConfig)

CORS(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

from viznet import routes, models
from viznet.manager import *