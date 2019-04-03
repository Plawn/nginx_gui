Array.prototype.asyncForEach = async function (func) {
    await Promise.all(this.map(async (value, key) => await func(value, key)));
}
const print = (...args) => console.log(...args);

const sort_objects_by = key => (a, b) => a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;

const make_body = obj => {
    const fd = new FormData();
    for (const key in obj) fd.append(key, obj[key]);
    return fd;
} 
 

const post = (addr, body) => fetch(addr, { method: 'POST', body: make_body(body) });


const say = string => {
    const d = document.createElement('div');
    const p = document.createElement('p')
    p.innerHTML = string;
    d.appendChild(p);
    const [close, open] = make_overlay(d);
    open();
}