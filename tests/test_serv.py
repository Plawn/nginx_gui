import requests
import json


s = requests.session()
base_url = 'http://localhost:5678/'

r = s.post(base_url + 'login', data={"login": "admin", "password": "pas"})

print(r.text)
print(s.cookies)

r = s.post(base_url + 'api', data={'type': 'update_app'})

print(r.text)


r = s.post(base_url + 'api', data={"type": 'get_domains'})

res = json.loads(r.text)

print(res)

for name in res:
    r = s.post(base_url + 'api',
               data={'type': 'get_apps_from_domain', 'domain_name': name})
    print(r.text)


r = s.post(base_url + 'api',
           data={
               'type': 'get_subapp_from_domain',
               'domain_name': 'ws.plawn-inc.science',
               'app_name': 'test2'
           })

print(r.text)

r = s.post(base_url + 'api',
           data={
               'type': 'build_nginx',
           })

print(r.text)

r = s.post(base_url + 'api',
           data={
               'type': 'add_application',
               'app_name':'shleb',
               'sub_apps':json.dumps([
                   {
                       'name':'jam',
                       'ext_url':'/po',
                       'in_url':':8989/PO',
                       'type':'https',
                       'domain':'home.plawn-inc.science'
                   }
               ])
           })

print('adding', r.text)



r = s.post(base_url + 'api', data={"type": 'get_domains'})

res = json.loads(r.text)

for name in res:
    r = s.post(base_url + 'api',
               data={'type': 'get_apps_from_domain', 'domain_name': name})
    print(r.text)


r = s.post(base_url + 'api', data={"type": 'apply_settings'})

print(r.text)