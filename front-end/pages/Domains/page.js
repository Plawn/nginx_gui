// App
import './api.js';

let applications = [];
let domains = {};
let upstreams = [];

const login = async() => {
    const res = await fetch('is_logged');
    const js = await res.json();
    if (js.error === true) return;
    const pprompt = new custom_prompt();
    let success = false;
    while (!success) {
        const password = await pprompt.ask('Password', 'login');
        const resp = await post('login', { password: password, login: 'admin' });
        const js = await resp.json();
        if (!js.error) {
            pprompt.close();
            success = true;
        } else { pprompt.say('wrong password', true); }
    }
};

const _add_header = async(parent, app_name) => {
    const f = new Form();
    const name = new Input(null, { name: 'name', placeholder: 'name' });
    const value = new Input(null, { name: 'value', placeholder: 'value' });

    f.add_input(name, value);

    const p = new multi_prompt('New Header', f);
    f.send_func = async() => {
        const obj = f.toJSON();
        obj.application_name = parent;
        obj.app_name = app_name;
        const res = await add_header(obj);
        if (!res.error) {
            p.say('Success');
            upstreams = await load_domains_name();
        } else { p.say(res.error); }
    };
    p.open();
};



const _build_nginx = async() => {
    const res = await build_nginx();
    if (res.error) say('error');
    else say('Success');
};


const _restart_nginx = async() => {
    const res = await restart_nginx();
    if (res.error) say('error');
    else say('Success');
}


const _add_upstream = async() => {
    const f = new Form();
    const name = new Input(null, { name: 'name', placeholder: 'name' });
    const path = new Input(null, { name: 'ext_path', placeholder: 'External path' });
    const port = new Input(null, { name: 'in_path', placeholder: 'Internal path' });

    f.add_input(name, path, port);

    const p = new multi_prompt('New Upstream', f);
    f.send_func = async() => {
        const res = await add_upstream(f.toJSON());
        if (!res.error) {
            p.say('Success');
            upstreams = await get_upstreams();
        } else { p.say(res.error); }
    };
    p.open();
};


const make_sub_app = obj => {
    const res = {};
    if (obj.type == 'ws') { obj.in_url = 'placeholder'; }
    res.application_name = obj.application_name;
    res.sub_apps = JSON.stringify([{
        name: obj.app_name,
        ext_url: obj.ext_url,
        in_url: obj.in_url,
        type: obj.type,
        domain: obj.domain_name,
        upstream: obj.upstream
    }]);
    return res;
};




const _add_application = async() => {

    const form = new Form();
    const l_domains = Object.keys(domains).map(domain => domains[domain].domain.server_name);
    const domain_name = new Select(l_domains, { name: 'domain_name' });

    const application_name = new Input(null, { label: 'Application name', name: 'application_name', placeholder: 'app_name' });
    const app_name = new Input(null, { name: 'app_name', placeholder: 'Name' });
    const ext_url = new Input(null, { name: 'ext_url', placeholder: 'ext_url' });
    const in_url = new Input(null, { name: 'in_url', placeholder: 'in_url' });
    const type = new Select(['https', 'http', 'ws'], { name: 'type' });
    const select_upstream = new Select(['', ...upstreams], { name: 'upstream' });

    form.add_input(application_name, domain_name, app_name, ext_url, in_url, type, select_upstream);
    const l_prompt = new multi_prompt('New application', form);
    l_prompt.open();
    form.send_func = async() => {
        const sub_app = make_sub_app(form.toJSON());
        print(sub_app);
        const res = await add_application(sub_app);
        if (!res.error) {
            l_prompt.close();
            say('success');
            _get_applications();
        } else {
            l_prompt.say(res.error);
        }
        // res = await _add_application();
    };
};


const _add_domain = () => {
    const form = new Form();
    const domain_name = new Input(null, { name: 'domain_name', label: 'Name', placeholder: 'domain name' });

    const listening_port = new Input(null, { name: 'listening_port', placeholder: 'listening port' });
    const protocol = new Select(['https', 'http', 'ws'], { name: 'protocol', placeholder: 'protocol' });
    const using_ssl = new Select(['on', 'off'], { name: 'using_ssl' });
    const ssl_fullchain = new Input(null, { name: 'ssl_fullchain', label: 'fullchain' });
    const ssl_privkey = new Input(null, { name: 'ssl_privkey', label: 'privkey' });


    form.add_input(domain_name, listening_port, protocol, using_ssl, ssl_fullchain, ssl_privkey);
    const l_prompt = new multi_prompt('New domain', form);
    l_prompt.open();
    form.send_func = async() => {
        const domain = form.toJSON();
        domain.using_ssl = domain.using_ssl == 'on';
        const res = await add_domain(domain);
        if (!res.error) {
            l_prompt.close();
            say('Success');
            load_domains_name();
        } else {
            l_prompt.say(res.error);
        }
    }
}



// beginning of routines

// const app = document.getElementById('root'); // defined in the init.js

const build_bottom_app_update = () => {
    const l_input = document.createElement('input');
    const d = document.createElement('div');
    l_input.type = 'button';
    l_input.value = 'Apply';
    l_input.onclick = async() => {
        const res = await apply_settings();
        if (res.error != false) { d.innerHTML = 'Error applying changes'; } else {
            d.innerHTML = 'Successfully applied';
            load_domains_name();
        }
    }
    const p = document.createElement('p');
    p.innerHTML = 'Success';
    d.appendChild(p);
    d.appendChild(l_input);
    return d;
}


const logout = async() => {
    const res = await fetch('logout');
    return await res.json();
};


const _logout = async() => {
    const res = await logout();
    if (res.error) { say('failed to logout'); } else {
        document.body.innerHTML = '';
        say('logged out');
    }
}

