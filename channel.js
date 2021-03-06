var config = require('./config.json');
require('./fun.js');

var net = require('net');


//===================================================================
//差异消息频道
//===================================================================
Channel = function (id,syncAll)
{
    var host = config.ClientHost;
    var port = config.ClientPort;

    this.list       = [];   //存放所有客户端TClient个体对象
    this.maxcount   = 0;    //历史最大客户端数量
    this.opId       = id;
    this.syncAll       =    syncAll;
    this.lastAlive  =   new Date();//最后更新时间
    this.addTime    =   new Date();
    this.Closed     =   false;
    var self = this;

    this.timeOut=function(){
        var sc= (new Date().getTime()- self.lastAlive.getTime())/1000;
        if(sc>config.AliveSecond)
        {
            return true;
        }
        return false;
    }

    this.onClose=function(callback){
        this.onClose_CallBack=callback;
    };

    //加入客户端列表
    this.add = function( tclient ) {
        if(this.find(tclient)==-1)
        {
            this.list.push( tclient );
            log(self.headlog() + 'Channel[] sock add' );
            //最大在线人数
            if( this.list.length > this.maxcount ) {
                this.maxcount = this.list.length;
            }
            log(self.headlog() + 'Channel['+ self.opId +'] sock count:' + this.list.length
                + ', maxcount:' + this.maxcount  );
        }

        if(this.syncAll)
        {
            if(tclient.syncchannel)
            {
                tclient.syncchannel.remove(tclient);
            }
            tclient.syncchannel=this;
        }
        else
        {
            if(tclient.channel)
            {
                tclient.channel.remove(tclient);
            }
            tclient.channel=this;
            this.send( {  cmd :'OpRouter' , args:[ tclient.remoteAddress + ':' + tclient.remotePort] })
        }

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
        log('--' + this.headlog() + 'Channel sock['+ self.opId +'] remove, count=' + this.count() );
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

    //广播消息
    this.broadcast = function( msg ) {
        var ccount = 0;
        for( var i = 0; i < this.list.length; i++ ) {
            var cuser = this.list[i];
            //客户端对象
            if( ! cuser ) continue;
            //如果同步频道,仅广播未同步的
            if(this.syncAll && cuser.syncd)
            {
                continue;
            }

            ccount++;
            //群发
            try
            {
                cuser.sock.write( msg );
                if(this.syncAll)
                {
                    cuser.syncd = true;
                }
                if(config.LogOn)
                    log(self.headlog() + 'broadcast user[' + i + ']:' + cuser.remoteAddress + ':' + cuser.remotePort );
            }
            catch ( err )
            {
                log(self.headlog() + ' broadcast err:'+ err.description );
                onerror = true;
            }
        }
        //客户端数量
        if(config.LogOn)
        {
            log(self.headlog() + 'broadcast to ['+ self.opId +'] ' + ccount + ' users' );
            log('=================================================');
        }
    }

    //关闭频道
    this.close = function (){
        for(var i= 0;i<this.list.length;i++)
        {
            var client=this.list[i];
            if(self.Closed)
            {
                if(client)
                    client.close();
            }
            else
            {
                if(client)
                    client.leaveChannel();
            }
        }
        if(!self.Closed)
        {
            this.sock.destroy();
        }
        if(self.onClose_CallBack)
            self.onClose_CallBack(self.opId);
    }

    //客户端连接相关
    this.sock = new net.Socket();

    var buffer= new ByteRequest();
    //发送消息
    this.send=function(msg){
        var outbuff= new ByteRequest();
        outbuff.writeData(msg);
        this.sock.write(outbuff.buffer);
        //更新存活时间
        self.lastAlive  =   new Date();
    };

    this.headlog = function(){
        if(this.syncAll)
        {
            return 'syncAll ';
        }
        return '';
    };

    this.sock.connect(port, host, function() {
        this.setNoDelay(true);

        log(self.headlog() + 'channel['+ self.opId +']  CONNECTED TO: ' + host + ':' + port);

        // 建立连接后立即向服务器发送数据，服务器将收到这些数据

        if(self.syncAll!=true)
        {
            //使用同步频道 或者切换频道
            var data= { cmd : "Sync" , args : [self.opId] };

            var buff=new ByteRequest();
            buff.writeData(data);
            this.write(buff.buffer);
        }

    });

    this.sock.on('error', function (err) {
        log(self.headlog() + ' channel OnError:' + err  + ' opId:' + self.opId);
        self.Closed=true;
        self.close();
    });


    // 为客户端添加“data”事件处理函数
    // data是服务器发回的数据
    this.sock.on('data', function(data) {

         //更新存活时间
        self.lastAlive  =   new Date();

        buffer.append(data);
        buffer.readData(function(buff,type){
            if(config.LogOn)
            {
                log(self.headlog() +'broadcast data: ' + self.opId + ' size:' + buff.length + " data:" + buff);
            }
            if(syncAll && type==2 )
            {
                //不广播模板数据
                return;
            }
            //转发完整包
            var outbuffer = new ByteRequest();
            //写入原始数据
            outbuffer.writeRaw(buff,type);
            //广播频道消息
            self.broadcast(outbuffer.buffer);
        });

    });

    // 为客户端添加“close”事件处理函数
    this.sock.on('close', function() {
        log(self.headlog() +'Connection closed:' + self.opId);
        log('--' + self.headlog() + 'Channel close:' + self.opId)
        self.Closed=true;
        self.close();
    });

}




