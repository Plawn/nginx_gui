async e => {
    application_select.innerHTML = '';
    const apps =  await get_applications();
    apps.forEach(app => {
        const opt = document.createElement('option');
        opt.value = app;
        opt.text = app;
        application_select.appendChild(opt);
    });
}