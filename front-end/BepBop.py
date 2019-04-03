import sys
import watchdog
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import build
import os
import time
import helper
import json
import shutil

config_filename = 'config.json'


def init_settings():
    with open(config_filename, 'r') as f:
        js = json.load(f)
    js['last_page'] += 1
    with open(config_filename, 'w') as f:
        json.dump(js, f, indent=4)
    return js['last_page']


def new_page(page_name):
    folder = os.path.join('pages', page_name)
    os.mkdir(folder)
    open(os.path.join(folder, 'page.html'), 'a').close()
    open(os.path.join(folder, 'page.css'), 'a').close()
    open(os.path.join(folder, 'page.js'), 'a').close()
    new_id = init_settings()
    with open(os.path.join(folder, 'settings.json'), 'w') as f:
        json.dump({"order": new_id}, f)

def new_project(project_name):
    os.mkdir(project_name)



def start_server():
    print('starting development server...')
    print('starting first compile')
    build.main([], 'First build -> ')

    class build_handler(FileSystemEventHandler):
        def on_any_event(self, event):
            build.main([], helper.nice_date())

    observer = Observer()
    observer.schedule(build_handler(), path='pages', recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        print('Gracefully exiting')
        observer.stop()

    observer.join()


if __name__ == "__main__":
    a = sys.argv[1]
    if a == 'start':
        start_server()
    elif a == 'new_page':
        new_page(sys.argv[2])
    elif a == 'new_project':
        new_project(sys.argv[2])
