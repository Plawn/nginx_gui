const print = (...args) => console.log(...args); // aliasing console.log


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


    render() { }
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
    // style = 'test';
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

class Displayer {
    constructor() { }


    render() { }
}
const make_className  = (...names) => names.join(' ');


const make_overlay = (div_elem, open_elem, close_elem) => {
    div_elem.className = make_className(div_elem.className, 'modal');
    open_elem.onclick = function () {
        div_elem.style.display = 'block';
    }
    close_elem.onclick = function () {
        div_elem.style.display = 'none';
    }
    window.onclick = function (event) {
        if (event.target == div_elem) {
            div_elem.style.display = 'none';
        }
    }
}

const m = document.getElementById('myModal');
const o = document.getElementById('open_btn');
const c = document.getElementById('close_btn');
make_overlay(m, o, c);

const h = document.getElementById('app');
const apps = {
    AVTO: new App('AVTO', 'AVTO', ':8080/APP_INFO'),
    AVTO2: new App('AVTO2', 'AVTO2', ':8080/APP_INFO2'),
}
h.appendChild(new Domain('home.plawn-inc.science', apps).render());
