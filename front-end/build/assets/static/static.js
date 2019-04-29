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
// Writter Plawn
// v 0.6
// github => plawn


Object.prototype.forEach = function (func) { //func can take value and/or key
    const t = this;
    Object.keys(t).forEach(key => func(t[key], key));
}

const count = (string, to_find) => (string.match(new RegExp(to_find, "g")) || []).length;
const makeRGB = (red, green, blue) => 'rgb(' + red + ', ' + green + ',' + blue + ')';

class Form {
    constructor(render_div, settings = {}) {
        this.inputs = [];
        this.render_div = render_div;


        this.send_func = settings.send_func || (() => { });
        this.button_text = settings.button_text || 'Send';
        this.button_classname = settings.classname || '';
        this.submit = settings.submit || false;
        this.on_err_func = settings.on_err_func || (res => console.log('not validated because =>', res.errors));
        this.button = null;
    }

    set_end_function(func) { this.send_func = func; }

    reset() { this.inputs = []; this.render_div.innerHTML = ''; }
    reset_container() { this.render_div.innerHTML = ''; }

    add_input(...input) { input.forEach(e => this.inputs.push(e)); }

    toForm() {
        const fd = new FormData();
        this.inputs.forEach(e => fd.append(e.name(), e.value()));
        return fd;
    }

    toJSON() {
        const res = {};
        this.inputs.forEach(e => res[e.name()] = e.value());
        return res;
    }

    render() {
        const d = document.createElement('div');
        if (this.render_div)this.reset_container();
        const f = document.createElement('form');
        this.inputs.forEach(input => f.appendChild(input.render()));
        d.appendChild(f);
        this.button = document.createElement('input');
        this.button.value = this.button_text;
        this.button.className = this.button_classname;
        if (!this.submit) {
            this.button.type = 'button';
            this.button.onclick = () => {
                const res = this.check();
                if (res.ok) this.send_func();
                else this.on_err_func(res);
            }
        } else {
            this.button.type = 'submit';
        }
        d.appendChild(this.button);
        if (this.render_div) this.render_div.appendChild(d);
        return d;
    }

    load_from_JSON(obj, settings = { labelize: k => k }) {
        obj.forEach((elem, k) => this.add_input(new Input(k, { name: k, value: elem, label: settings.label ? settings.labelize(k) : undefined })));
    }

    add_checker_to_subtype(checker, subtype) {
        this.inputs.forEach(input => { if (input.sub_type == subtype) input.add_checker(checker); });
    }

    _get_single(name) {
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].name() == name) return this.inputs[i];
        }
        throw new Error('not found');
    }
    _get_multiple(names) {
        const res = {};
        for (let i = 0; i < this.inputs.length; i++) {
            const n = this.inputs[i].name();
            if (names.includes(n)) {
                res[n] = this.inputs[i];
                names.splice(names.indexOf(n), 1);
            }
        }
        return res;
    }

    get_named(arr) {
        if (typeof (arr) == 'string') return this._get_single(arr);
        else return this._get_multiple(arr);
    }

    add_after(input, index) {
        this.inputs.splice(index, 0, input);
    }

    check() {
        const errors = [];
        this.inputs.forEach(input => {
            const res = input.check();
            if (!res.ok) errors.push(res.errors);
        });
        return {
            ok: errors.length < 1,
            errors: errors
        };
    }
}


class Input {
    constructor(id, settings = {}) {
        this.id = id;
        this.checker = null;
        this.setttings = settings;
        this.errors = {};
        this.className = settings.className || '';
        this.div_className = settings.div_className || '';
        this.placeholder = settings.placeholder || '';
        this._value = settings.value || '';
        this.type = settings.type || 'text';
        this._name = settings.name || '';
        this.sub_type = settings.sub_type || 'base';
        this.label = settings.label;
        this.error_separator = '';
        this.old_color = '';

        this.bar = null;
        this.input = null;
        this.error_div = null;
        this.is_disabled = false;
    }
    name() {
        if (!this._name) throw new Error('name not set');
        return this._name;
    }
    disable() {
        try { this.input.disabled = true; } catch (e) { this.is_disabled = true; }
    }

    set_value(val) { this.input.value = val; }

    value() { return this.input.value; }

    set_error_type(err, type) {
        try {
            this.errors[err].set_err = type;
        } catch (e) { }
    }
    add_checker(checker) {
        this.checker = checker;
        this.error_separator = checker.error_separator;
    }
    render_bar(value) {
        this.bar.style.width = (value <= 100 ? value : 100) + '%';
    }
    change_color(color) {
        this.bar.style.backgroundColor = color;
        this.old_color = color;
    }
    set_error() {
        this.bar.style.backgroundColor = 'red';
    }

