import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 8888
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'very_secret_key'
    DATABASE_URI = 'admin:password@localhost/viznet'
    SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://%s?client_encoding=utf8' % DATABASE_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    SITE_URL = 'OMITTED'
    DATABASE_URI = 'admin:7sQ6fhOEQT4f@localhost/viznet'
    SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://%s?client_encoding=utf8' % DATABASE_URI    
