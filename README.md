

*WARNING* :

Test are now **DEPRECATED**

---


# TODO

* add nginx.conf generation
    * max body size *upload*
    * modify ssl settings
    * conf.d folder
    * upstreams.d folder
    * http headers *WIP*
    * transparent **Done**

* modify nginx_db (localhost) **Done** => correct routes **Done**

* modify nginx_db => multiple sub_apps same domain **Done**


* add select to Fancy_forms **Done**

* add BepBop minify

* finish server API
    * add interfaces **Done**
    * add multi-getter => reduce loads requests **Done**

* finish nginx API
    * add full db dump **Done**
    * redesign to have a nice load *WIP* => now better

* finish web UI
    * add buttons :
        * build config **Done**
        * restart server **Done** (needs to be verified)
        * add upstream **Done** 
        * add application **Done** (finish checking + add fields)
        * add app **Done**
        * add domain **Done**
    * add view
        * add display => application vs domains **Done** (using BepBop for multipage)
    * add functionnality
        * if not logged => logout UI and erase data **Done**

    * UI enhancing
        * make domains display better (table)
            * add titles
            * add bars
        * background *WIP*
        * buttons
        * make application VIEW

## BepBop

* Bundle JS *WIP* (using BepBop)
* compile all local statics to one file **Done**