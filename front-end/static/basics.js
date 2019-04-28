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


