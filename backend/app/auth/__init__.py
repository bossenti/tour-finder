import re
from flask import Blueprint, request, jsonify, make_response, current_app
from sqlalchemy import exc
from itsdangerous import TimedJSONWebSignatureSerializer
from ..entities.user import User, UserInsertSchema
from ..entities.entity import Session
from ..email import send_email

auth = Blueprint('auth', __name__)


@auth.route('/check_login', methods=['GET', 'POST'])
def check_login():

    data = request.get_json()
    session = Session()
    if data.get("username"):
        user = session.query(User).filter_by(username=data["username"]).first()
    elif data.get("email"):
        user = session.query(User).filter_by(email=data["email"]).first()
        session.close()
    else:
        return make_response(jsonify('No username/email provided', 422))
    if user is not None and user.password_hash == data["password_hash"]:
        return make_response(jsonify(True, 201))
    else:
        return make_response(jsonify(False, 201))


@auth.route('/create_user', methods=['GET', 'POST'])
def create_user():

    data = request.get_json()

    session = Session()
    user_schema = UserInsertSchema()
    user = User(**user_schema.load(data))
    try:
        res = user_schema.dump(user.create(session))
    except exc.IntegrityError as ie:
        session.rollback()
        error_detail = ie.orig.args[0]
        affected_attr = str(re.search(r'DETAIL:  Schlüssel »\([a-zA-Z]+\)', error_detail))
        if "username" in affected_attr:
            msg = {"existing": "username"}
            return make_response(jsonify(msg, 422))
        if "email" in affected_attr:
            msg = {"existing": "email"}
            return make_response(jsonify(msg, 422))
    finally:
        session.close()

    confirmation_token = user.generate_confirmation_token()
    send_email(user.email, 'Confirm Your Account', 'auth/email/confirm', user=user, token=confirmation_token)

    return make_response(jsonify(res, 201))


@auth.route('/confirm/<token>')
def confirm(token):
    s = TimedJSONWebSignatureSerializer(current_app.config['SECRET_KEY'])

    try:
        data = s.loads(token.encode('utf-8'))
    except:
        return make_response(jsonify({'error': 'token expired or link invalid'}, 422))

    session = Session()
    user_id = data.get("confirm")
    user = session.query(User).filter_by(id == user_id).first()

    if user is None:
        return make_response(jsonify({'error': 'token expired or link invalid'}, 422))
    else:
        user.confirm(session)
        return make_response(jsonify(user, 201))