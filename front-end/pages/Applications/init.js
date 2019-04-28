const application_select = document.getElementById('application_select');
const app2 = document.getElementById('root2');

application_select.onchange = function(){
    display_application(this.value);
}



export default [application_select, app2];