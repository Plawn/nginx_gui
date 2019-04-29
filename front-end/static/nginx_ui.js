const dived_p = (text, className = null) => {
    const d = document.createElement('div');
    const t = document.createElement('p');
    t.innerHTML = text;
    if (className !== null) d.className = className;
    d.appendChild(t);
    return d;
};

const make_app_btn = func => {
    const d = document.createElement('div');
    const b = document.createElement('input');
    d.className = 'app_b';
    b.type = 'button';
    b.value = 'modify';
    b.onclick = func;
    d.appendChild(b);
    return d;
};

class Upstream {
    constructor() { }

    prepare_to_send() {

    }

    render() {

    }
}

class Domain {
    constructor(server_name, apps = {}) {
        this.server_name = server_name;
        this.apps = apps;
        this.table = null;
        this.displayed = false;
        for (const app in apps) {
            try {
                apps[app].domain = this;
                apps[app].old_domain = this.server_name;
            } catch{ }
        }
    }

    toggle_view() {
        if (this.displayed) { this.hide(); }
        else { this.show(); }
    }

    show() {
        this.table.hidden = false;
        this.displayed = true;
    }

    hide() {
        this.table.hidden = true;
        this.displayed = false;
    }
    render() {
        const d = document.createElement('div');
        const b = document.createElement('input');
        b.type = 'button';
        b.value = '+';
        b.onclick = () => this.toggle_view();
        d.appendChild(b);
        d.appendChild(dived_p(this.server_name, 'app_p'));
        this.table = document.createElement('table');
        for (const app in this.apps) {
            try { this.apps[app].render(this.table.insertRow()); } catch{ }
        }
        d.appendChild(this.table);
        this.hide();
        return d;
    }
}

class App {
    constructor(app_name, ext_url, in_url, upstream, type, upstreams_name, domains_name, parent, onclick = () => { }) {
        this.domain = null;
        this.old_domain = null;
        this.old_name = app_name;
        this.name = app_name;
        this.in_url = in_url;
        this.ext_url = ext_url;
        this.upstream = upstream;
        this.type = type;
        this.form = null;
        this.prompt = null;
        this.parent = parent;

        this.onclick = () => {
            const a = new Select(domains_name, { name: 'domain', label: 'Domain', value: this.domain.server_name }); // make a select next time
            const b = new Input(null, { name: 'name', label: 'Name', value: this.name });
            const c = new Input(null, { name: 'ext_url', label: 'External URL', value: this.ext_url });
            const d = new Input(null, { name: 'in_url', label: 'Internal URL', value: this.in_url });
            const d2 = new Select(['https', 'http', 'ws'], { name: '_type' });
            const e = new Select([...upstreams_name, ''], { name: 'upstream_name', label: 'Upstream', value: this.upstream });
            this.form = new Form(null, { button_text: 'Update' });
            this.form.send_func = () => onclick(this);
            this.form.add_input(a, b, c, d, d2, e);
            this.prompt = new multi_prompt('Application : ' + this.parent, this.form);
            this.prompt.open();
            e.set_value(upstream);
            d2.set_value(this.type);
            a.set_value(this.domain.server_name);
        };
    }
    set_domain(domain) { this.domain = domain; }

    render(row) {
        const d = document.createElement('div');
        d.className = 'app_div';
        const title = dived_p(this.name);
        const ext_url = dived_p(this.ext_url);
        const in_url = dived_p(this.in_url);
        const parent = dived_p(this.parent);
        const d2 = make_app_btn(() => this.onclick());
        [parent, title, ext_url, in_url, d2].forEach(e => {
            const cell = row.insertCell();
            cell.appendChild(e);
        });
        return row;
    }
}


class Application {
    constructor() {

    }

    render() {

    }

}