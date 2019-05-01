

# may be incomplete but simpler for now
first_authorized_char = 'AZERTYUIOPQSDFGHJKLMWXCVBN_-'


# base for now
available_dynamic_values = (
    '$remote_addr',
    '$proxy_add_x_forwarded_for',
    '$scheme',
    '$host'
)


class Header:
    def __init__(self, name: str, value: str):
        self.name = name
        self.value = value
        self.check()
        self.parent = None

    def build(self):
        return 'proxy_set_header {} {};'.format(self.name, self.value)


    def check(self):
        if self.name[0] not in first_authorized_char:
            raise Exception('first character must be a in {}'.format(first_authorized_char))
        if '$' in self.value:
            if self.value not in available_dynamic_values:
                raise Exception(
                    'invalid dynamic parameter : {}'.format(self.value))

    def dump(self):
        return {'name': self.name, 'value': self.value}

    def rename(self, name: str):
        del self.parent.headers[self.name]
        self.name = name
        self.parent.headers[self.name] = self

    def __repr__(self):
        return '<Header {} : {}>'.format(self.name, self.value)

def transparent_headers():
    return [
        Header('Host', '$host'),
        Header('X-Real-IP', '$remote_addr'),
        Header('X-Forwarded-For', '$proxy_add_x_forwarded_for'),
        Header('X-Forwarded-Proto', '$scheme'),
    ]