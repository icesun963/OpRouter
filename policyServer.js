var net = require("net");
require('./fun.js');

var flashPolicyServer = net.createServer(function (stream) {
    stream.setTimeout(0);
    stream.setEncoding("utf8");

    stream.addListener("connect", function () {
        //log("flashPolicyServer connect...");
    });

    stream.addListener("data", function (data) {
        if ( data.indexOf('<policy-file-request/>') != -1){
            var buff=new Buffer('<?xml version="1.0"?><cross-domain-policy><allow-access-from domain="*" to-ports="*" /></cross-domain-policy>');
            //log("policy:" + buff.toByteArray());
            stream.write(buff);
        }
        stream.end();
    });

    stream.addListener("end", function() {
        stream.end();
    });

    stream.addListener("error", function(err){
        log("flashPolicyServer err:" + err);
    });
});

StartPolicyServer=function(){
    log("Start StartPolicyServer...");
    flashPolicyServer.on("error", function(err){
        log("flashPolicyServer err:" + err);
    });
    flashPolicyServer.listen(843);
    log(" StartPolicyServer Start:" + 843);
};

StartPolicyServer();