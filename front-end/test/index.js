const print = (...args) => console.log(...args);

const make_body = obj => {
    const fd = new FormData();
    for (const key in obj) fd.append(key, obj[key]);
    return fd;
}


const post = (addr, body) => {
    return fetch(addr, {
        method: 'POST',
        body: make_body(body)
    });
};

const api = async (type, obj = {}) => {
    obj.type = type;
    const resp = await post('/api', obj);
    return await resp.json();
};

const make_overlay = (div_elem, no_close = false, open_elem = null) => {

    const base_container = document.createElement('div');
    base_container.className = 'modal';

    const content_container = document.createElement('div');
    content_container.className = 'modal-content';

    if (!no_close) {
        const close_elem = document.createElement('span');
        close_elem.className = 'close';
        close_elem.innerHTML = '&times;';
        content_container.appendChild(close_elem);
        close_elem.onclick = function () { close_func(); }
    }

    content_container.appendChild(div_elem);
    base_container.appendChild(content_container);

    const close_func = () => { base_container.style.display = 'none'; }
    const open_func = () => { base_container.style.display = 'block'; }
    if (open_elem) open_elem.onclick = function () { open_func(); };


    // window.onclick = function (event) { if (event.target == div_elem) { base_container.style.display = 'none'; } }

    document.body.appendChild(base_container);
    return [close_func, open_func];
}


class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.reject = reject;
            this.resolve = resolve;
        })
    }
}


class custom_prompt {
    constructor(text = '', button_text = '') {
        this.text = text;
        this.button_text = button_text;
        this.prepare();
    }

    ask(text, button_text) {
        // handle changes for re usability
        if (text != this.text) {
            this.p.innerHTML = text;
            this.text = text;
        }
        if (button_text != this.button_text) {
            this.bt.value = button_text;
            this.button_text = button_text;
        }


        const def = new Deferred();
        document.addEventListener('keypress', (event) => {
            if (event.key == 'Enter') {
                def.resolve(this.input.value);
            }
        });
        this.bt.onclick = () => {
            def.resolve(this.input.value);
        }
        this.open_func();
        return def.promise;

    }
    say(string, should_shake = false) {
        this.sayer.innerHTML = string;
        if (should_shake) { // css for this is located in test/index.css
            this.sayer.className = 'shaker';
            setTimeout(() => this.sayer.className = '', 800);
        }
    }
    close() {
        this.close_func();
    }

    display_img(img_path) { }

    prepare() {
        const d = document.createElement('div');
        this.input = document.createElement('input');
        this.input.type = 'password';

        this.bt = document.createElement('input');
        this.bt.type = 'button';
        this.bt.value = this.button_text;
        this.p = document.createElement('p');
        this.p.innerHTML = this.text;

        this.sayer = document.createElement('p');


        [this.p, this.input, this.bt, this.sayer].forEach(e => d.appendChild(e));
        const [close_func, open_func] = make_overlay(d, true);
        this.close_func = close_func;
        this.open_func = open_func;

    }
}


const login = async () => {
    const pprompt = new custom_prompt();
    var success = false;
    while (!success) {
        const password = await pprompt.ask('password', 'login');
        const resp = await post('/login', { password: password, login: 'admin' });
        const data = await resp.json();
        if (!data.error) {
            pprompt.close();
            success = true;
        }
        else { pprompt.say('wrong password', true); }

    }
};


// working => need to display the data now
const get_domains = async () => {
    return await api('get_domains');
};


const get_applications = async () => {
    return await api('get_applications');
};

const get_subapp_from_domain = async (domain_name, app_name) => {
    return await api('get_subapp_from_domain', { domain_name: domain_name, app_name: app_name });
};

const get_apps_from_domain = async domain_name => {
    return await api('get_apps_from_domain', { domain_name: domain_name });
}

/**
 * send the request to build the nginx files
 * @returns Object<String, bool>
 */
const build_nginx = async () => await api('build_nginx');


const update_app = async app => {
    // prepare app object for transmission
    // send it
};

const add_upstream = async upstream => {
    // prepare upstream object for transmission
    // send it
};


/**
 * apply the settings on the server
 */
const apply_settings = async () => {
    const resp = await api('apply_settings');
    return resp;
};



// const h = document.getElementById('app');
// const apps = {
//     AVTO: new App('AVTO', 'AVTO', ':8080/APP_INFO'),
//     AVTO2: new App('AVTO2', 'AVTO2', ':8080/APP_INFO2'),
// }
// h.appendChild(new Domain('home.plawn-inc.science', apps).render());

const app = document.getElementById('root');

// init the app
(async () => {
    await login();
    print('logged');
    const domains_name = await get_domains();
    const d = document.createElement('div');
    const domains = {};
    await Promise.all(domains_name.map(async domain => {
        const apps = await get_apps_from_domain(domain);
        const l_apps = {};
        await Promise.all(apps.map(async app => {
            const res = await get_subapp_from_domain(domain, app);
            print(res);
            l_apps[app] = new App(res.name, res.ext_route, res.in_route, res.upstream, res.type);
        }));
        print(l_apps);
        const dl = new Domain(domain, l_apps);
        domains[domain] = dl;
        d.appendChild(dl.render());
    }));
    app.appendChild(d);
    print(await apply_settings());
})();


// const h = document.getElementById('app');
// h.appendChild(new Domain('home.plawn-inc.science', apps).render());