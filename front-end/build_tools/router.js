const Fancy_router = (function () {
    const loading_img_url = 'assets/static/loading.gif';

    'use strict';

    const sort_by_key = key => (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
    const is_func = v => typeof v === 'function'

    const make_link = (renderer, panel, className = '') => {
        const b = document.createElement('input');
        b.type = 'button';
        b.value = panel.name;
        b.className = className;
        b.onclick = () => renderer.load_panel(panel);
        return b;
    }

    class Loader {
        constructor(panels = [], url = '', settings = {}) {
            this.panels = panels;
            this.url = url;
            this.launched = false;
            this.next_loader = settings.next_loader || null;
            this.set_panels();
        }

        set_panels() { this.panels.forEach(e => e.set_loader(this)); }

        load() {
            if (this.launched) return;
            this.launched = true;
            this.panels.forEach(e => e.set_loading());
            fetch(this.url)
                .then(data => data.json())
                .then(data => {
                    eval(data.js || '');
                    this.panels.forEach(e => {
                        e.set_content(data[e.name].content || '');
                        const t = eval(data[e.name].onload || '');
                        e.onload = is_func(t) ? t : (() => { });
                        const t2 = eval(data[e.name].onquit || '');
                        e.onquit = is_func(t2) ? t2 : (() => { });
                        e.init(data[e.name].init || '');
                    });
                })
                .then(() => {
                    if (this.next_loader !== null) this.next_loader.load();
                });
        }
    }


    class Panel {
        constructor(content, settings = {}) {
            this.content = content || '';
            this.settings = settings;
            this.name = settings.name || 'undefined';
            this.onload = settings.onload || (() => { });
            this.div = document.createElement('div');
            this.init_js = settings.init_js || '';
            this.loader = null;
            this.ready = false;
        }

        set_loader(loader) {
            this.loader = loader;
        }

        set_loading() {
            this.div.innerHTML = '<img src="' + loading_img_url + '"></img>';
            this.div.style.margin = 'auto';
        }

        hide() { this.div.hidden = true; }
        show() { this.div.hidden = false; }

        init(init_content) {
            this.init_js = init_content;
            eval(init_content);
        }

        set_content(content) {
            this.div.innerHTML = content;
            this.content = content;
        }

        load_from_url(url) {
            this.set_loading();
            fetch(url)
                .then(data => data.text())
                .then(data => {
                    this.content = data;
                    this.ready = true;
                    this.div.innerHTML = this.content;
                });

        }

        render() {
            this.div.innerHTML = this.content;
            this.div.hidden = true;
            // if (this.loader !== null) this.loader.load();
            return {
                content: this.div,
                onload: this.onload
            };
        }
    }



    class Menu {
        constructor(panels = [], renderer) {
            this.panels = panels;
            this.renderer = renderer;
            this.buttons = [];
            this.init_links();

        }

        init_links() {
            this.panels.forEach((panel, i) => this.buttons.push(make_link(this.renderer, panel)));
        }

        render() {
            const d = document.createElement('div');
            this.buttons.forEach(e => d.appendChild(e));
            return d;
        }
    }



    class Renderer {
        constructor(render_div, panels = [], settings = {}) {
            this.panels = panels;
            this.panels_names = {};
            this.map_url = settings.map_url || '';
            this.map = settings.map || [];
            this.home_value = settings.home_value || 0;
            this.init_panel_names();
            this.settings = settings;
            this.render_div = render_div;
            this.sub_page = null;
            this.menu = new Menu(panels, this);
            this.displayed = 0;
            this.title_auto_change = settings.title_auto_change || true;
            this.state = {};
        }

        load_panel(panel) {
            if (this.diplayed == panel) return;
            if (this.title_auto_change) document.title = panel.name;
            window.history.pushState('', '', '?path=' + panel.name);
            this.displayed.hide();
            this.displayed.onquit(this);
            this.displayed = panel;
            panel.show();
            panel.onload(this);
        }

        init_panel_names() {
            this.panels.forEach(e => this.panels_names[e.name] = e);
        }

        first_load() {
            if (this.title_auto_change) document.title = this.panels[this.home_value].name;
            window.history.pushState('', '', '?path=' + this.panels[this.home_value].name);
            this.displayed = this.panels[this.home_value];
            this.panels[this.home_value].show();
            this.panels[this.home_value].onload(this);
        }

        render() {
            this.render_div.innerHTML = '';
            this.render_div.appendChild(this.menu.render());
            this.sub_page = document.createElement('div');
            this.panels.forEach(e => this.sub_page.appendChild(e.render().content));
            this.first_load();
            this.render_div.appendChild(this.sub_page);
        }
    }

    return {
        Renderer: Renderer,
        Panel: Panel,
        Loader: Loader
    }
})();