import re
import os
string = """

import './a.js';

export default [download_folder_div,
    parsers_folder_div,
    port_input,
    darkmode_toggle_button,
    input_login,
    input_password];
"""


re_js_exporter = re.compile(r"(?s)(?<=export default ).*?(?=])")


def make_filename(name: str, importer_name: str):
    name = name[1:-1]
    if name[0] == '/':
        return name
    folder = '/'.join(importer_name.split('/')[:-1])
    if len(folder) == 0:
        folder = './'
    name = os.path.join(folder, name).replace('././', './')
    while name[0] == '"' or name[0] == "'":
        name = name[1:]
    return name


re_import = re.compile(r"(?s)(?<=import ).*?(?=;)")


def importer(res: str, importer_name: str):
    for filename in filter(lambda x: x !=
                           '', re_import.findall(res)):
        try:
            # handle recursve imports
            # filename =
            print(make_filename(filename, importer_name))
            with open(make_filename(filename, importer_name), 'r') as f:
                res = res.replace('import ' + filename + ';',
                                  importer(f.read(), filename))
        except:
            raise Exception("couldn't find file {}".format(filename))
    return res


def check_export_string(i: str):
    i = i.strip()
    if i[0] == '[':
        i = i[1:]
    if i[-1] == ']':
        i = i[:-1]
    return i


def build_export_string(string):
    res = re_js_exporter.findall(string)
    if len(res) > 0:
        res = res[0]
    else:
        return ''
    s = ''
    for i in [check_export_string(i) for i in res.split(',')]:
        s += 'window.{} = {};\n'.format(i, i)
    return s


s = build_export_string(string)

# print(s)

print(importer(string, 'test.js'))
