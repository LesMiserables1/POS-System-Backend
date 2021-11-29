import nowin from "node-windows"
var Service = nowin.Service;

// Create a new service object
var svc = new Service({
  name:'POS backend',
  description: 'POS BACKEND.',
  script: `D:\\POS-System-Backend\\index.js`
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});
svc.on('uninstall',function(){
    svc.uninstall();
});

svc.install();