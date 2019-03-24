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
            try { apps[app].domain = this; } catch{ }
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
    constructor(app_name, ext_url, in_url, upstream, type, onclick = () => { }) {
        this.domain = null;
        this.name = app_name;
        this.in_url = in_url;
        this.ext_url = ext_url;
        this.upstream = upstream;
        this.type = type;
        this.form = null;
        this.onclick = () => {
            const a = new Input(null, { label: 'Domain', value: this.domain.server_name });
            const b = new Input(null, { label: 'Name', value: this.name });
            const c = new Input(null, { label: 'External URL', value: this.ext_url });
            const d = new Input(null, { label: 'Internal URL', value: this.in_url });
            this.form = new Form(null);
            form.send_func = onclick;
            form.add_input(a, b, c, d);
            const m = new multi_prompt(this.name, form);
            m.open();
        };
    }
    set_domain(domain) { this.domain = domain; }

    render(row) {
        const d = document.createElement('div');
        d.className = 'app_div';
        const title = dived_p(this.name);
        const ext_url = dived_p(this.ext_url);
        const in_url = dived_p(this.in_url);
        const d2 = make_app_btn(() => this.onclick());
        [title, ext_url, in_url, d2].forEach(e => {
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