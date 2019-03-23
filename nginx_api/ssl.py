class SSL:
    """
requires the fullchain.pem and privkey.pem location
    """

    def __init__(self, fullchain:str, privkey:str):
        self.fullchain = fullchain
        self.privkey = privkey
        self.domain_name = None

    def build(self):
        return """
    ssl on;
	ssl_certificate {};
	ssl_certificate_key {};
	ssl_trusted_certificate {};
	ssl_session_cache shared:SSL:10m;
        """.format(self.fullchain, self.privkey, self.fullchain)

    def __repr__(self):
        return '<SSL : {}>'.format(self.domain_name)