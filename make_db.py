import json
import os
import sys


def make_db(folder_name, password, conf_folder, upstream_folder):
    try:
        os.mkdir(folder_name)
    except:
        print('folder already exists\ncreation aborted')
        sys.exit(2)
    os.mkdir(os.path.join(folder_name, 'apps'))
    os.mkdir(os.path.join(folder_name, 'domains'))
    os.mkdir(os.path.join(folder_name, 'upstreams'))
    with open(os.path.join(folder_name, 'conf.json'), 'w') as f:
        json.dump({
            'conf_directory': conf_folder,
            'upstream_directory': upstream_folder,
            'users': {
                'admin': password
            }},
            f,
            indent=4
        )


if __name__ == '__main__':
    db_name = sys.argv[1]
    password = sys.argv[2]
    conf_folder = sys.argv[3]
    upstream_folder = sys.argv[4]
    make_db(db_name, password,conf_folder, upstream_folder)
