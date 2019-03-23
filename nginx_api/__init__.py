from .nginx_api import *
from . import new_db

if __name__ == '__main__':
    if len(sys.argv) >= 4:
        folder_name = sys.argv[1]
        conf_folder = sys.argv[2]
        upstreams_folder = sys.argv[3]
        new_db.prepare_db(folder_name, conf_folder, upstreams_folder)
        print("""Don't forget to set up your nginx.conf to pick up the conf_folder and upstreams_folder for *.conf files""")
    else:
        print("""usage : folder conf_folder upstreams_folder""")