    addError(err, type, set_err) {
        this.errors[type] = {
            err: err,
            set_err: set_err
        };
        this.renderError();
    }
    removeError(type) {
        const t = this.errors[type];
        if (t !== undefined) {
            t.err = '';
            t.set_err = false;
            this.renderError();
        }
    }
    renderError() {
        let s = '';
        let set_err = false;
        this.errors.forEach((val, key) => {
            if (val.set_err) set_err = true;
            if (val.err !== '') s += val.err + this.error_separator;
        })
        s = s.slice(0, -this.error_separator.length);
        this.error_div.innerText = s;
        if (s !== '' && set_err) this.set_error();
        else this.change_color(this.old_color);
    }
    check() {
        if (this.checker !== null) return this.checker.check(this, true);
        return { ok: true, errors: [] };
    }


    render() {
        this.input = document.createElement("input");
        this.input.className = this.className;
        this.error_div = document.createElement('div');
        this.input.disabled = this.is_disabled;
        const div = document.createElement('div');
        div.className = this.div_className;
        div.style.display = 'block';

        this.bar = document.createElement('div');
        this.bar.style.height = 0.45 + 'em';
        this.bar.style.width = 0 + '%';
        if (this.checker !== null && this.checker !== undefined) this.input.oninput = () => this.checker.check(this);
        if (this.id !== null) this.input.id = this.id;
        this.input.placeholder = this.placeholder;
        this.input.style.width = '100%';
        this.input.value = this._value;

        const to_add = [this.input, this.bar, this.error_div];
        if (this.label !== undefined) {
            const p_lab = document.createElement('p');
            p_lab.innerHTML = this.label;
            to_add.splice(0, 0, p_lab);
        }
        to_add.forEach(elem => div.appendChild(elem));
        this.input.type = this.type;
        return div;
    }
}

class Select extends Input {
    constructor(values, settings={}){
        super(null, settings);
        this.sel_values = values;

    }

    set_value(value){
        this.input.value=value;
    }

    render(){
        const div = document.createElement('div');
        const sel = document.createElement('select');
        this.sel_values.forEach(value => {
            const t = document.createElement('option');
            t.value = value;
            t.text = value;
            sel.appendChild(t);
        })
        this.input = sel;
        if (this.label !== undefined) {
            const p_lab = document.createElement('p');
            p_lab.innerHTML = this.label;
            div.appendChild(p_lab);
        }
        
        div.appendChild(sel);

        return div;

    }
}

class Checker {
    constructor(rules = [], settings = {}) {
        this.rules = [];
        this.auto = settings.auto || false;
        rules.forEach(rule => this.add_rule(rule));
        this.error_separator = settings.error_separator || '&';
        this.set_error_separator(this.error_separator);
    }

    set_error_separator(sep) {
        if (sep[0] !== ' ') sep = ' ' + sep;
        if (sep.slice(-1)[0] !== ' ') sep += ' ';
        this.error_separator = sep;
    }


    add_rule(rule) {
        this.rules.push(rule);
        if (rule.constructor.name == 'RuleMatchFields' && !this.auto) {
            rule.binded.forEach(input => {
                if (input.checker == null) {
                    const t = new Checker([rule], { auto: true })
                    input.add_checker(t);
                } else {
                    if (!input.checker.rules.includes(rule)) input.checker.add_rule(rule);
                }
            })
        }
    }
    check(input, verif = false, omit = []) {
        const errors = [];
        this.rules.forEach(rule => {
            if (!omit.includes(rule)) {
                const res = rule.check(input, verif);
                if (!res.ok) {
                    errors.push({
                        input: input,
                        rule: rule
                    });
                }
            }

        })
        return {
            ok: errors.length < 1,
            errors: errors
        };
    }
}

class RuleShouldContain {
    constructor(should_contain = [], settings = {}) {
        this.should_contain = should_contain;
        this.needs = settings.needs || this.should_contain.length;
        this.error_msg = settings.error_msg || ('should contain some of ' + this.should_contain);
        this.name = 'should';
    }

    check(input, verif = false) {
        let should = this.needs;
        this.should_contain.forEach(item => should -= count(input.input.value, item));
        if (should > 0) input.addError(this.error_msg, this.name, true);
        else input.removeError(this.name);
        return {
            should: should,
            ok: should <= 0
        }
    }
}

class RuleLength {
    constructor(min, max = Infinity, settings = {}) {
        this.min = min;
        this.max = max;
        this.error_msg_short = settings.too_short_msg || 'too short';
        this.error_msg_long = settings.too_long_msg || 'too long';
        this.name = 'length';
        this.max_set = this.max == Infinity;
        this.base_blue = 100;
    }

    handleErr(input, type, t) {
        input.set_error_type(this.name, type);
        if (t >= this.min && t <= this.max) {
            input.removeError(this.name);
        } else {
            if (t < this.min) input.addError(this.error_msg_short, this.name, type);
            else input.addError(this.error_msg_long, this.name, true);
        }
    }
    check(input, verif = false) {
        const t = input.input.value.length;
        const t1 = t / this.min;
        const score = this.max_set ? (t1 <= 1 ? t1 : 1) : t1;

        const green = 255 * score;
        const red = 255 * (1 - score);
        input.change_color(makeRGB(red, green, this.base_blue));
        input.render_bar(score * 100);
        this.handleErr(input, verif, t);
        return {
            ok: verif ? (t <= this.max && t >= this.min) : true,
        };
    }
}

