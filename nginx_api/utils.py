import os
import Fancy_term as term

def correct_route(route:str):
    """route: str"""
    if len(route) < 1:
        raise Exception('incorrect route')
    if route[0] == '/':
        route = route[1:]
    if route[-1] == '/':
        route = route[:-1]
    return route


def ls(directory='.', only_ext=None):
    result = map(lambda x: os.path.join(directory, x), os.listdir(directory))
    return filter(lambda x: x[-len(only_ext):] == only_ext, result) if only_ext != None else result

warn_style = term.Style(color=term.colors.red, substyle=[term.substyles.bold])
prefix = '[' + term.colored_string(warn_style, 'X') + '] '
warn = term.Smart_print(term.Style(), prefix=prefix)

success_style = term.Style(color=term.colors.green,
                           substyle=[term.substyles.bold])
prefix = '[' + term.colored_string(success_style, '#') + '] '
success = term.Smart_print(term.Style(), prefix=prefix)