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