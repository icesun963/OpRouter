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
    var skeys=SyncChannels.keys();

    var remove=false;

    for(var i=0 ;i<keys.length; i++)
    {
        var key=       keys[i];
        var channel = Channels.get(key);

        if(channel)
        {
            if( channel.Closed == true  )
            {
                //channel.close();
                Channels.remove(channel.opId);
                log('-*-Remove Channel:' + key + " lastAlive:" +  channel.lastAlive);
                remove = true;
            }
        }
        else
        {
            Channels.remove(key);
        }
    }

    for(var i=0 ;i<skeys.length; i++)
    {
        var key =  skeys[i];
        if(!Channels.containsKey(key))
        {
            var syncchannel = SyncChannels.get(key);
            if(syncchannel )
            {
                //channel.close();

                SyncChannels.remove(syncchannel.opId);
                log('-*-Remove SyncChannel:' + key);
                remove = true;
            }
            else
            {
                SyncChannels.remove(key);
            }
        }
    }

    if(remove)
        log('App Channel Count:' + skeys.length +'/' + keys.length + '->'+ SyncChannels.size()  + "/" + Channels.size());
},60 * 1000);


//如果没有任何连接,重启服务
setInterval(function(){
    log("RouterUser:" + Router.count());
    if(config.AutoExitOnNoClient)
        if(Router.count()==0 || Channels.size()==0)
        {
            process.exit();
        }
},5 * 60 * 1000);


setInterval(function(){
    for(var i=0;i<Router.list.length;i++)
    {
        var client= Router.list[i];
        var now =new Date().getTime();
        if(!client.channel)
        {
              if((now - client.buildTime.getTime())>10*1000)
              {
                  client.close();
              }
        }
    }
},5 * 1000);

//主通道
var Router = new RouterChannel();

getUserList = function(){
   var ret= [];
    for(var i=0;i<Router.list.length;i++)
    {
        var client= Router.list[i];
        ret.push(client.remoteAddress + ":" + client.remotePort);
    }
    return ret;
};

getNowUser = function(){
    if(!Router.isConned)
    {
        return undefined;
    }
    return {
        'NowUser' : Router.count() ,
        'ChannelCount' : Channels.size(),
        'SyncChannelCount' : SyncChannels.size()
    };
};

getChannelList = function(){
    var ret = [];
    var keys=Channels.keys();

    for(var i=0 ;i<keys.length; i++)
    {
        var key=       keys[i];
        var channel = Channels.get(key);
        if(channel)
        {
            ret.push({
                'Key' : key,
                'Opid'  : channel.opId,
                'Closed' : channel.Closed,
                'AddTime' : channel.addTime,
                'LastLive': channel.lastAlive,
                'Count' : channel.count()

            });
        }
    }
    return ret;
}
//全同步参数
Router.onDataCallBack(function(data,type){
    if(type != 0)
        return;

    var rdata = JSON.parse(data.toString('utf8'));

    var cid     =   rdata.cid;
    var result  =   rdata.result;

    if(cid)
    {
        for(var i=0;i<Router.list.length;i++)
        {
           var client= Router.list[i];
           if(client && client.clientId == cid)
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
        Router.remove(client);
    });

    client.onLeaverChannel(function(ch1,ch2){
        if(ch1 && ch1.count()==0)
        {
           ch1.close();
        }
        if(ch2 && ch2.count()==0)
        {
            ch2.close();
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

                    if(data.cmd == 'Ping')
                    {
                        client.send({
                            'cmd' : data.rcmd ,
                            'result' : 0
                        });
                    }
                    else if(data.cmd=='Sync')
                    {

                        client.leaveChannel();

                        var opid = data.args[0].toString();

                        if(config.LogOn)
                            log('Sync Cmd Get:' + opid);

                        log('Channel Count:' + Channels.size());

                        var channel;

                        var syncchannel;

                        if(!Channels.containsKey(opid))
                        {

                            log('+Creat Channel:' + opid);

                            channel = new Channel(opid,false);
                            channel.onClose(function(copid){
                                Channels.remove(copid.toString());
                                log('-*-Channel Remove OnClose:' + copid + ' Count:' + Channels.size());
                            });
                            Channels.put(channel.opId,channel);

                            //初始连接用户,会收到Sync命令
                            client.syncd=true;
                        }
                        else
                        {

                            channel = Channels.get(opid);

                            if(SyncChannels.containsKey(opid))
                            {
                                syncchannel = SyncChannels.get(opid);
                            }
                            else
                            {
                                log('+Creat Syncchannel:' + opid);
                                syncchannel = new Channel(opid,true);
                                SyncChannels.put(syncchannel.opId,syncchannel);
                                syncchannel.onClose(function(copid){
                                    SyncChannels.remove(copid);
                                    log('-*-SyncChannel Remove OnClose:' + copid + ' Count:' + Channels.size());
                                });
                            }
                            if(!syncchannel)
                            {
                                 log("error>>sychannel is null")
                            }
                        }

                        channel.add(client);

                        if(syncchannel)
                        {
                            syncchannel.add(client);
                            //client.syncd = false;
                            syncchannel.send( { cmd : 'SyncAll' , args : [opid] });
                        }

                    }
                    else if(data.cmd == 'SyncLeave')
                    {
                         client.leaveChannel();
                    }
                    else //转发
                    {
                        if(!client.channel)
                        {
                            //带有通道id的请求数据
                            data.cid = client.clientId;
                            if(config.LogOn)
                                log("Main Router>>:" + data);
                            Router.send(data);
                        }
                        else
                        {
                            if(config.LogOn)
                                log("Channel Router>>"  + data);
                            client.channel.send(data);
                        }

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
log('--------------------------------------------');
log('Server listening on :'+ PORT + ' ver:' + config.Version);
log('--------------------------------------------');





