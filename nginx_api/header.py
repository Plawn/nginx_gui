

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
        self._name = None
        self._value = None
        self.value = value
        self.name = name

    def build(self):
        return 'proxy_set_header {} {};'.format(self.name, self.value)

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, val):
        if '$' in val:
            if val not in available_dynamic_values:
                raise Exception(
                    'invalid dynamic parameter : {}'.format(val))
        self._value = val
    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, name):
        if name[0] not in first_authorized_char:
            raise Exception('first character must be a in {}'.format(
                first_authorized_char))
        self._name = name

    def dump(self):
        return {'name': self._name, 'value': self._value}

    def __repr__(self):
        return '<Header {} : {}>'.format(self.name, self.value)


def transparent_headers():
    return [
        Header('Host', '$host'),
        Header('X-Real-IP', '$remote_addr'),
        Header('X-Forwarded-For', '$proxy_add_x_forwarded_for'),
        Header('X-Forwarded-Proto', '$scheme'),
    ]
