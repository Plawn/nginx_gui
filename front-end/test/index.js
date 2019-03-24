// App

const api = async (type, obj = {}) => {
    obj.type = type;
    const resp = await post('/api', obj);
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

/**
 * send the request to build the nginx files
 * @returns Object<String, bool>
 */
const build_nginx = async () => await api('build_nginx');

/**
 * apply the settings on the server
 */
const apply_settings = async () => await api('apply_settings');

// make ui
const update_app = async app => {
    // prepare app object for transmission
    // send it
};
// make ui
const add_upstream = async upstream => {
    // prepare upstream object for transmission
    // send it
};



// beginning of routines

const app = document.getElementById('root');



const yeb = () => {
    const a = new Input(null, {label:'test'});
    const b = new Input(null, {label:'test2'});
    const d = document.createElement('div');
    const f = new Form(d);
    f.add_input(a, b)
    const p = new multi_prompt('test', f);
    p.open();
    print(p.open);
}


// init the app
(async () => {

    await login();
    const domains_name = await get_domains();
    const d = document.createElement('div');
    const domains = [];
    await domains_name.asyncForEach(async (domain, i) => {
        const apps = await get_subapps_from_domain(domain);
        const l_apps = {};
        await apps.asyncForEach(async app => {
            const res = await get_subapp_from_domain(domain, app);
            l_apps[app] = new App(res.name, res.ext_route, res.in_route, res.upstream, res.type);
        });
        const dl = new Domain(domain, l_apps);
        domains.push({ order: i, domain: dl }); // order is i for now will be corrected later 
        domains.sort(sort_by('order'));
    });
    domains.forEach(domain => d.appendChild(domain.domain.render()));
    app.appendChild(d);


})();