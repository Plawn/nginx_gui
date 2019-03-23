import os
import sys
import json

folders_to_prepare = ['domains', 'apps', 'upstreams']


def prepare_folder(fodler_name: str):
    try:
        os.mkdir(fodler_name)
    except:
        raise Exception("couln't create folder")


def prepare_db(folder_name: str, conf_folder: str, upstreams_folder: str):
    try:
        os.mkdir(folder_name)
    except:
        raise Exception(
            "couln't create output folder name : {}".format(folder_name))
    for f_name in folders_to_prepare:
        try:
            prepare_folder(os.path.join(folder_name, f_name))
        except:
            raise Exception("couldn't create folder {}".format(f_name))
    with open(os.path.join(folder_name, 'conf.json'), 'w') as f:
        json.dump({
            'conf.d': conf_folder,
            'upstreams_folder': upstreams_folder
        }, f, indent=4)


