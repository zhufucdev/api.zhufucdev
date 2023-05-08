import os
from flask import Flask, jsonify
from pymongo import MongoClient

app = Flask(__name__)

DB_URI = os.environ["MONGODB_URI"]

if not DB_URI:
    raise RuntimeError("environment variables not adequate")

client = MongoClient(DB_URI)
db = client['api']  # API schema
origins = db['origins']  # download links collection
releases = db['releases']


def as_release(element):
    product = element['product']
    origin = {}
    for ele in origins.find({'product': product}):
        origin[ele['name']] = ele['url']

    return {
        'product': product,
        'version': element['version'],
        'origin': origin
    }


@app.route('/release', defaults={'product': None})
@app.route('/release/<product>')
def release(product: str):
    if product:
        collection = releases.find({'product': product})
    else:
        collection = releases.find()

    return jsonify([as_release(ele) for ele in collection])
