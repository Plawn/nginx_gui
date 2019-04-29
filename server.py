import os
import json
from typing import List, Dict, Tuple
from flask import Flask, flash, request, redirect, url_for, jsonify, make_response, send_from_directory
import uuid
import nginx_api as ng
import sys

app = Flask(__name__)

warn = ng.warn
success = ng.success

# Settings

sess_id = 'jeb'
front_end_path = 'front-end/build'
PORT = 5679
# username -> password

# /Settings
db_folder = sys.argv[1]
db = ng.open_db(db_folder)
with open(os.path.join(db_folder, 'conf.json'), 'r') as f:
    c = json.load(f)
users = c['users']
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
    _id = request.cookies.get(sess_id)
    return _id != None and _id in idied
    #     if idx in idied:
    #         return True
    # return False


def check_form(*keys: Tuple[str]):
    """Checks if the form contains all the required keys
    """
    def real_decorator(func):
        def wrapped(*args, **kwargs):
            for key in keys:
                if key not in request.form:
                    return make_error('invalid request missing arguments')
            return func(*args, **kwargs)
        wrapped.__name__ = func.__name__
        return wrapped
    return real_decorator


def make_id(): return str(uuid.uuid4())


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
    except Exception as e:
        error = e.__str__()
    return make_error(error)


@app.route('/is_logged', methods=['GET'])
def is_logged():
    return make_error(is_connected(request))


def multi_get(d: dict, *keys: Tuple[str]):
    for key in keys:
        yield d.get(key)
    # return [d.get(key) for key in keys]


@post_api
@check_form('old_domain', 'name', 'in_url', 'ext_url')
def update_app(request):
    """updates the app form a given domain
    """
    # domain_name, name, upstream_name, in_url, ext_url, _type = f['domain'], f['name'], f.get('upstream_name'), f['in_url'], f['ext_url'], f['type']
    old_domain, name, upstream_name, in_url, ext_url, _type, new_domain, parent, old_name = multi_get(
        request.form, 'old_domain', 'name', 'upstream_name', 'in_url', 'ext_url', '_type', 'domain', 'parent', 'old_name')
    if old_domain != new_domain:
        db.change_app_domain(parent, name, old_domain, new_domain)
    domain = new_domain
    
    if domain in db.domains:
        try:
            if old_name != name :
                db.apps[parent].change_app_name(old_name, name)
            app = db.apps[parent].apps[name]
            # upstream upstream
            if upstream_name != None and upstream_name != '':
                if upstream_name not in db.upstreams:
                    return make_error('upstream not found')
                else:
                    app.upstream = db.upstreams[upstream_name]
            else:
                if app.upstream != None:
                    app.upstream = None
            if app.type == 'ws' and app.upstream == None:
                return make_error('missing upstream for ws type')
            # bad looking
            app.ext_route = ext_url
            app.in_route = in_url
            if app.type != _type:
                app.set_type(_type)
            if app.name != name:
                app.change_name(name)

            return make_error(False)
        except Exception as e:
            print(e)
            return make_error('invalid request {}'.format(e))
    return make_error('name not found')


@post_api
@check_form('name', 'ext_path', 'in_path')
def add_upstream(request):
    name, ext_path, in_path = request.form['name'], request.form['ext_path'], request.form['in_path']
    if ext_path not in db.upstreams:
        new_upstream = ng.Upstream(name, ext_path, in_path)
        try:
            db.add_upstream(new_upstream)
            return make_error(False)
        except:
            return make_error("upstream could't be added")
    return make_error('upstream already exists')


@post_api
def get_domains(request):
    return jsonify(list(db.domains))


@app.route('/logout')
def logout():
    idx = request.cookies.get(sess_id)
    if idx != None:
        if idx in idied:
            del idied[idx]
    return make_error(False)


