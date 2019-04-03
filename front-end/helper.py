import os
import shutil
import datetime

def try_rm_file(filename:str):
    try : shutil.rmtree(filename)
    except: pass


def try_rm_list(liste:list, data):
    try : liste.remove(data)
    except: pass

def nice_date():
    now = datetime.datetime.now()
    return '[{}:{}:{} {}/{}/{}]'.format(now.hour, now.minute, now.second, now.day, now.month, now.year)

