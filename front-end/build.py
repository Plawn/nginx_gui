import os
import json
import shutil
import re
import Fancy_term as term
import helper
import time

loader_replace = '//put the loader here//'


print_error = term.Smart_print(style=term.Style(
    color=term.colors.red, substyle=[term.substyles.bold]))
print_success = term.Smart_print(style=term.Style(
    color=term.colors.green, substyle=[term.substyles.bold]))


# regex
re_classes = re.compile(r"\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*\s*\{")
re_ids = re.compile(r"\#[a-zA-Z][a-zA-Z0-9\-\_]+")
re_find_comments = re.compile(r"\/\*[^*]*\*+([^/*][^*]*\*+)*\/")

re_js_exporter = re.compile(r"(?s)(?<=export default ).*?(?=])")

begin = """(function (){
            const home = new Fancy_router.Panel(null, { name: '%s' });\n"""
end = """r.render();\n})();"""

content_directory = 'pages'


# filenames
html_name = 'page.html'
css_name = 'page.css'
settings_name = 'settings.json'
onload_name = 'onload.js'
js_name = 'page.js'
js_init = 'init.js'
js_quit = 'onquit.js'

# presets


def check_export_string(i: str):
    i = i.strip()
    if i[0] == '[':
        i = i[1:]
    if i[-1] == ']':
        i = i[:-1]
    return i


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


def handle_export_js(res):
    s = ''
    for i in map(lambda i: check_export_string(i), res.split(',')):
        s += 'window.{} = {};\n'.format(i, i)
    return s[:-2]


def build_js(string: str, filename: str):
    string = importer(string, filename)
    res = re_js_exporter.findall(string)
    string = string.replace('export default', '')
    if len(res) > 0:
        res[0] += ']'
        s = ''
        for i in res:
            string = string.replace(i, '')
            s += handle_export_js(i) + ';\n'
        return string + s
    return string


def read_if_exists(filename):
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            data = f.read()
            return data
    return ''


def do_one_page(folder_name):

    html = read_if_exists(os.path.join(folder_name, html_name))
    onload_js = read_if_exists(os.path.join(folder_name, onload_name))
    onquit_js = read_if_exists(os.path.join(folder_name, js_quit))
    init_js = read_if_exists(os.path.join(folder_name, js_init))

    is_home = False
    with open(os.path.join(folder_name, settings_name), 'r') as f:
        settings = json.load(f)
        if 'is_home' in settings:
            is_home: bool = True
        order: int = settings['order']

    # handling css here
    filename = os.path.join(folder_name, css_name)
    css = None
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            css = f.read()
        for item in re_find_comments.findall(css):
            css = css.replace(item, '')

    # handling js here
    filename = os.path.join(folder_name, js_name)
    js_content = None
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            js_content = f.read()

    if not is_home:
        init_js = build_js(init_js, filename)

    return {'content': html, 'onload': onload_js, 'init': init_js, 'onquit': onquit_js}, order, is_home, css, js_content, folder_name.split('/')[-1], folder_name


def build_loader(home_page, folders, map_name, map_home):
    s = begin % home_page[5]
    names_l = ['p{}'.format(i) for i in range(len(folders))]
    names = ','.join(names_l)
    for i, folder in enumerate(folders):
        s += "const %s = " % ('p'+str(i)) + \
            "new Fancy_router.Panel(null, { name: '%s' });\n" % folder.split(
                '/')[-1]
    # home is in begin
    s += "const l = new Fancy_router.Loader([{}],'{}');\n".format(
        names, map_name)

    s += "const home_loader = new Fancy_router.Loader([home], '%s', { next_loader: l });\n" % map_home

    names_l.insert(home_page[1], 'home')
    names = ','.join(names_l)
    s += 'home_loader.load();'

    s += "const r = new Fancy_router.Renderer(document.getElementById('main_container'), [{}], {});".format(
        names, '{home_value : %s }' % home_page[1])

    s += end
    return s

# css building


def css_checker(classes, ids, new_classes, new_ids):
    dupes_classes, dupes_ids = [], []
    for item in new_classes:
        if item in classes:
            dupes_classes.append(item)
    for item in new_ids:
        if item in ids:
            dupes_ids.append(item)
    return dupes_classes, dupes_ids


