require('./fun.js');
require('./ShareLib.js');

var net = require('net');

var HOST = '42.121.144.150';
var PORT = 8066;


var client = new net.Socket();

client.connect(PORT, HOST, function() {

    log('CONNECTED TO: ' + HOST + ':' + PORT);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据


    //使用同步频道 或者切换频道
    var cmd= { cmd :"GetOpIdByToken",rcmd : 1000,args:["test1"] }

    var buff= new ByteRequest();

    buff.writeData(cmd);

    client.write(buff.buffer);

});

// 为客户端添加“data”事件处理函数
// data是服务器发回的数据
client.on('data', function(data) {

    log('DATA: ' + data);
    // 完全关闭连接

    var buff= new ByteRequest();
    buff.append(data);
    buff.readData(function(data){
        log('CallBack Data: ' + data);
        data = JSON.parse(data);
        var outbuff= new ByteRequest();
        if(data.cmd)
        {
            switch (data.cmd)
            {
                case 1000:
                    outbuff.writeData({ cmd : "Sync" , args:[data.result] , rcmd:1001 });
                    break;

                case 1002:
                    outbuff.writeData({ cmd : "QueueUp" , args:[0] , rcmd:1003 });
                    break;

                case 1003:
                    log("Queue Up!");
                    break;

            }
        }
        else
        {
            if(data[0].Op==0)
                outbuff.writeData({ cmd : "LoginByToken" , args:["test1"] , rcmd:1002 });
        }
        client.write(outbuff.buffer);
    });
});

// 为客户端添加“close”事件处理函数
client.on('close', function() {
    log('Connection closed');
});



//process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
    process.stdout.write('data: ' + chunk);
    var buff= new ByteRequest();
    buff.writeData(JSON.parse(chunk));
    client.write(buff.buffer);
});



