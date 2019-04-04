import os
import shutil
import datetime


def try_rm_file(filename: str):
    try:
        shutil.rmtree(filename)
    except:
        pass


def try_rm_list(liste: list, data):
    try:
        liste.remove(data)
    except:
        pass


def zero_pad(string, nb_char):
    return '0' * (nb_char - len(string)) + string


def nice_date():
    now = datetime.datetime.now()
    return '[{}:{}:{} {}/{}/{}]'.format(
        zero_pad(str(now.hour), 2),
        zero_pad(str(now.minute), 2),
        zero_pad(str(now.second), 2),
        zero_pad(str(now.day), 2),
        zero_pad(str(now.month), 2),
        now.year)
