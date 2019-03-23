from .utils import correct_route
from typing import Dict, List
import json


class App:
    supported_types = ['https', 'http', 'ws']

    def __init__(self, name: str, ext_route: str, in_route: str, protocol: str, domain=None, upstream=None):
        """(name:str, ext_route:str, in_route:str)
        """
        self.name = name
        self.ext_route = correct_route(ext_route)
        self.in_route = correct_route(in_route)
        self.type = protocol
        self.upstream = upstream
        self.domain = domain
        if not self.type in self.supported_types:
            raise Exception('type {} not supported'.format(self.type))
        if self.type == 'ws':
            if self.upstream == None:
                raise Exception('using ws type and missing upstream object')

    def build_ext_route(self):
        if self.type == 'ws':
            return 'http://{}'.format(self.upstream.path)
        return 'http://localhost{}/'.format(self.in_route)

    def set_domain(self, domain):
        self.domain = domain

    def build(self):
        return """
    location /%s/ { # {"app_name":"%s"}
        proxy_pass %s;
        %s
	}""" % (self.ext_route, self.name, self.build_ext_route(), self.build_type())

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
            d['upstream_name'] = self.upstream.path
        return d

    def __repr__(self):
        return '<App : {}>'.format(self.name)

    def change_name(self, name: str):
        self.domain.change_app_name(self, name)


class Application:
    def __init__(self, name: str, filename: str, apps=[]):
        self.name = name
        self.apps: List[App] = apps
        self.filename = filename
        print('new app named', self.filename)

    def __setattr__(self, name, value):
        print('setting {} as {}'.format(name, value))
        super().__setattr__(name, value)


    def dump(self):
        print('tryna dump {}'.format(self.name))
        res = {'name': self.name}
        for app in self.apps:
            res[app.domain.server_name] = app.dump()
        print('jev this', self.filename)
        with open(self.filename, 'w') as f:
            json.dump(res, f, indent=4)
        return self.filename


    def __repr__(self):
        return '<Application : {}>'.format(self.name)

def open_app(filename: str, upstreams: dict, domains: dict):
    with open(filename, 'r') as f:
        content_1: List[dict] = json.load(f)
    name = content_1['name']
    del content_1['name']
    sub_apps = []
    for domain_name in content_1:
        l_domain = content_1[domain_name]
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
