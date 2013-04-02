var zlib = require("zlib");
require('./ShareLib.js');
var config = require('./config.json');



//===================================================================
//Buff二进制输出
//===================================================================
Buffer.prototype.toByteArray = function () {
    return Array.prototype.slice.call(this, 0)
}


//===================================================================
//输出日志
//===================================================================
log = function ( msg ) {
    if(!msg)
    {
        console.log("bad!!!");
    }
    if(config.LogOn)
        if(!config.DataDumpOn)
        {
            if(msg.toString().indexOf(">>")==0 || msg.toString().indexOf("<<")==0 )
                 return;
        }
    var data= new Date();
    console.log( data.toLocaleTimeString()  + ':' + data.getMilliseconds() + ' ' + msg );
}

var clientIdSeed = 1000;
//===================================================================
//客户端
//===================================================================
Client = function(sock)
{
    this.sock=sock;
    this.sock.setNoDelay(true);
    this.remoteAddress = sock.remoteAddress;
    this.remotePort =  sock.remotePort;
    this.disconnect = false;
    this.byteRequest = new ByteRequest();
    //是否已经同步过
    this.syncd       = false;
    this.clientId   = clientIdSeed++;
    this.channel;
    this.syncchannel;
    this.error = 0;
    var self = this;

    this.onClose=function(callback){
        this.onClose_CallBack=callback;
    };


    this.send=function(data){
        var outbuff= new ByteRequest();
        outbuff.writeData(data);
        sock.write(outbuff.buffer);
    };

    this.close=function(){

        if(this.disconnect)
            return;

        this.disconnect=true;
        log('[' + this.clientId +']CLOSED: ' +  this.remoteAddress + ':' + this.remotePort );

        if(this.onClose_CallBack)
            this.onClose_CallBack();

        this.leaveChannel();
        this.sock.destroy();

    };

    this.leaveChannel=function()
    {
        if(this.channel!=null)
        {
            this.channel.remove(this);
            log('[' + this.clientId +']Remove From Channel:' + this.channel.opid);
        }
        if(this.syncchannel!=null)
        {
            this.syncchannel.remove(this);
            log('[' + this.clientId +']Remove From SyncChannel:' + this.syncchannel.opid);
        }
        syncd=false;
        this.channel=null;
        this.syncchannel=null;
    }
};


//请求命令
ByteRequest = function()
{
    this.buffer=new Buffer(0);

    var headLenght = 4;

    //追加数据到缓冲区
    //无返回
    this.append = function( buf )
    {
        var re = new Buffer( this.buffer.length + buf.length);
        this.buffer.copy( re );
        buf.copy( re, this.buffer.length );
        this.buffer = re;
    }

    this.readCmd=function(callback){
      this.readData(callback);
    };

    this.readData=function(callback){
        while(true)
        {
            if(this.buffer.length<=headLenght)
            {
                 break;
            }

            if(config.LogOn)
                log('>>buffer:[' + this.buffer + ']' + this.buffer.toByteArray());

            var inStream = new InStream(this.buffer);

            var lenght=inStream.readVarint32();

            var datatype=inStream.readVarint32();

            var mylenght=inStream.offset();

            if(config.LogOn)
                log('Read Lenght:' + lenght +
                    ' Buff Lenght:'+ this.buffer.length +
                    ' ReadHead:' + mylenght + ' DataType:' + datatype);

            if(lenght<=0)
            {
                this.buffer = new Buffer(0);
                log('drop>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
            }
            if(this.buffer.length>=lenght + mylenght)
            {
                var data = this.buffer.slice(mylenght, lenght + mylenght);
                if(datatype == 1)
                {
                    if(config.LogOn)
                        log("zlib...");

                    zlib.inflateRaw(data, function(err, buffer) {
                        if (!err) {
                            if(callback){
                                callback(buffer);
                            }
                        }
                    });
                }
                else if(datatype == 2)
                {

                }
                else
                {
                    if(config.LogOn)
                        log(">>callback:" + data);

                    if(callback){
                        callback(data);
                    }
                }

                this.buffer= this.buffer.slice(lenght + inStream.offset());
            }
            else
            {
                if(config.LogOn)
                    log('wating....');
                break;
            }

            if(config.LogOn)
                if(this.buffer.length>0)
                    log('>>left:[' + this.buffer.toByteArray() + ']');
        }
    };



    this.writeData=function(data){
        var jsonstr = JSON.stringify(data);
        if(config.LogOn)
            log('<<write:' + jsonstr);
        var buff= new Buffer(jsonstr);
        var outStream = new OutStream();
        outStream.writeVarint32(buff.length);
        var dt = 0;
        if( dt == 0 )
        {
            outStream.writeVarint32(dt);
            outStream.writeRaw(buff);

            this.buffer=new Buffer(outStream.bytes());
        }
    };
}

//表
Hashtable =function (){
    this.clear = hashtable_clear;
    this.containsKey = hashtable_containsKey;
    this.containsValue = hashtable_containsValue;
    this.get = hashtable_get;
    this.isEmpty = hashtable_isEmpty;
    this.keys = hashtable_keys;
    this.put = hashtable_put;
    this.remove = hashtable_remove;
    this.size = hashtable_size;
    this.toString = hashtable_toString;
    this.values = hashtable_values;
    this.hashtable = new Array();

    var classkey="__class__";

    function hashtable_clear(){
        this.hashtable = new Array();
    }

    function hashtable_containsKey(key){
        var exists = false;
        for (var i in this.hashtable) {
            if (i == key && this.hashtable[i] != null ) {
                exists = true;
                break;
            }
        }
        return exists;
    }

    function hashtable_containsValue(value){
        var contains = false;
        if (value != null) {
            for (var i in this.hashtable) {
                if (this.hashtable[i] == value) {
                    contains = true;
                    break;
                }
            }
        }
        return contains;
    }

    function hashtable_get(key){
        return this.hashtable[key];
    }

    function hashtable_isEmpty(){
        return (this.size == 0) ? true : false;
    }

    function hashtable_keys(){
        var keys = new Array();
        for (var i in this.hashtable) {
            if (this.hashtable[i] != null && i!=classkey)
                keys.push(i);
        }
        return keys;
    }

    function hashtable_put(key, value){
        if (key == null || value == null) {
            throw 'NullPointerException {' + key + '},{' + value + '}';
        }else{
            this.hashtable[key] = value;
        }
    }

    function hashtable_remove(key){
        var rtn = this.hashtable[key];
        //this.hashtable[key] =null;
        this.hashtable.splice(key,1);
        return rtn;
    }

    function hashtable_size(){
        var size = 0;
        for (var i in this.hashtable) {
            if (this.hashtable[i] != null && i !=classkey )
                size ++;
        }
        return size;
    }

    function hashtable_toString(){
        var result = '';
        for (var i in this.hashtable)
        {
            if (this.hashtable[i] != null
                //&& i !=classkey
                )
                result += '{' + i + '},{' + this.hashtable[i] + '}/n';
        }
        return result;
    }

    function hashtable_values(){
        var values = new Array();
        for (var i in this.hashtable) {
            if (this.hashtable[i] != null)
                values.push(this.hashtable[i]);
        }
        return values;
    }


}

