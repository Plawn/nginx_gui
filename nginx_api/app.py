from .utils import correct_route
from typing import Dict, List
import json

keys_to_remove = ('name', )

class App:
    supported_types = ['https', 'http', 'ws']

    def __init__(self, name: str, ext_route: str, in_route: str, protocol: str, domain=None, upstream=None):
        """(name:str, ext_route:str, in_route:str)
        """
        self.name = name
        self.ext_route = correct_route(ext_route)
        self.in_route = correct_route(in_route)
        # self.type = protocol
        self.type = None
        self.upstream = upstream
        self.domain = domain
        self.parent:Application = None
        
        self.set_type(protocol)

    def build_ext_route(self):
        if self.type == 'ws':
            return 'http://{}'.format(self.upstream.ext_path)
        return 'http://{}/'.format(self.in_route)

    def set_domain(self, domain):
        self.domain = domain

    def set_type(self, _type:str):
        if not _type in self.supported_types:
            raise Exception('type {} not supported'.format(_type))
        if _type == 'ws':
            if self.upstream == None:
                raise Exception('missing upstream object while using ws type')
        self.type = _type

    def change_domain(self, old_domain, new_domain):
        old_domain.remove_app(self)
        new_domain.add_app(self)

    def build(self):
        return """
    location /%s/ { # %s
        proxy_pass %s;
        %s
	}""" % (self.ext_route, json.dumps({'name': self.name, 'parent':self.parent.name}), self.build_ext_route(), self.build_type())

    def build_type(self):
        if self.type == 'ws':
            return """
        proxy_http_version 1.1;
	    proxy_set_header Upgrade $http_upgrade;
	    proxy_set_header Connection "Upgrade";
"""
        return ''

    def dump(self):
        d = {
            'name': self.name,
            'ext_url': self.ext_route,
            'in_url': self.in_route,
            'type': self.type
        }
        if self.upstream != None:
            d['upstream_name'] = self.upstream.ext_path
        return d

    def __repr__(self):
        return '<App : {}>'.format(self.name)

    def change_name(self, name: str):
        self.domain.change_app_name(self, name)


class Application:
    def __init__(self, name: str, filename: str, apps=[]):
        self.name = name
        self.apps:Dict[str, App] = {}
        for app in apps :
            self.add_app(app)
        self.filename = filename

    def add_app(self, app):
        self.apps[app.name] = app
        app.parent = self

    def dump(self):
        res = {'name': self.name}
        for _, app in self.apps.items():
            if app.domain.server_name in res :
                res[app.domain.server_name].append(app.dump())
            else :
                res[app.domain.server_name] = [app.dump()]
        with open(self.filename, 'w') as f:
            json.dump(res, f, indent=4)
        return self.filename

    def __repr__(self):
        return '<Application : {}>'.format(self.name)


def open_application(filename: str, upstreams: dict, domains: dict):
    with open(filename, 'r') as f:
        content_1: List[dict] = json.load(f)
    name = content_1['name']
    # removing the other keys to nicely iterate
    for key in keys_to_remove :
        del content_1[key]
    sub_apps = []
    for domain_name in content_1:
        for l_domain in content_1[domain_name]: 
            upstream = None
            if domain_name in domains:
                if 'upstream_name' in l_domain:
                    if l_domain['upstream_name'] in upstreams:
                        upstream = upstreams[l_domain['upstream_name']]
                    else:
                        raise Exception("couln't find upstream : '{}'".format(
                            l_domain['upstream_name']))
            else:
                raise Exception('domain name not found : {}'.format(domain_name))
            sub_apps.append(App(l_domain['name'], l_domain['ext_url'],
                                l_domain['in_url'], l_domain['type'], domains[domain_name], upstream))
    return Application(name, filename, sub_apps)
