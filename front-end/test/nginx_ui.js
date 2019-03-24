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
            this.apps[app].render(this.table.insertRow());
        }
        d.appendChild(this.table);
        this.hide();
        return d;
    }
}

class App {
    constructor(app_name, ext_url, in_url, upstream) {
        this.domain = null;
        this.name = app_name;
        this.in_url = in_url;
        this.ext_url = ext_url;
        this.upstream = upstream;
        this.onclick = () => { };
    }
    set_domain(domain) { this.domain = domain; }

    render(row) {
        const d = document.createElement('div');
        d.className = 'app_div';
        d.onclick = this.onclick;
        const title = dived_p(this.name);
        const ext_url = dived_p(this.ext_url);
        const in_url = dived_p(this.in_url);
        const d2 = make_app_btn(() => { });
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