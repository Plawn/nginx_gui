from .utils import correct_route
from typing import Dict, List
from .header import Header
from . import header as _header
import json

keys_to_remove = ('name', )


class App:
    supported_types = ['https', 'http', 'ws']

    def __init__(self, name: str, ext_route: str, in_route: str, protocol: str, domain=None, upstream=None, headers={}):
        """(name:str, ext_route:str, in_route:str)
        """
        self.name = name
        self.ext_route = correct_route(ext_route)
        self.in_route = correct_route(in_route)
        # self.type = protocol
        self.type = None
        self.upstream = upstream
        self.domain = domain
        self.parent: Application = None
        self.headers = headers
        self._is_transparent = False
        self.set_type(protocol)

    @property
    def is_transparent(self):
        return self._is_transparent

    @is_transparent.setter
    def is_transparent(self, on: bool):
        if self._is_transparent != on:
            self._is_transparent = on
            if on :
                for header in _header.transparent_headers():
                    try:
                        self.add_header(header)
                    except:
                        # nothing the header already exists
                        pass
            else:
                for header in _header.transparent_headers():
                    try:
                        self.delete_header(header.name)
                    except:  # some transparent header have already been deleted
                        pass

    def build_in_route(self):
        if self.type == 'ws':
            return 'http://{}'.format(self.upstream.ext_path)
        return 'http://{}/'.format(self.in_route)

    def set_domain(self, domain):
        self.domain = domain

    def toJSON(self):
        d = {**self.__dict__}
        d['domain'] = self.domain.server_name
        d['parent'] = self.parent.name
        d['headers'] = [i.dump() for i in self.headers.values()]
        d['is_transparent'] = self._is_transparent
        del d['_is_transparent']
        if d['upstream'] != None:
            d['upstream'] = d['upstream'].ext_path
        return d

    def set_type(self, _type: str):
        if not _type in self.supported_types:
            raise Exception('type {} not supported'.format(_type))
        if _type == 'ws':
            if self.upstream == None:
                raise Exception(
                    'missing upstream object while using "ws" type')
        self.type = _type

    def build_headers(self):
        return '\n'.join(header.build() for _, header in self.headers.items())

    def change_domain(self, old_domain, new_domain):
        old_domain.remove_app(self)
        new_domain.add_app(self)

    def build(self):
        return """
    location /%s/ { # %s
        %s
        proxy_pass %s;
        %s
	}""" % (self.ext_route, json.dumps({'name': self.name, 'parent': self.parent.name}), self.build_headers(), self.build_in_route(), self.build_type())

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
            'type': self.type,
            'headers': [header.dump() for header in self.headers.values()],
            'is_transparent':self._is_transparent
        }
        if self.upstream != None:
            d['upstream_name'] = self.upstream.ext_path
        return d

    def rename_header(self, old_name, new_name):
        t = self.headers[old_name]
        del self.headers[old_name]
        t.name = new_name
        self.headers[new_name] = t


    def add_header(self, header: Header):
        if header.name in self.headers:
            raise Exception('header already defined -> use update_header')
        self.headers[header.name] = header
        

    def update_header(self, header: Header):
        if header.name not in self.headers:
            raise Exception('header not found')
        self.headers[header.name] = header

    def delete_header(self, header_name):
        if header_name not in self.headers:
            raise Exception('header not found')
        del self.headers[header_name]

    def __repr__(self):
        return '<App : {}>'.format(self.name)

    def change_name(self, name: str):
        self.domain.change_app_name(self, name)


class Application:
    def __init__(self, name: str, filename: str, apps=[]):
        self.name = name
        self.apps: Dict[str, App] = {}
        for app in apps:
            self.add_app(app)
        self._is_transparent = False
        self.filename = filename

    @property
    def is_transparent(self):
        return self._is_transparent

    @is_transparent.setter
    def is_transparent(self, on: bool):
        self._is_transparent = on
        for app in self.apps.values():
            app.is_transparent = on

    def change_app_name(self, old_name: str, new_name: str):
        if new_name in self.apps:
            raise Exception(
                'App name already in use {}{}'.format(old_name, new_name))
        t = self.apps[old_name]
        t.name = new_name
        self.apps[new_name] = t
        del self.apps[old_name]

    def add_app(self, app):
        self.apps[app.name] = app
        app.parent = self

    def dump(self):
        res = {'name': self.name}
        for _, app in self.apps.items():
            if app.domain.server_name in res:
                res[app.domain.server_name].append(app.dump())
            else:
                res[app.domain.server_name] = [app.dump()]
        with open(self.filename, 'w') as f:
            json.dump(res, f, indent=4)
        return self.filename

    def __repr__(self):
        return '<Application : {}>'.format(self.name)


def open_application(filename: str, upstreams: dict, domains: dict):
    with open(filename, 'r') as f:
        content: List[dict] = json.load(f)
    name = content['name']
    # removing the other keys to nicely iterate
    for key in keys_to_remove:
        del content[key]
    sub_apps = []
    for domain_name in content:
        for app in content[domain_name]:
            upstream = None
            headers = {}
            if domain_name in domains:
                if 'upstream_name' in app:
                    if app['upstream_name'] in upstreams:
                        upstream = upstreams[app['upstream_name']]
                    else:
                        raise Exception("couln't find upstream : '{}'".format(
                            app['upstream_name']))
                for header in app['headers']:
                    headers[header['name']] = Header(
                        header['name'], header['value'])
            else:
                raise Exception(
                    'domain name not found : {}'.format(domain_name))
            _app = App(app['name'], app['ext_url'],
                                app['in_url'], app['type'], domain=domains[domain_name], upstream=upstream, headers=headers)
            _app._is_transparent = app['is_transparent']
            sub_apps.append(_app)
    return Application(name, filename, sub_apps)