const _add_app = async() => {
    // make prompt with select filled with already existing applications
    const f = new Form();
    const _applications = new Select(applications, { name: 'application_name', label: 'Parent application' });
    const app_name = new Input(null, { name: 'app_name', placeholder: 'App name' });
    const ext_url = new Input(null, { name: 'ext_url', placeholder: 'External URL' });
    const in_url = new Input(null, { name: 'in_url', placeholder: 'Internal URL' });
    const type = new Select(['https', 'http', 'ws'], { name: 'protocol', label: 'Type' });
    const upstream_name = new Select(['', ...upstreams], { name: 'upstream', label: 'Upstream' });
    const l_domains = Object.keys(domains).map(domain => domains[domain].domain.server_name);
    const domain_name = new Select(l_domains, { name: 'domain_name', label: 'Domain' });

    f.add_input(_applications, app_name, ext_url, in_url, type, domain_name, upstream_name);
    const pprompt = new multi_prompt('New redirection', f);
    pprompt.open();
    f.send_func = async() => {
        const l_obj = f.toJSON();
        if (l_obj.protocol == 'ws') { l_obj.in_url = 'placeholder'; }
        const t = await add_app(l_obj);
        if (t.error === false) {
            pprompt.say('success');
            load_domains_name();
        } else {
            pprompt.say(t.error);
        }
    };
};

const _update_app = async app => {
    // set the update app function
    const obj = app.form.toJSON();
    obj.old_domain = app.old_domain;
    obj.parent = app.parent;
    obj.old_name = app.old_name;
    if (obj.protocol == 'ws') { obj.in_url = 'placeholder'; }
    const res = await update_app(obj);
    if (res.error !== false) {
        app.prompt.say(res.error);
    } else {
        app.prompt.p.innerHTML = '';
        app.prompt.p.appendChild(build_bottom_app_update());
        load_domains_name();
    }
}

// ('old_name', 'new_name', 'app_name', 'application_name')
const make_header_buttons = async(app, header_name, header_value) => {
    const div = document.createElement('div');
    [
        ['update', () => {
            const f = new Form();
            const i1 = new Input(null, { name: 'new_name', label: 'Name', value: header_name });
            const i2 = new Input(null, { name: 'value', label: 'Value', value: header_value });
            f.add_input(i1, i2);
            const pprompt = new multi_prompt('Update header', f);
            f.send_func = async() => {
                const obj = f.toJSON();
                obj.old_name = header_name;
                obj.app_name = app.name;
                obj.application_name = app.parent;
                const js = await update_header(obj);
                if (js.error !== false) {
                    pprompt.say(js.error);
                } else {
                    pprompt.say('Success');
                    header_name = obj.new_name;
                    await load_domains_name();
                    app.prompt.close();
                    pprompt.close();
                    app.other_prompt.close();
                    const reloaded = domains[app.domain.server_name].domain.apps[app.parent];
                    await reloaded.onclick();
                    reloaded.bt.onclick();
                    // update parent table
                }

            };
            pprompt.open();
        }],
        ['delete', () => {

        }]
    ].forEach(sub => {
        const bt = document.createElement('input');
        bt.type = 'button';
        bt.value = sub[0];
        bt.onclick = sub[1];
        div.appendChild(bt);
    });
    return div;
};

const make_p = data => {
    const p = document.createElement('p');
    p.innerHTML = data;
    return p;
}


const prepare_header_div = async app => {
    const div = document.createElement('div');
    const bt = document.createElement('input');
    div.style.marginBottom = '1em';
    div.style.marginTop = '1em';
    bt.type = 'button';
    bt.value = 'headers';

    const d = await Promise.all(Object.keys(app.headers).map(async header => [
        make_p(app.headers[header].name),
        make_p(app.headers[header].value),
        await make_header_buttons(app, app.headers[header].name, app.headers[header].value)
    ]));
    app.d = d;
    const table = prepare_table(['Name', 'Value', 'Actions'], d, { className: 'header_table', is_node: true });
    const next_div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.innerHTML = 'HTTP headers';
    next_div.appendChild(h3);
    next_div.appendChild(table);

    bt.onclick = () => {
        const [close, open] = say(next_div, true, false);
        app.other_prompt = { close: close, open: open };
        open();
    };
    app.bt = bt;
    [bt].forEach(e => div.appendChild(e));
    return new Div(div);
};




const load_domains_name = async() => {
    domains = {};
    const domains_name = await get_domains();
    const d = document.createElement('div');
    const upstreams_name = await get_upstreams();
    upstreams = upstreams_name;
    await domains_name.asyncForEach(async(domain, i) => {
        const apps = await get_all_subapps_from_domain(domain);
        const l_apps = {};

        await apps.asyncForEach(async app => {
            l_apps[app.ext_route] = new App(app.name, app.ext_route, app.in_route,
                app.upstream, app.type, upstreams_name, domains_name, app.parent,
                app.headers, app.is_transparent, _update_app, prepare_header_div);
        });
        const dl = new Domain(domain, l_apps);
        domains[domain] = { order: i, domain: dl }; // order is i for now will be corrected later 

    });
    // domains.sort(sort_objects_by('order'));
    // domains.forEach(domain => d.appendChild(domain.domain.render()));
    Object.keys(domains).forEach(domain_name => d.appendChild(domains[domain_name].domain.render()));

    app.innerHTML = '';
    app.appendChild(d);
}

// init the app
(async() => {

    await login();
    await load_domains_name();
    await _get_applications();
    print('applications loaded');
    print(applications);

})();

export default [_get_applications,
    _add_application,
    _add_upstream,
    _build_nginx,
    _restart_nginx,
    _logout,
    _add_app,
    _add_domain,
    applications,
    get_applications
];