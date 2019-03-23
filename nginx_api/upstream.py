import json


class Upstream:
    def __init__(self, name: str, path: str, port):
        self.name = name
        self.path = path
        self.port = port

    def build(self):
        s = """
upstream %s { # { "name":"%s" }
    server localhost:%s; 
}""" % (self.path, self.name, self.port)
        return s

    def dump(self):
        return {'name':self.name, 'path':self.path, 'port':self.port}


    def __repr__(self):
        return '"{}" ~ {}->:{}'.format(self.name, self.path, self.port)


def open_upstreams(filename: str):
    with open(filename, 'r') as f:
        content = json.load(f)
    upstreams = {}
    for up in content:
        upstream = Upstream(up['name'], up['path'], up['port'])
        upstreams[upstream.path] = upstream
    return upstreams
