import json
import sys
import os
from typing import Dict, List
import Fancy_term as term


from . import utils
from . import app
from .app import App
from .ssl import SSL
from .upstream import Upstream
from . import upstream
from . import new_db


warn_style = term.Style(color=term.colors.red, substyle=[term.substyles.bold])
prefix = '[' + term.colored_string(warn_style, 'X') + '] '
warn = term.Smart_print(term.Style(), prefix=prefix)

success_style = term.Style(color=term.colors.green,
                           substyle=[term.substyles.bold])
prefix = '[' + term.colored_string(success_style, '#') + '] '
success = term.Smart_print(term.Style(), prefix=prefix)


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
    d = Domain(c['server_name'], c['protocol'], filename, ssl=ssl)

    return d


def open_db(folder_name: str):
    # we load all the upstreams
    all_upstreams = [upstream.open_upstreams(filename)
                     for filename in utils.ls(os.path.join(folder_name, upstreams_folder))]
    upstreams, err = {}, False
    for up in all_upstreams:
        for _up in up:
            u = up[_up]
            if u.name not in upstreams:
                upstreams[u.path] = u
            else:
                err = True
                warn("upstream {} already defined".format(u.name))
    if not err:
        success("Upstreams loaded")
    # load all the domains
    domains, err = {}, False
    for filename in utils.ls(os.path.join(folder_name, domains_folder)):
        domain = open_domain(filename)
        domains[domain.server_name] = domain
    if not err:
        success("Domains loaded")
    # load all the apps
    err = False
    apps = {}
    for filename in utils.ls(os.path.join(folder_name, 'apps')):
        application = app.open_app(filename, upstreams, domains)
        apps[application.name] = application
        for ap in application.apps:
            if ap.name not in domains[ap.domain.server_name].apps:
                domains[ap.domain.server_name].add_app(ap)
            else:
                err = False
                warn('app {} already defined in {}'.format(
                    ap.name, ap.domain.name))
    if not err:
        success("Applications loaded")

    n = NGINX_db(folder_name,  domains, upstreams, apps)
    with open(os.path.join(folder_name, 'conf.json'), 'r') as f:
        c = json.load(f)
    n.upstreams_directory = c['upstream_directory']
    n.domains_directory = c['conf_directory']
    return n


class Domain:
    def __init__(self, server_name, protocol, filename=None, apps={}, ssl=None):
        self.server_name: str = server_name.lower()
        self.apps: Dict[str, App] = {}
        for app_name in apps:
            self.add_app(apps[app_name])
        self.ssl: SSL = ssl
        self.using_ssl = self.ssl != None
        self.listening_port = 443
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
        if app.name not in self.apps:
            self.apps[app.name] = app
            app.set_domain(self)
        else:
            raise Exception('app already defined')

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
        self.apps: Dict[str, App] = apps

    def set_filename(self, filename: str):
        self.filename = filename

    def add_app(self, application: app.Application):
        for _app in application.apps:
            try:
                self.domains[_app.domain.server_name].add_app(_app)
            except:
                raise Exception(
                    'failed to add app to domain : {}'.format(_app.domain))

    def add_app_to_domain(self, app: App, domain_name: str):
        self.domains[domain_name].add_app(app)

    def dump(self, folder=None):
        if folder == None:
            folder = self.folder
        if folder == None:
            raise Exception('folder not specified')
        # dumping conf.json
        content = {}
        content['conf_directory'] = self.domains_directory
        content['upstream_directory'] = self.upstreams_directory
        with open(os.path.join(folder, 'conf.json'), 'w') as f:
            json.dump(content, f, indent=4)
        # dumping domains
        for domain_name in self.domains:
            self.domains[domain_name].dump()
        
        upstreams = [self.upstreams[_upstream].dump() for _upstream in self.upstreams]
        with open(os.path.join(self.folder, upstreams_folder, 'upstreams.json'), 'w') as f :
            json.dump(upstreams, f, indent=4)
        # missing upstreams

    def __repr__(self):
        return '\n'.join(self.domains[i].build() for i in self.domains) + '\n\n' + '# Upstream\n\n'.join(self.upstreams[i].build() for i in self.upstreams)

    def add_upstream(self, upstream: Upstream):
        if upstream.name in self.upstreams:
            raise Exception('upstream already existing')
        self.upstreams[upstream.path] = upstream

    def add_domain(self, domain: Domain):
        if domain.server_name in self.domains:
            raise Exception(
                'server_name already served : {}'.format(domain.server_name))
        self.domains[domain.server_name] = domain

    def build(self):
        # building upstream file
        if self.upstreams_directory != None and self.domains_directory != None:
            s = '\n'.join(self.upstreams[_upstream].build()
                          for _upstream in self.upstreams)
            with open(os.path.join(self.upstreams_directory, 'upstreams.conf'), 'w') as f:
                f.write(s)

            # building domains
            for domain in self.domains:
                d = self.domains[domain]
                with open(os.path.join(self.domains_directory, d.server_name + '.conf'), 'w') as f:
                    f.write(d.build())
        else:
            raise Exception('upstream directory or domains directory not set')


if __name__ == '__main__':
    if len(sys.argv) >= 4:
        folder_name = sys.argv[1]
        conf_folder = sys.argv[2]
        upstreams_folder = sys.argv[3]
        new_db.prepare_db(folder_name, conf_folder, upstreams_folder)
        print("""Don't forget to set up your nginx.conf to pick up the conf_folder and upstreams_folder for *.conf files""")
    else:
        print("""usage : folder conf_folder upstreams_folder""")
