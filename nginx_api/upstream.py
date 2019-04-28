import json


class Upstream:
    def __init__(self, name: str, ext_path: str, in_path):
        self.name = name
        self.ext_path = ext_path
        self.in_path = in_path

    def build(self):
        s = """\
upstream %s { # { "name":"%s" }
    server %s; 
}""" % (self.ext_path, self.name, self.in_path)
        return s

    def dump(self):
        return {'name': self.name, 'ext_path': self.ext_path, 'in_path': self.in_path}

    def __repr__(self):
        return '<Upstream "{}" ~ {}->:{}>'.format(self.name, self.ext_path, self.in_path)


def open_upstreams(filename: str):
    with open(filename, 'r') as f:
        content = json.load(f)
    return {up['ext_path']: Upstream(
        up['name'], up['ext_path'], up['in_path']) for up in content}
