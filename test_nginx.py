import nginx_api as ng
from nginx_api import App
# a = [
#     App('AVTO', '/AVTO/', ':8080/AVTO'),
#     App('yesic', '/yesic/', ':3000')
# ]

# full_addr = '/etc/letsencrypt/live/home.plawn-inc.science/fullchain.pem'
# priv_addr = '/etc/letsencrypt/live/home.plawn-inc.science/privkey.pem'

# d = nginx_api.Domain(
#     'home.plawn-inc.science',
#     a,
#     nginx_api.SSL(full_addr, priv_addr)
# )


# print(d.build())


db = ng.NGINX_db()
db.set_filename('conf.json')
db.load()
print(db.domains)
db.dump()