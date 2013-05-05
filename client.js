require('./fun.js');
require('./ShareLib.js');
var zlib = require("zlib");
var net = require('net');

var HOST = '42.120.19.42';
var PORT = 8066;
var acc= "guest_" + Math.random();
var client = new net.Socket();

client.connect(PORT, HOST, function() {

    log('CONNECTED TO: ' + HOST + ':' + PORT);
    // 建立连接后立即向服务器发送数据，服务器将收到这些数据

    //使用同步频道 或者切换频道
    var cmd= { cmd :"GetOpIdByToken",rcmd : 1000, args:[acc] }
    //var cmd = { cmd : "Sync"  , args:["98715"]}
    var buff= new ByteRequest();

    buff.writeData(cmd);

    client.write(buff.buffer);
    log('Send Data: ' + buff.buffer);
});

var readbuff = new ByteRequest();

var login=false;
// 为客户端添加“data”事件处理函数
// data是服务器发回的数据
client.on('data', function(data) {

    //log('DATA: ' + data);
    // 完全关闭连接
    readbuff.append(data);
    readbuff.readData(function(data,type){
        if(type == 1)
        {
            log("zlib...");
            zlib.inflateRaw(data, function(err, buffer) {
                if (!err) {
                    logic(buffer);
                }
            });
        }
        else if(type==2)
        {

        }
        else
        {
            logic(data);
        }
    });



});

logic = function(data){
    log('CallBack Data: ' + data + " Size:" + data.length);
    try
    {
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

                    outbuff.writeData({ cmd : "QueueUp" , args:[1] , rcmd:1003 });
                    break;

                case 1003:
                    log("Queue Up!");
                    break;


            }
        }
        else
        {
            if(!login)
            {
                if(data[0].Op==0)
                {
                    outbuff.writeData({ cmd : "LoginByToken" , args:[acc] , rcmd:1002 });
                    login=true;
                }
            }
            else
            {
                for(var i= 0;i<data.length;i++)
                {
                    if(data[i].Op==2)
                    {
                        outbuff.writeData( { cmd : "Sync"  , args:[data[i].OpStr.Tag.OpId]}  );
                    }
                }
            }

        }
        if(outbuff.buffer.length>0)
        {
            client.write(outbuff.buffer);

            log('Send Data: ' + outbuff.buffer);
        }
    }
    catch (ex)
    {

    }
}

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
    //client.write(buff.buffer);
});



