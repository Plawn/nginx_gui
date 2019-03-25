// App




const api_address = '/api'

const api = async (type, obj = {}) => {
    obj.type = type;
    const resp = await post(api_address, obj);
    return await resp.json();
};


const login = async () => {
    const pprompt = new custom_prompt();
    var success = false;
    while (!success) {
        const password = await pprompt.ask('Password', 'login');
        const resp = await post('/login', { password: password, login: 'admin' });
        const data = await resp.json();
        if (!data.error) {
            pprompt.close();
            success = true;
        }
        else { pprompt.say('wrong password', true); }

    }
};


/**
 * Get the list of all domains
 * @requires being-logged
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
const get_subapps_from_domain = async domain_name => {
    return await api('get_apps_from_domain', { domain_name: domain_name });
}

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

const _add_application = async domain => {
    // display empty form with a select
};

const _add_app = async application => { };

/**
 * send the request to build the nginx files
 * @returns Object<String, bool>
 */
const build_nginx = async () => await api('build_nginx');

/**
 * apply the settings on the server
 */
const apply_settings = async () => await api('apply_settings');

/**
 * 
 * @param {Map<String, String>} app 
 */
const update_app = async app => await api('update_app', app);

// make ui
const add_upstream = async upstream => await api('add_upstream', upstream);


const restart_nginx = async () => await api('restart_nginx');

// beginning of routines

const app = document.getElementById('root');

const build_bottom_app_update = () => {
    const b = document.createElement('input');
    const d = document.createElement('div');
    b.type = 'button';
    b.value = 'Apply';
    b.onclick = async () => {
        const res = await apply_settings();
        if (res.error != false) {
            d.innerHTML = 'Error applying changes';
        } else { d.innerHTML = 'Successfully applied'; }
    }
    const p = document.createElement('p');
    p.innerHTML = 'Success';
    d.appendChild(p);
    d.appendChild(b);
    return d;
}


const load_domains_name = async () => {
    const domains_name = await get_domains();
    const d = document.createElement('div');
    const domains = [];
    await domains_name.asyncForEach(async (domain, i) => {
        const apps = await get_subapps_from_domain(domain);
        const l_apps = {};
        await apps.asyncForEach(async app_name => {
            const res = await get_subapp_from_domain(domain, app_name);
            l_apps[app_name] = new App(res.name, res.ext_route, res.in_route, res.upstream, res.type, async app => {
                const res = await update_app(app.form.toJSON());
                if (res.error != false) {
                    app.prompt.say(res.error);
                } else {
                    app.prompt.p.innerHTML = '';
                    app.prompt.p.appendChild(build_bottom_app_update());
                }
            });
        });
        const dl = new Domain(domain, l_apps);
        domains.push({ order: i, domain: dl }); // order is i for now will be corrected later 
        domains.sort(sort_objects_by('order'));
    });

    domains.forEach(domain => d.appendChild(domain.domain.render()));
    app.innerHTML = '';
    app.appendChild(d);
}

// init the app
(async () => {

    await login();
    await load_domains_name();

})();