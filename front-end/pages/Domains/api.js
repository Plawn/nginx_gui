const api_address = 'api';

const api = async (type, obj = {}) => {
    obj.type = type;
    const resp = await post(api_address, obj);
    return await resp.json();
};

/**
 * Get the list of all domains
 * @returns {Array<string>}
 */
const get_domains = async () => await api('get_domains');

/**
 * Get the list of all Applications
 * @requires being-logged
 * @retuns Array[String]
 */
const get_applications = async () => await api('get_applications');


/**
 * @requires being-logged
 * @param {String} domain_name
 * @param {String} app_name
 */
const get_subapp_from_domain = async (domain_name, app_name) => await api('get_subapp_from_domain', { domain_name: domain_name, app_name: app_name });


/**
 * @requires being-logged
 * @param {String} domain_name
 */
const get_subapps_from_domain = async domain_name => await api('get_apps_from_domain', { domain_name: domain_name });

const _get_applications = async () => applications = await get_applications();

const add_application = async app => {
    return await api('add_application', app);
};

/**
 * send the request to build the nginx files
 */
const build_nginx = async () => await api('build_nginx');

/**
 * apply the settings on the server
 */
const apply_settings = async () => await api('apply_settings');


const get_upstreams = async () => await api('get_upstreams');

/**
 * 
 * @param {Map<String, String>} app 
 */
const update_app = async app => await api('update_app', app);

// make ui
const add_upstream = async upstream => await api('add_upstream', upstream);


const restart_nginx = async () => await api('restart_nginx');

const get_all_subapps_from_domain = async domain_name => await api('get_all_subapps_from_domain', { domain_name: domain_name });

const add_domain = async domain => await api('add_domain', domain);

const add_app = async app => await api('add_app', app);