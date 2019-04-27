// App

const api_address = '../api';

let applications = [];
let domains = [];


const api = async (type, obj = {}) => {
    obj.type = type;
    const resp = await post(api_address, obj);
    return await resp.json();
};


const login = async () => {
    const pprompt = new custom_prompt();
    let success = false;
    while (!success) {
        const password = await pprompt.ask('Password', 'login');
        const resp = await post('../login', { password: password, login: 'admin' });
        const js = await resp.json();
        if (!js.error) {
            pprompt.close();
            success = true;
        }
        else { pprompt.say('wrong password', true); }
    }
};


/**
 * Get the list of all domains
 * @returns {Array<string>}
 */
const get_domains = async () => await api('get_domains');

/**
 * Get the list of all Applications
 * @requires being-logged
 * @retuns Array[String]
 */
const get_applications = async () => await api('get_applications');


/**
 * @requires being-logged
 * @param {String} domain_name
 * @param {String} app_name
 */
const get_subapp_from_domain = async (domain_name, app_name) => await api('get_subapp_from_domain', { domain_name: domain_name, app_name: app_name });


/**
 * @requires being-logged
 * @param {String} domain_name
 */
const get_subapps_from_domain = async domain_name => await api('get_apps_from_domain', { domain_name: domain_name });

const _get_applications = async () => applications = await get_applications();



const _build_nginx = async () => {
    const res = await build_nginx();
    if (res.error) say('error');
    else say('Success');
};


const _restart_nginx = async () => {
    const res = await restart_nginx();
    if (res.error) say('error');
    else say('Success');
}


const _add_upstream = async () => {
    const f = new Form();
    const name = new Input(null, { name: 'name', placeholder: 'name' });
    const path = new Input(null, { name: 'path', placeholder: 'path' });
    const port = new Input(null, { name: 'port', placeholder: 'port' });

    f.add_input(name, path, port);

    const p = new multi_prompt('New Upstream', f);
    f.send_func = async () => {
        const res = await add_upstream(f.toJSON());
        if (!res.error) {
            p.say('Success');
        } else { p.say(res.error); }
    };
    p.open();
};


const make_sub_app = obj => {
    const res = {};
    res.app_name = obj.app_name;
    res.sub_apps = JSON.stringify([{
        name: obj.app_name,
        ext_url: obj.ext_url,
        in_url: obj.in_url,
        type: obj.type,
        domain: obj.domain_name
    }]);
    return res;
};


const add_application = async app => {
    return await api('add_application', app);
};


const _add_application = async () => {


    const form = new Form();
    const l_domains = domains.map(domain => domain.domain.server_name);
    const domain_name = new Select(l_domains, { name: 'domain_name' });

    const application_name = new Input(null, { label: 'Application name', name: 'application_name', placeholder: 'app_name' });
    const app_name = new Input(null, { name: 'app_name', placeholder: 'Name' });
    const ext_url = new Input(null, { name: 'ext_url', placeholder: 'ext_url' });
    const in_url = new Input(null, { name: 'in_url', placeholder: 'in_url' })
    const type = new Select(['https', 'http', 'ws'], { name: 'type' })

    form.add_input(application_name, domain_name, app_name, ext_url, in_url, type);
    const l_prompt = new multi_prompt('New application', form);
    l_prompt.open();
    form.send_func = async () => {
        const sub_app = make_sub_app(form.toJSON());
        print(sub_app);
        const res = await add_application(sub_app);
        if (!res.error) {
            l_prompt.close();
            say('success');
            load_domains_name();
        } else {
            l_prompt.say(res.error);
        }
        // res = await _add_application();
    };
};


/**
 * send the request to build the nginx files
 */
const build_nginx = async () => await api('build_nginx');


/**
 * apply the settings on the server
 */
const apply_settings = async () => await api('apply_settings');


const get_upstreams = async () => await api('get_upstreams');

/**
 * 
 * @param {Map<String, String>} app 
 */
const update_app = async app => await api('update_app', app);

// make ui
const add_upstream = async upstream => await api('add_upstream', upstream);


const restart_nginx = async () => await api('restart_nginx');


const get_all_subapps_from_domain = async domain_name => await api('get_all_subapps_from_domain', { domain_name: domain_name });


// beginning of routines

// const app = document.getElementById('root'); // defined in the init.js

const build_bottom_app_update = () => {
    const l_input = document.createElement('input');
    const d = document.createElement('div');
    l_input.type = 'button';
    l_input.value = 'Apply';
    l_input.onclick = async () => {
        const res = await apply_settings();
        if (res.error != false) { d.innerHTML = 'Error applying changes'; }
        else {
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


const logout = async () => {
    const res = await fetch('/logout');
    return await res.json();
};


const _logout = async () => {
    const res = await logout();
    if (res.error) { say('failed to logout'); }
    else { document.body.innerHTML = ''; say('logged out'); }
}


const add_app = async app => await api('add_app', app);


const _add_app = async () => {
    // make prompt with select filled with already existing applications
    const f = new Form();
    const _applications = new Select(applications, { name: 'application_name', label: 'Parent application' });
    const app_name = new Input(null, { name: 'app_name', placeholder: 'App name' });
    const ext_url = new Input(null, { name: 'ext_url', placeholder: 'External URL' });
    const in_url = new Input(null, { name: 'in_url', placeholder: 'Internal URL' });
    const type = new Select(['https', 'http', 'ws'], { name: 'protocol' });
    const l_domains = domains.map(domain => domain.domain.server_name);
    const domain_name = new Select(l_domains, { name: 'domain_name' });

    f.add_input(_applications, app_name, ext_url, in_url, type, domain_name);
    const pprompt = new multi_prompt('New redirection', f);
    pprompt.open();
    f.send_func = async () => {
        const t = await add_app(f.toJSON());
        if (t.error === false) {
            pprompt.say('success');
            load_domains_name();
        } else {
            pprompt.say(t.error);
        }
    };
};


const load_domains_name = async () => {
    domains = [];
    const domains_name = await get_domains();
    const d = document.createElement('div');
    const upstreams_name = await get_upstreams();
    await domains_name.asyncForEach(async (domain, i) => {
        const apps = await get_all_subapps_from_domain(domain);
        const l_apps = {};

        await apps.asyncForEach(async app => {
            l_apps[app.name] = new App(app.name, app.ext_route, app.in_route,
                app.upstream, app.type, upstreams_name, domains_name, app.parent, async app => {
                    // set the update app function
                    const res = await update_app(app.form.toJSON());
                    if (res.error !== false) {
                        app.prompt.say(res.error);
                    } else {
                        app.prompt.p.innerHTML = '';
                        app.prompt.p.appendChild(build_bottom_app_update());
                    }
                });
        });
        const dl = new Domain(domain, l_apps);

        domains.push({ order: i, domain: dl }); // order is i for now will be corrected later 

    });
    domains.sort(sort_objects_by('order'));
    domains.forEach(domain => d.appendChild(domain.domain.render()));

    // applications = [];

    app.innerHTML = '';
    app.appendChild(d);
}

// init the app
(async () => {

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
    applications
];