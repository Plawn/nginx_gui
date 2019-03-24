import os
import json
from flask import Flask, flash, request, redirect, url_for, jsonify, make_response, send_from_directory
import uuid
import nginx_api as ng


app = Flask(__name__)

warn = ng.warn
success = ng.success

# Settings

sess_id = 'jeb'
PORT = 5678
# username -> password
users = {
    "admin": "pas"
}

# /Settings

db = ng.open_db('Nginx_db')
success("DB loaded")
# to store the available funcs
api_funcs = {}
# to store the sessions
idied = {}


# decorators

def wrap_decorator(deco):
    def f(func):
        fu = deco(func)
        fu.__name__ = func.__name__
        return fu
    return f


def make_error(error: str):
    """Creates an error response
    """
    return jsonify({"error": error})


def TODO(func):
    """Tags a function
    """
    warn('function "{}" is not done'.format(func.__name__))
    return func


def is_connected(request):
    idx = request.cookies.get(sess_id)
    if idx != None:
        if idx in idied:
            return True
    return False


def check_form(*keys):
    """Checks if the form contaisn all the required keys
    """
    def real_decorator(func):
        def wrapped(*args, **kwargs):
            for key in keys:
                if key not in request.form:
                    return make_error('invalid request')
            return func(*args, **kwargs)
        wrapped.__name__ = func.__name__
        return wrapped
    return real_decorator


def make_id():
    return str(uuid.uuid4())


@app.route('/login', methods=['POST'])
@check_form('login', 'password')
def login():
    login = request.form['login']
    password = request.form['password']
    if login in users:
        if users[login] == password:
            ide = make_id()
            idied[ide] = login
            resp = make_response(make_error(False))
            resp.set_cookie(sess_id, ide)
            return resp
        return make_error('wrong password')
    return make_error('unknown username')


@wrap_decorator
def logged(func):
    return lambda *args: func(*args) if is_connected(request) else make_error('not logged')


def post_api(func):
    api_funcs[func.__name__] = func
    return func


@app.route('/api', methods=['POST'])
@logged
@check_form('type')
def api_route():
    return api_funcs[request.form['type']](request) if request.form['type'] in api_funcs else make_error('"type" not found')


@post_api
def build_nginx(request):
    error = False
    try:
        db.build()
    except:
        error = True
    return make_error(error)


def multi_get(d: dict, *keys): return [d.get(key) for key in keys]


@post_api
@check_form('domain', 'name', 'in_url', 'ext_url')
def update_app(request):
    """updates the app form a given domain
    """
    # domain_name, name, upstream_name, in_url, ext_url, _type = f['domain'], f['name'], f.get('upstream_name'), f['in_url'], f['ext_url'], f['type']
    domain_name, name, upstream_name, in_url, ext_url, _type = multi_get(
        request.form, 'domain', 'name', 'upstream_name', 'in_url', 'ext_url', 'type')
    if domain_name in db.domains:
        try:
            app = db.domains[domain_name].apps[name]
            # upstream upstream
            if upstream_name != None and upstream_name != '':
                if upstream_name not in db.upstreams:
                    return make_error('upstream not found')
                else:
                    app.upstream = db.upstreams[upstream_name]
            # bad looking
            app.ext_route = ext_url
            app.in_route = in_url

            if app.name != name:
                app.change_name(name)

            return make_error(False)
        except:
            return make_error('invalid request')
    return make_error('name not found')


@TODO
@post_api
@check_form('name', 'path', 'port')
def add_upstream(request):
    name, path, port = request.form['name'], request.form['path'], request.form['port']
    if path not in db.upstreams:
        new_upstream = ng.Upstream(name, path, port)
        try:
            db.add_upstream(new_upstream)
        except:
            return make_error("upstream could't be added")
        return jsonify({'error': False})
    return make_error('invalid request')


@TODO
@post_api
def get_domains(request):
    return jsonify(list(db.domains))


@post_api
@check_form('domain_name', 'app_name')
def get_subapp_from_domain(request):
    try:
        d = {**db.domains[request.form['domain_name']
                          ].apps[request.form['app_name']].__dict__}
        d['domain'] = d['domain'].server_name
        if d['upstream'] != None :
            d['upstream'] = d['upstream'].path
        return jsonify(d)
    except Exception as e:
        print(e)
        return make_error('domain or app not found, only found {}'.format(db.domains[request.form['domain_name']
                          ].apps))


@post_api
@check_form('domain_name')
def get_apps_from_domain(request):
    try:
        return jsonify(list(db.domains[request.form['domain_name']].apps))
    except:
        return make_error('domain name not found')


# sub_apps should be a list a apps
@post_api
@check_form('app_name', 'sub_apps')
def add_app(request):
    name = request.form['app_name']
    sub_apps = []
    js = json.loads(request.form['sub_apps'])
    # print(js) OK
    for d_app in js:
        if None in multi_get(d_app, 'name', 'ext_url', 'in_url', 'domain', 'type'):
            return make_error('invalid requeste')
        upstream = None
        if d_app['domain'] in db.domains:
            domain = db.domains[d_app['domain']]
            if 'upstream' in d_app:
                if d_app['upstream'] in db.upstreams:
                    upstream = db.upstreams[d_app['upstream']]
            sub_apps.append(ng.App(
                d_app['name'], d_app['ext_url'], d_app['in_url'], d_app['type'], domain, upstream))
        else:
            return make_error("domain name couldn't be found")
    try:
        filename = os.path.join(db.folder, 'apps', name + '.json')
        db.add_app(ng.app.Application(name, filename, sub_apps))
        return make_error(False)
    except Exception as e:
        print(e)
        return make_error(True)


@post_api
def apply_settings(request):
    try:
        db.dump()
        return make_error(False)
    except Exception as e:
        return make_error(e.__str__())


@post_api
def get_applications(request):
    return jsonify({})


@app.route('/')
def index():
    return redirect('/index.html')


@app.route('/<path:path>')
def serve_files(path):
    return send_from_directory('front-end', path)


app.run(port=PORT, debug=True)
