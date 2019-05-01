Array.prototype.asyncForEach = async function(func) {
    await Promise.all(this.map(async(value, key) => await func(value, key)));
}
Object.prototype.forEach = function(func) { //func can take value and/or key
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

const br = () => document.createElement('br');


const prepare_table = (titles = [], lines = [], settings = {}) => {
    const table = document.createElement('table');
    table.className = settings.className || '';
    const first_row = table.insertRow();
    titles.forEach(title => {
        const cell = first_row.insertCell();
        cell.outerHTML = '<th>' + title + '</th>';
        const p = document.createElement('div');
        p.innerHTML = title;
        cell.appendChild(p);
    });

    lines.forEach(line => {
        const new_row = table.insertRow();
        line.forEach(item => {
            const cell = new_row.insertCell();
            const div = document.createElement('div');
            if (settings.is_node) {
                div.appendChild(item);
            } else {
                div.innerHTML = item;
            }
            cell.appendChild(div);
        });
    });
    return table;
}