class RuleShouldNotContain {
    constructor(arr = [], settings = {}) {
        this.arr = arr;
        this.error_msg = 'should not contain ' || settings.error_msg;
        this.name = 'should_not';
    }
    check(input, verif = false) {
        let shouldNot = [];
        this.arr.forEach(item => {
            if (input.input.value.includes(item)) shouldNot.push(item);
        });
        if (shouldNot.length > 0) input.addError(this.error_msg + shouldNot, this.name, true);
        else input.removeError(this.name);
        return {
            ok: shouldNot <= 0
        }
    }
}


class RuleMatchFields {
    constructor(binded = [], settings = {}) {
        this.binded = binded;
        this.error_msg = settings.error_msg || 'Fields do not match';
        this.error_name = 'match';
    }
    check(input, verif = false) {
        let ok = true;
        const t = this.binded[0].input.value;
        this.binded.forEach(elem => {
            if (elem.input.value !== t) ok = false;
        });
        if (!ok) {
            if (verif) this.binded.forEach(input => input.addError(this.error_msg, this.error_name, true));
            else this.binded.forEach(input => input.addError(this.error_msg, this.error_name, false));
        } else {
            this.binded.forEach(input => {
                input.checker.check(input, verif, [this]);
                input.removeError(this.error_name);
            });
        }
        return {
            ok: verif ? ok : true
        }
    }
}

class RuleMatchRegExp {
    constructor(reg, settings = {}) {
        this.reg = reg;
        this.name = 'regexp';
        this.error_msg = settings.error_msg || 'reg pb';
    }

    check(input, verif = false) {
        const ok = input.input.value.match(this.reg) !== null;
        if (!ok) input.addError(this.error_msg, this.name, true);
        else input.removeError(this.name);
        return {
            ok: ok
        }
    }
}
const new_line = () => document.createElement('br');


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

    const close_func = () => { base_container.style.display = 'none'; document.body.removeChild(base_container); }
    const open_func = () => { base_container.style.display = 'block'; }
    if (open_elem) open_elem.onclick = function () { open_func(); };

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

// requires Fancy_form and make_overlay

class multi_prompt {
    /**
    * @param {Form} form
    */
    constructor(name, form, title_classname = '') {
        this.form = form;
        this.p = document.createElement('p');
        this.name = name;
        this.title_classname = title_classname;
        this.prepare();
    }
    say(string) { this.p.innerHTML = string; }

    prepare() {
        const d = document.createElement('div');
        const p = document.createElement('p');
        p.innerHTML = this.name;
        p.className = this.title_classname
        d.appendChild(p);
        d.appendChild(this.form.render());
        d.appendChild(this.p);
        const [close, open] = make_overlay(d);
        this.open = open;
        this.close = close;
    }
}



class custom_prompt {
    constructor(text = '', button_text = '', css_classes = {}) {
        this.text = text;
        this.button_text = button_text;
        this.css_classes = css_classes; //contains the necessary css classes for the window
        this.prepare();
    }
    /**
     * 
     * @param {String} text 
     * @param {String} button_text 
     */
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
        document.addEventListener('keypress', event => {
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
    /**
     * 
     * @param {String} string 
     * @param {boolean} should_shake 
     */
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
        this.input.autofocus = true;
        this.bt = document.createElement('input');
        this.bt.type = 'button';
        this.bt.value = this.button_text;
        this.p = document.createElement('p');
        this.p.innerHTML = this.text;

        this.sayer = document.createElement('p');


        [this.p, this.input, document.createElement('br'),
        document.createElement('br'), this.bt, this.sayer]
            .forEach(e => d.appendChild(e));

        const [close_func, open_func] = make_overlay(d, true);
        this.close_func = close_func;
        this.open_func = open_func;

    }
}


const say = string => {
    const d = document.createElement('div');
    const p = document.createElement('p')
    p.innerHTML = string;
    d.appendChild(p);
    const [close, open] = make_overlay(d);
    open();
}
Array.prototype.asyncForEach = async function (func) {
    await Promise.all(this.map(async (value, key) => await func(value, key)));
}
Object.prototype.forEach = function (func) { //func can take value and/or key
    Object.keys(this).forEach(key => func(this[key], key));
};
/**
 * alias console.log
 * @param  {...any} args 
 *  
 * */
const print = (...args) => console.log(...args);

const sort_objects_by = key => (a, b) => a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;

const make_body = obj => {
    const fd = new FormData();
    obj.forEach((key, val) => fd.append(val, key));
    return fd;
}


const post = (addr, body) => fetch(addr, { method: 'POST', body: make_body(body) });