def get_classes(css):
    return list(map(lambda x: x[1:-1],  re_classes.findall(css)))


def get_ids(css):
    return list(map(lambda x: x[1:], re_ids.findall(css)))


def handle_css(folders, output):
    css, ids, classes = '', [], []

    for item, folde in zip(filter(lambda x: x != None, map(lambda x: x[3], folders)), folders):
        new_ids = get_ids(item)
        new_classes = get_classes(item)

        dupes_classes, dupes_ids = css_checker(
            classes, ids, new_classes, new_ids)
        if len(dupes_classes) > 0:
            raise Exception(
                'In "{}" | [CSS ERROR] class duplicate -> {}'.format(folde[5], dupes_classes))
        elif len(dupes_ids) > 0:
            raise Exception(
                'In "{}" | [CSS ERROR] id duplicate -> {}'.format(folde[5], dupes_ids))
        else:
            css += item
            ids += new_ids
            classes += new_classes

    with open(os.path.join(os.path.dirname(output), 'index.css'), 'w') as f:
        f.write(css)


# js building
def handle_js(folders, output, fold):
    js = ''
    # variables = []
    for item in filter(lambda x: x[4] != None, folders):
        # js += item[4] + build_export_string(item[4])
        js += build_js(item[4], os.path.join(item[6], js_name))
    return js


def build_home_map(page, filename):
    page[0]['init'] = build_js(page[0]['init'], os.path.join(page[6], js_name))
    d = {page[5]: page[0]}
    if page[4] != None:
        d['js'] = build_js(page[4], os.path.join(page[6], js_name))
    with open(filename, 'w') as f:
        json.dump(d, f, indent=4)


def compile_directory(folders, output, output_home):
    res = [do_one_page(folder) for folder in folders]
    res.sort(key=lambda x: x[1])  # sorting by order

    # handling home page
    try:
        home_page: tuple = list(filter(lambda x: x[2], res))[0]
    except:
        raise Exception('No homepage set')

    build_home_map(home_page, output_home)
    # css handling
    handle_css(res, output)  # css of homepage with the rest for now
    res.remove(home_page)

    js = handle_js(res, output, folders)
    d = {i[5]: i[0] for i in res}
    d['js'] = js

    with open(output, 'w') as f:
        json.dump(d, f, indent=4)
    return home_page, res
# add static directory for router and img


def init_build_directory():
    if os.path.exists('build'):
        shutil.rmtree('build')
    os.mkdir('build')
    shutil.copy('pages/index.js', 'build/')


string_import_replace = '<!-- |imports here| -->'
base_import_html = '<script src="{}"></script>'


def build_imports(imports):
    return '\n'.join([base_import_html.format(i) for i in imports])


def build_html(build_path, js):
    with open('build_tools/index.html', 'r') as f:
        content = f.read()
    with open('config.json', 'r') as f:
        t = json.load(f)
    imports = t['import']
    content = content.replace(loader_replace, js)
    content = content.replace(string_import_replace, build_imports(imports))

    with open(os.path.join(build_path, 'index.html'), 'w') as f:
        f.write(content)


def main(folderss=[], prefix=''):

    start_time = time.time()

    if folderss == []:
        folders = [os.path.join(content_directory, i)
                   for i in os.listdir(content_directory)]
    else:
        folders = [*folderss]

    build_directory = 'build'
    map_name = 'map.json'
    # js_name = 'index.js'
    map_home = 'home_map.json'

    init_build_directory()

    helper.try_rm_list(folders, 'pages/index.js')
    helper.try_rm_list(folders, 'pages/.DS_Store')

    map_filename = os.path.join(build_directory, map_name)
    map_home_name = os.path.join(build_directory, map_home)

    try:
        home_page, res = compile_directory(
            folders, map_filename, map_home_name)
        folders = [i[6] for i in res]
        loader = build_loader(home_page, folders, map_name, map_home)
        build_html(build_directory, loader)
    except Exception as e:
        end_time = time.time()
        print_error(prefix, ' [Error] :', e.__str__())
    else:
        end_time = time.time()
        print_success(prefix, ' Successful build | %0.2f s' %
                      (end_time-start_time))


if __name__ == "__main__":
    folders = [os.path.join(content_directory, i)
               for i in os.listdir(content_directory)]
    main(folders)
