var config = require('./config.json');
require('./fun.js');

var net = require('net');

//===================================================================
//命令转发通道(主通道)
//===================================================================
RouterChannel = function()
{
    this.maxcount   = 0;
    this.list       = [];
    var self       =this;

    //加入客户端列表
    this.add = function( tclient ) {
        this.list.push( tclient );
        log( 'RouterChannel sock add' );
        //最大在线人数
        if( this.list.length > this.maxcount ) {
            this.maxcount = this.list.length;
        }
        log( 'RouterChannel sock count:' + this.list.length  + ', maxcount:' + this.maxcount );


    }

    //查找是否已经加入
    //成功返回0-下标
    //失败返回-1
    this.find = function( tclient ) {
        return this.list.indexOf( tclient );
    }

    //从客户端列表中删除
    this.remove = function ( tclient ) {
        var idx = this.list.indexOf( tclient );
        if( idx != -1 ) {
            this.list.splice( idx, 1 ); //列表中删除一个元素
        }
        log( 'RouterChannel sock remove, count=' + this.count() );
    }
    //客户端个数
    this.count = function() {
        return this.list.length;
    }

    //获取第i个客户端
    //成功返回客户端对象
    //失败返回null
    this.get = function( idx ) {
        if( idx >= 0 && idx < this.list.length )
            return this.list[ idx ];
        else
            return null;
    }

    var host = config.SyncHost;
    var port = config.SyncPort;

    this.onDataCallBack=function(callback){
        self.onDataGet_CallBack=callback;
    };

    this.send=function(data){
        var outbuff= new ByteRequest();
        outbuff.writeData(data);
        sock.write(outbuff.buffer);
    };

    //关闭频道
    this.close = function (){
        for(var i= 0;i<this.list.length;i++)
        {
            var subclient=this.list[i];
            if(subclient)
                subclient.close();
        }
        client.close()

    }

    //客户端连接相关
    var sock = new net.Socket();

    var client= new Client(sock);

    var connect=function(){
        sock.connect(port, host, function() {
            log('RouterChannel CONNECTED TO: ' + host + ':' + port);
            client= new Client(sock);
        })
    };



    connect();

    var inReconnent=0;
    reConnect=function(){
        if(inReconnent==0)
        {
            inReconnent++;
            setTimeout(
                function(){
                    connect();
                    inReconnent--;
                },10000);
        }
    };

    sock.on('error', function (err) {
        log( 'error :' +  err  + 'On RouterChannel ');
        log('RouterChannel ReConnect...');
        reConnect();
    });


    // 为客户端添加“data”事件处理函数
    // data是服务器发回的数据
    sock.on('data', function(buff) {

        client.byteRequest.append(buff);
        client.byteRequest.readData(function(data,type){
            try
            {
                if(self.onDataGet_CallBack)
                    self.onDataGet_CallBack(data,type);
            }
            catch (err)
            {
                log("routerChannel error:" + err.direction);
            }
        });

    });

    // 为客户端添加“close”事件处理函数
    sock.on('close', function() {
        log('RouterChannel Connection closed');
        log('RouterChannel ReConnect...');
        client.close();
        reConnect();

    });
}
