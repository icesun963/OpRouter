var config = require('./config.json');
require('./fun.js');

var net = require('net');


//===================================================================
//差异消息频道
//===================================================================
Channel = function (opId,syncAll)
{
    var host = config.ClientHost;
    var port = config.ClientPort;

    this.list       = [];   //存放所有客户端TClient个体对象
    this.maxcount   = 0;    //历史最大客户端数量
    this.opid       = opId;
    this.sync       = syncAll;
    this.lastAlive  =   new Date();//最后更新时间
    var self = this;

    //加入客户端列表
    this.add = function( tclient ) {
        this.list.push( tclient );
        log(self.headlog() + 'channel sock add' );
        //最大在线人数
        if( this.list.length > this.maxcount ) {
            this.maxcount = this.list.length;
        }
        log(self.headlog() + 'channel['+ opId +'] sock count:' + this.list.length
            + ', maxcount:' + this.maxcount  );


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
        log(this.headlog() + 'sock['+ opId +'] remove, count=' + this.count() );
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


    this.broadcast = function( msg ) {
        var ccount = 0;
        for( var i = 0; i < this.list.length; i++ ) {
            var cuser = this.list[i];
            //客户端对象
            if( ! cuser ) continue;
            //如果同步频道,仅广播未同步的
            if(this.sync && cuser.syncd)
            {
                continue;
            }
            ccount++;
            //群发
            try
            {
                cuser.sock.write( msg );
                cuser.sync = true;
            }
            catch ( err )
            {
                log(self.headlog() + ' broadcast err:'+ err.description );
                onerror = true;
            }
        }
        //客户端数量
        if(config.LogOn)
            log(self.headlog() + 'brocast to ['+ opId +'] ' + ccount + ' users, msg=' + msg  );

    }

    //关闭频道
    this.close = function (){
        for(var i= 0;i<this.list.length;i++)
        {
            var client=this.list[i];
            if(client)
                client.close();
        }
        this.sock.destroy();
    }

    //客户端连接相关
    this.sock = new net.Socket();

    this.send=function(msg){
        var outbuff= new ByteRequest();
        outbuff.writeData(msg);
        this.sock.write(outbuff.buffer);
    };

    this.headlog = function(){
        if(this.sync)
        {
            return 'sync ';
        }
        return '';
    };

    this.sock.connect(port, host, function() {
        this.setNoDelay(true);
        log(self.headlog() + 'channel['+ opId +']  CONNECTED TO: ' + host + ':' + port);

        // 建立连接后立即向服务器发送数据，服务器将收到这些数据

        if(self.sync!=true)
        {
            //使用同步频道 或者切换频道
            var data= { cmd : "Sync" , args : [opId] };

            var buff=new ByteRequest();
            buff.writeData(data);
            this.write(buff.buffer);
        }

    });

    this.sock.on('error', function (err) {
        log(self.headlog() + err  + ' Opid:' + opId);
    });


    // 为客户端添加“data”事件处理函数
    // data是服务器发回的数据
    this.sock.on('data', function(data) {

        if(config.LogOn)
            log(self.headlog() +'broadcast data: ' + opId);
        //广播频道消息
        self.broadcast(data);
        //更新存活时间
        self.lastAlive  =   new Date();
    });

    // 为客户端添加“close”事件处理函数
    this.sock.on('close', function() {
        log(self.headlog() +'Connection closed:' + opId);
        self.close();
    });

}




