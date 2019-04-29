import json
import sys
import os
from typing import Dict, List
import Fancy_term as term


from . import utils
from .utils import warn, success
from . import app
from .app import App
from .ssl import SSL
from .upstream import Upstream
from . import upstream
from . import new_db


upstreams_folder = 'upstreams'
apps_folder = 'apps'
domains_folder = 'domains'


def open_domain(filename: str):
    with open(filename, 'r') as f:
        c = json.load(f)
    # SSL handling
    raw_ssl = c.get('ssl')
    if raw_ssl != None:
        ssl = SSL(raw_ssl['fullchain'], raw_ssl['privkey'])
    return Domain(c['server_name'], c['protocol'], filename, ssl=ssl)


def open_db(folder_name: str):
    # we load all the upstreams
    all_upstreams = [upstream.open_upstreams(filename)
                     for filename in utils.ls(os.path.join(folder_name, upstreams_folder))]
    upstreams, err = {}, False
    for up in all_upstreams:
        for _, u in up.items():
            if u.name not in upstreams:
                upstreams[u.ext_path] = u
            else:
                err = True
                warn("upstream {} already defined".format(u.name))
    if not err:
        success("Upstreams loaded")

    # load all the domains
    domains: Dict[str, Domain] = {}
    err = False
    for filename in utils.ls(os.path.join(folder_name, domains_folder)):
        domain = open_domain(filename)
        domains[domain.server_name] = domain
    if not err:
        success("Domains loaded")

    # load all the apps
    err = False
    apps = {}
    for filename in utils.ls(os.path.join(folder_name, 'apps')):
        application = app.open_application(filename, upstreams, domains)
        apps[application.name] = application
        for _, _app in application.apps.items():
            try:
                domains[_app.domain.server_name].add_app(_app)
            except Exception as e:
                warn(e.__str__())
            # if app.ext_route not in domains[app.domain.server_name].apps:
            #     domains[app.domain.server_name].add_app(app)
            # else:
            #     err = False
            #     warn('app {} already defined in {}'.format(
            #         app.ext_route, app.domain.name))
    if not err:
        success("Applications loaded")
    else:
        # need to do logs
        warn('Error while loading some Apps, check the logs for more details')

    n = NGINX_db(folder_name,  domains, upstreams, apps)
    with open(os.path.join(folder_name, 'conf.json'), 'r') as f:
        c = json.load(f)
    n.upstreams_directory = c['upstream_directory']
    n.domains_directory = c['conf_directory']
    n.users = c['users']
    return n


class Domain:
    def __init__(self, server_name, protocol, filename=None, apps={}, ssl=None, listening_port=443):
        self.server_name: str = server_name.lower()
        self.apps: Dict[str, App] = {}
        self.users = None
        for app_name in apps:
            self.add_app(apps[app_name])
        self.ssl: SSL = ssl
        self.using_ssl = self.ssl != None
        self.listening_port = listening_port
        self.filename: str = filename
        self.protocol: str = protocol

    def build(self):
        s = 'server {\n\n'
        s += '\tserver_name {};\n'.format(self.server_name)
        s += '\n\tlisten {} ssl;\n'.format(self.listening_port)
        if self.using_ssl:
            s += self.ssl.build()
        for app in self.apps:
            s += self.apps[app].build() + '\n'
        s += '}'
        return s

    def change_app_name(self, app: App, name: str):
        self.apps[name] = self.apps[app.name]
        del self.apps[app.name]
        app.name = name

    def add_app(self, app: App):
        if app.ext_route not in self.apps:
            self.apps[app.ext_route] = app
            app.set_domain(self)
        else:
            raise Exception('app already defined')

    def remove_app(self, app: App):
        if app.name in self.apps:
            del self.apps[app.name]
        else:
            raise Exception('app undefined')

    def dump(self, filename=None):
        if filename == None:
            filename = self.filename
        if filename == None:
            raise Exception('filename not set')

        d = {}
        d['server_name'] = self.server_name
        d['protocol'] = self.protocol
        ssl_dict = {}
        if self.ssl != None:
            ssl_dict['fullchain'] = self.ssl.fullchain
            ssl_dict['privkey'] = self.ssl.privkey
        d['ssl'] = ssl_dict
        with open(filename, 'w') as f:
            json.dump(d, f, indent=4)

    def __repr__(self):
        return '<Domain : {}>'.format(self.server_name)