def prepare_subapp_to_send(domain_name: str, app_name: str):
    d = {**db.domains[domain_name].apps[app_name].__dict__}
    d['domain'] = d['domain'].server_name
    d['parent'] = d['parent'].name
    if d['upstream'] != None:
        d['upstream'] = d['upstream'].ext_path
    return d


@post_api
@check_form('domain_name', 'app_name')
def get_subapp_from_domain(request):
    try:
        return jsonify(prepare_subapp_to_send(
            request.form['domain_name'],
            request.form['app_name']
        ))
    except Exception as e:
        print(e)
        return make_error('domain or app not found, only found {}'.format(db.domains[request.form['domain_name']
                                                                                     ].apps))


@post_api
@check_form('domain_name')
def get_all_subapps_from_domain(request):
    return jsonify([prepare_subapp_to_send(request.form['domain_name'], i)
                    for i in db.domains[request.form['domain_name']].apps])


@post_api
@check_form('domain_name')
def get_apps_from_domain(request):
    try:
        return jsonify(list(db.domains[request.form['domain_name']].apps))
    except:
        return make_error('domain name not found')


@post_api
def get_upstreams(request):
    """only returns the name"""
    return jsonify(list(db.upstreams.keys()))


@post_api
def get_upstreams_details(request):
    return jsonify({})

# sub_apps should be a list of apps


@post_api
@check_form('application_name', 'sub_apps')
def add_application(request):
    name = request.form['application_name']
    sub_apps = []
    js: List[Dict[str, str]] = json.loads(request.form['sub_apps'])
    for d_app in js:
        if None in multi_get(d_app, 'name', 'ext_url', 'in_url', 'domain', 'type'):
            return make_error('missing arguments')
        upstream = None
        if d_app['domain'] in db.domains:
            domain = db.domains[d_app['domain']]
            print(d_app)
            if d_app['upstream'] != '': # using an upstream
                if d_app['upstream'] in db.upstreams:
                    upstream = db.upstreams[d_app['upstream']]
                else :
                    return make_error('Upstream undefined') 
            try :
                sub_apps.append(ng.App(
                d_app['name'], d_app['ext_url'], d_app['in_url'], d_app['type'], domain, upstream))
            except Exception as e:
                return make_error(e.__str__())
        else:
            return make_error("domain name couldn't be found")
    try:
        filename = os.path.join(db.folder, 'apps', name + '.json')
        db.add_application(ng.app.Application(name, filename, sub_apps))
        return make_error(False)
    except Exception as e:
        print(e)
        return make_error(e.__str__())


@post_api
@check_form('domain_name', 'protocol', 'listening_port', 'using_ssl')
def add_domain(request):
    f = request.form
    try:
        ssl = ng.SSL(f['ssl_fullchain'], f['ssl_privkey']
                     ) if f['using_ssl'] else None
        db.add_domain(ng.Domain(f['domain_name'], f['protocol'],
                                ssl=ssl, listening_port=int(f['listening_port'])))
        return make_error(False)
    except Exception as e:
        return make_error(e.__str__())


def _apply_settings():
    try:
        db.dump()
        return make_error(False)
    except Exception as e:
        print(e)
        return make_error(e.__str__())


@post_api
def add_app(request):
    f = request.form
    # print(f)
    upstream = db.upstreams[f['upstream']
                            ] if f['upstream'] != '' else None
    try:
        _app = ng.App(f['app_name'], f['ext_url'], f['in_url'],
                      f['protocol'], upstream=upstream)
        db.add_app(_app, f['domain_name'], f['application_name'])
        return _apply_settings()
    except Exception as e:
        return make_error(e.__str__())


@post_api
def apply_settings(request):
    return _apply_settings()


@post_api
def get_applications(request):
    return jsonify(list(db.apps.keys()))


@post_api
def restart_nginx(request):
    res = os.system('sudo nginx -s reload')
    return make_error(res)


@app.route('/')
def index():
    return redirect('/index.html')


@app.route('/<path:path>')
def serve_files(path):
    return send_from_directory(front_end_path, path)


app.run(port=PORT, debug=True)
