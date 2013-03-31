var config = require('./config.json');
require('./fun.js');
require('./channel.js');
require('./routerChannel.js');
require('./policyServer.js');

require('./sysmon/core.js');


var net = require('net');

var PORT = config.ServerPort;

//广播频道
var Channels = new Hashtable();

//完整数据广播频道
var SyncChannels = new Hashtable();

//检查存活频道
setInterval(function(){
    var keys=Channels.keys();
    var remove=false;
    for(var i=0 ;i<keys.length; i++)
    {
        var key=       keys[i];

        var channel = Channels.get(key);
        var syncchannel = SyncChannels.get(key);
        if(channel && channel.lastAlive)
        {
            var sc= (new Date().getTime()- channel.lastAlive.getTime())/1000;

            if(sc>config.AliveSecond)
            {
                channel.close();
                if(syncchannel)
                    syncchannel.close();
                Channels.remove(key);
                SyncChannels.remove(key);
                log('Remove Channel:' + key);
                remove = true;
            }
        }
    }
    if(remove)
        log('App Channel Count:' + Channels.size());
},3000);

//如果没有任何连接,重启服务
setInterval(function(){
    log("RouterUser:" + Router.count());
    if(config.AutoExitOnNoClient)
        if(Router.count()==0)
        {
            process.exit();
        }
},60*1000);

//主通道
var Router = new RouterChannel();

GetNowUser = function(){
    return Router.count()
};

//全同步参数
Router.onDataCallBack(function(data){

    var rdata=JSON.parse(data.toString('utf8'));

    var cid     =   rdata.cid;
    var result  =   rdata.result;

    if(cid)
    {
        for(var i=0;i<Router.list.length;i++)
        {
           var client= Router.list[i];
           if(client && client.clientId==cid)
           {
               client.send(rdata);
               break;
           }
        }
    }

});

// 创建一个TCP服务器实例，调用listen函数开始监听指定端口
// 传入net.createServer()的回调函数将作为”connection“事件的处理函数
// 在每一个“connection”事件中，该回调函数接收到的socket对象是唯一的
net.createServer(function(sock) {

    // 客户端实例
    var client = new Client(sock);
    // 我们获得一个连接 - 该连接自动关联一个socket对象
    log('[' + client.clientId +']CONNECTED: ' +    sock.remoteAddress + ':' + sock.remotePort);

    Router.add(client);

    client.onClose(function(){
        Router.remove(this);
        if(client!=null &&client.channel!=null)
        {
            if(client.channel.count()<=1)
            {
                client.channel.close();
                Channels.remove(client.channel.opid);
            }
        }
    });

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        client.close();
    });

    //客户端超时事件
    sock.on('timeout', function () {
        log( 'sock timeout' );
        client.close();
    });


    sock.on('error', function (err) {
        log('sock error :' +  err.message );
        client.close();
    });

    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
        if(config.LogOn)
            log('>>>DATA ' + sock.remoteAddress  + ':' + sock.remotePort+ '->' + data);

        //写入Buff
        var buff= new Buffer(data);

        //输出buff
        if(config.LogOn)
            log('>>>Byte:[' + buff.toByteArray() + ']');

        client.byteRequest.append(data);

        client.byteRequest.readCmd(function(data,bytes){

                try
                {
                    if(config.LogOn)
                        log('Data Get:' + data);

                    data=JSON.parse(data.toString('utf8'));

                    if(data.cmd=='Sync')
                    {
                        client.leaveChannel();

                        var opid = data.args[0];

                        if(config.LogOn)
                            log('Sync Cmd Get:' + opid);

                        log('Channel Count:' + Channels.size());

                        var channel;
                        var sychannel;

                        if(!Channels.containsKey(opid))
                        {
                            channel = new Channel(opid,false);
                            sychannel = new Channel(opid,true);
                            if(config.LogOn)
                                log('Creat Channel:' + opid);

                            Channels.put(opid,channel);
                            SyncChannels.put(opid,sychannel);
                            //初始连接用户,会收到Sync命令
                            client.syncd=true;
                        }
                        else
                        {
                            channel=Channels.get(opid);
                            sychannel = SyncChannels.get(opid);
                        }

                        channel.add(client);
                        client.channel = channel;

                        if(sychannel)
                        {
                            sychannel.add(client);
                            client.syncchannel = sychannel;

                            //发送同步请求
                            client.syncchannel.send( { cmd : 'SyncAll' , args : [opid] });
                        }

                    }
                    else if(data.cmd=='SyncLeave')
                    {
                         client.leaveChannel();
                    }
                    else //转发
                    {
                        if(!client.channel)
                        {
                            //带有通道id的请求数据
                            data.cid=client.clientId;
                            if(config.LogOn)
                                log("Main Router>>");
                            Router.send(data);
                        }
                        else
                        {
                            if(config.LogOn)
                                log("Channel Router>>");
                            client.channel.send(data);
                        }
                        if(config.LogOn)
                            log("Router End...");

                    }
                }
                catch(err)
                {
                    log('app error:' + err);
                    client.error++;
                    if(client.error >= config.MaxErrorCount)
                    {
                        client.close();
                    }
                }
         });



    });

}).listen(PORT);

log('Server listening on :'+ PORT);