class NGINX_db:
    upstream_filename = 'upstreams.json'

    def __init__(self, folder=None, domains={}, upstreams={}, apps={}):
        self.domains: Dict[str, Domain] = domains
        self.upstreams: Dict[str, Upstream] = upstreams
        self.domains_directory: str = None
        self.upstreams_directory: str = None
        self.folder: str = folder
        self.apps: Dict[str, app.Application] = apps

    def set_filename(self, filename: str):
        self.filename = filename

    def change_app_domain(self, application_name: str, app_name: str, old_domain: str, new_domain: str):
        self.apps[application_name].apps[app_name].change_domain(
            self.domains[old_domain], self.domains[new_domain])

    def change_application_name(self, application: app.Application, new_name: str):
        if new_name not in self.apps:
            t = self.apps[application.name]
            del self.apps[application.name]
            application.name = new_name
            self.apps[new_name] = t
        else:
            raise Exception('Application name already defined')

    def add_application(self, application: app.Application):
        for _, _app in application.apps.items():
            try:
                self.domains[_app.domain.server_name].add_app(_app)
                application.dump()
            except Exception as e:
                # print(e)
                raise Exception(
                    'failed to add app to domain : {} \nerror-> {}'.format(_app.domain, e.__str__()))
        else:
            self.apps[application.name] = application

    def add_app(self, app: App, domain_name: str, application_name: str):
        try:
            self.domains[domain_name].add_app(app)
        except:
            raise Exception('invalid domain name')
        try:
            self.apps[application_name].add_app(app)
            self.apps[application_name].dump()
        except:
            raise Exception('invalid application name')

    def _dump_upstreams(self):
        upstreams = [_upstream.dump()
                     for _, _upstream in self.upstreams.items()]
        with open(os.path.join(self.folder, upstreams_folder, 'upstreams.json'), 'w') as f:
            json.dump(upstreams, f, indent=4)

    def dump(self, folder=None):
        if folder == None:
            folder = self.folder
        if folder == None:
            raise Exception('folder not specified')

        # dumping conf.json
        content = {}
        content['conf_directory'] = self.domains_directory
        content['upstream_directory'] = self.upstreams_directory
        content['users'] = self.users
        with open(os.path.join(folder, 'conf.json'), 'w') as f:
            json.dump(content, f, indent=4)

        # dumping domains
        for _, domain in self.domains.items():
            domain.dump()

        # dumping upstreams
        self._dump_upstreams()

        # dumping Applications
        for _app_name, _app in self.apps.items():
            try:
                _app.dump()
                success('dumped {}'.format(_app_name))
            except:
                warn('failed {}'.format(_app_name))

    def __repr__(self):
        return '\n'.join(self.domains[i].build() for i in self.domains) + '\n\n' + '# Upstream\n\n'.join(self.upstreams[i].build() for i in self.upstreams)

    def add_upstream(self, upstream: Upstream):
        if upstream.name in self.upstreams:
            raise Exception('upstream already existing')
        self.upstreams[upstream.ext_path] = upstream
        self._dump_upstreams()

    def add_domain(self, domain: Domain):
        if domain.server_name in self.domains:
            raise Exception(
                'server_name already served : {}'.format(domain.server_name))
        domain.filename = os.path.join(
            self.folder, domains_folder, '{}.json'.format(domain.server_name))
        self.domains[domain.server_name] = domain
        domain.dump()
        # should setup the filename

    def build(self):
        # building upstream file
        if self.upstreams_directory != None and self.domains_directory != None:
            s = '\n'.join(self.upstreams[_upstream].build()
                          for _upstream in self.upstreams)
            with open(os.path.join(self.upstreams_directory, 'upstreams.conf'), 'w') as f:
                f.write(s)

            # building domains
            for _, domain in self.domains.items():
                with open(os.path.join(self.domains_directory, domain.server_name + '.conf'), 'w') as f:
                    f.write(domain.build())
        else:
            raise Exception('upstream directory or domains directory not set')
