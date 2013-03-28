(function () { "use strict";
var $estr = function() { return js.Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function inherit() {}; inherit.prototype = from; var proto = new inherit();
	for (var name in fields) proto[name] = fields[name];
	return proto;
}
var HxOverrides = function() { }
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
}
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
}
var Std = function() { }
Std.__name__ = true;
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
}
var haxe = {}
haxe.Int64 = function(high,low) {
	this.high = high | 0;
	this.low = low | 0;
};
haxe.Int64.__name__ = true;
haxe.Int64.getLow = function(x) {
	return x.low;
}
haxe.Int64.getHigh = function(x) {
	return x.high;
}
haxe.Int64.prototype = {
	__class__: haxe.Int64
}
haxe.ds = {}
haxe.ds.IntMap = function() {
	this.h = { };
};
haxe.ds.IntMap.__name__ = true;
haxe.ds.IntMap.prototype = {
	keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,get: function(key) {
		return this.h[key];
	}
	,set: function(key,value) {
		this.h[key] = value;
	}
	,__class__: haxe.ds.IntMap
}
haxe.io = {}
haxe.io.Bytes = function(length,b) {
	this.length = length;
	this.b = b;
};
haxe.io.Bytes.__name__ = true;
haxe.io.Bytes.alloc = function(length) {
	var a = new Array();
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		a.push(0);
	}
	return new haxe.io.Bytes(length,a);
}
haxe.io.Bytes.ofString = function(s) {
	var a = new Array();
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		var c = s.charCodeAt(i);
		if(c <= 127) a.push(c); else if(c <= 2047) {
			a.push(192 | c >> 6);
			a.push(128 | c & 63);
		} else if(c <= 65535) {
			a.push(224 | c >> 12);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		} else {
			a.push(240 | c >> 18);
			a.push(128 | c >> 12 & 63);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		}
	}
	return new haxe.io.Bytes(a.length,a);
}
haxe.io.Bytes.prototype = {
	toString: function() {
		return this.readString(0,this.length);
	}
	,readString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c2 = b[i++];
				var c3 = b[i++];
				s += fcc((c & 15) << 18 | (c2 & 127) << 12 | c3 << 6 & 127 | b[i++] & 127);
			}
		}
		return s;
	}
	,__class__: haxe.io.Bytes
}
haxe.io.BytesBuffer = function() {
	this.b = new Array();
};
haxe.io.BytesBuffer.__name__ = true;
haxe.io.BytesBuffer.prototype = {
	getBytes: function() {
		var bytes = new haxe.io.Bytes(this.b.length,this.b);
		this.b = null;
		return bytes;
	}
	,addBytes: function(src,pos,len) {
		if(pos < 0 || len < 0 || pos + len > src.length) throw haxe.io.Error.OutsideBounds;
		var b1 = this.b;
		var b2 = src.b;
		var _g1 = pos, _g = pos + len;
		while(_g1 < _g) {
			var i = _g1++;
			this.b.push(b2[i]);
		}
	}
	,__class__: haxe.io.BytesBuffer
}
haxe.io.Input = function() { }
haxe.io.Input.__name__ = true;
haxe.io.Input.prototype = {
	getDoubleSig: function(bytes) {
		return ((bytes[1] & 15) << 16 | bytes[2] << 8 | bytes[3]) * 4294967296. + (bytes[4] >> 7) * -2147483648 + ((bytes[4] & 127) << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7]);
	}
	,readString: function(len) {
		var b = haxe.io.Bytes.alloc(len);
		this.readFullBytes(b,0,len);
		return b.toString();
	}
	,readInt32: function() {
		var ch1 = this.readByte();
		var ch2 = this.readByte();
		var ch3 = this.readByte();
		var ch4 = this.readByte();
		return this.bigEndian?ch4 | ch3 << 8 | ch2 << 16 | ch1 << 24:ch1 | ch2 << 8 | ch3 << 16 | ch4 << 24;
	}
	,readDouble: function() {
		var bytes = [];
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		if(this.bigEndian) bytes.reverse();
		var sign = 1 - (bytes[0] >> 7 << 1);
		var exp = (bytes[0] << 4 & 2047 | bytes[1] >> 4) - 1023;
		var sig = this.getDoubleSig(bytes);
		if(sig == 0 && exp == -1023) return 0.0;
		return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
	}
	,readFloat: function() {
		var bytes = [];
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		bytes.push(this.readByte());
		if(this.bigEndian) bytes.reverse();
		var sign = 1 - (bytes[0] >> 7 << 1);
		var exp = (bytes[0] << 1 & 255 | bytes[1] >> 7) - 127;
		var sig = (bytes[1] & 127) << 16 | bytes[2] << 8 | bytes[3];
		if(sig == 0 && exp == -127) return 0.0;
		return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp);
	}
	,readFullBytes: function(s,pos,len) {
		while(len > 0) {
			var k = this.readBytes(s,pos,len);
			pos += k;
			len -= k;
		}
	}
	,set_bigEndian: function(b) {
		this.bigEndian = b;
		return b;
	}
	,readBytes: function(s,pos,len) {
		var k = len;
		var b = s.b;
		if(pos < 0 || len < 0 || pos + len > s.length) throw haxe.io.Error.OutsideBounds;
		while(k > 0) {
			b[pos] = this.readByte();
			pos++;
			k--;
		}
		return len;
	}
	,readByte: function() {
		return (function($this) {
			var $r;
			throw "Not implemented";
			return $r;
		}(this));
	}
	,__class__: haxe.io.Input
}
haxe.io.BytesInput = function(b,pos,len) {
	if(pos == null) pos = 0;
	if(len == null) len = b.length - pos;
	if(pos < 0 || len < 0 || pos + len > b.length) throw haxe.io.Error.OutsideBounds;
	this.b = b.b;
	this.pos = pos;
	this.len = len;
};
haxe.io.BytesInput.__name__ = true;
haxe.io.BytesInput.__super__ = haxe.io.Input;
haxe.io.BytesInput.prototype = $extend(haxe.io.Input.prototype,{
	readBytes: function(buf,pos,len) {
		if(pos < 0 || len < 0 || pos + len > buf.length) throw haxe.io.Error.OutsideBounds;
		if(this.len == 0 && len > 0) throw new haxe.io.Eof();
		if(this.len < len) len = this.len;
		var b1 = this.b;
		var b2 = buf.b;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			b2[pos + i] = b1[this.pos + i];
		}
		this.pos += len;
		this.len -= len;
		return len;
	}
	,readByte: function() {
		if(this.len == 0) throw new haxe.io.Eof();
		this.len--;
		return this.b[this.pos++];
	}
	,__class__: haxe.io.BytesInput
});
haxe.io.Output = function() { }
haxe.io.Output.__name__ = true;
haxe.io.Output.prototype = {
	writeInt32: function(x) {
		if(this.bigEndian) {
			this.writeByte(x >>> 24);
			this.writeByte(x >> 16 & 255);
			this.writeByte(x >> 8 & 255);
			this.writeByte(x & 255);
		} else {
			this.writeByte(x & 255);
			this.writeByte(x >> 8 & 255);
			this.writeByte(x >> 16 & 255);
			this.writeByte(x >>> 24);
		}
	}
	,writeDouble: function(x) {
		if(x == 0.0) {
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			return;
		}
		var exp = Math.floor(Math.log(Math.abs(x)) / haxe.io.Output.LN2);
		var sig = Math.floor(Math.abs(x) / Math.pow(2,exp) * Math.pow(2,52));
		var sig_h = sig & 34359738367;
		var sig_l = Math.floor(sig / Math.pow(2,32));
		var b1 = exp + 1023 >> 4 | (exp > 0?x < 0?128:64:x < 0?128:0), b2 = exp + 1023 << 4 & 255 | sig_l >> 16 & 15, b3 = sig_l >> 8 & 255, b4 = sig_l & 255, b5 = sig_h >> 24 & 255, b6 = sig_h >> 16 & 255, b7 = sig_h >> 8 & 255, b8 = sig_h & 255;
		if(this.bigEndian) {
			this.writeByte(b8);
			this.writeByte(b7);
			this.writeByte(b6);
			this.writeByte(b5);
			this.writeByte(b4);
			this.writeByte(b3);
			this.writeByte(b2);
			this.writeByte(b1);
		} else {
			this.writeByte(b1);
			this.writeByte(b2);
			this.writeByte(b3);
			this.writeByte(b4);
			this.writeByte(b5);
			this.writeByte(b6);
			this.writeByte(b7);
			this.writeByte(b8);
		}
	}
	,writeFloat: function(x) {
		if(x == 0.0) {
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			this.writeByte(0);
			return;
		}
		var exp = Math.floor(Math.log(Math.abs(x)) / haxe.io.Output.LN2);
		var sig = Math.floor(Math.abs(x) / Math.pow(2,exp) * 8388608) & 8388607;
		var b1 = exp + 127 >> 1 | (exp > 0?x < 0?128:64:x < 0?128:0), b2 = exp + 127 << 7 & 255 | sig >> 16 & 127, b3 = sig >> 8 & 255, b4 = sig & 255;
		if(this.bigEndian) {
			this.writeByte(b4);
			this.writeByte(b3);
			this.writeByte(b2);
			this.writeByte(b1);
		} else {
			this.writeByte(b1);
			this.writeByte(b2);
			this.writeByte(b3);
			this.writeByte(b4);
		}
	}
	,writeFullBytes: function(s,pos,len) {
		while(len > 0) {
			var k = this.writeBytes(s,pos,len);
			pos += k;
			len -= k;
		}
	}
	,write: function(s) {
		var l = s.length;
		var p = 0;
		while(l > 0) {
			var k = this.writeBytes(s,p,l);
			if(k == 0) throw haxe.io.Error.Blocked;
			p += k;
			l -= k;
		}
	}
	,set_bigEndian: function(b) {
		this.bigEndian = b;
		return b;
	}
	,writeBytes: function(s,pos,len) {
		var k = len;
		var b = s.b;
		if(pos < 0 || len < 0 || pos + len > s.length) throw haxe.io.Error.OutsideBounds;
		while(k > 0) {
			this.writeByte(b[pos]);
			pos++;
			k--;
		}
		return len;
	}
	,writeByte: function(c) {
		throw "Not implemented";
	}
	,__class__: haxe.io.Output
}
haxe.io.BytesOutput = function() {
	this.b = new haxe.io.BytesBuffer();
};
haxe.io.BytesOutput.__name__ = true;
haxe.io.BytesOutput.__super__ = haxe.io.Output;
haxe.io.BytesOutput.prototype = $extend(haxe.io.Output.prototype,{
	getBytes: function() {
		return this.b.getBytes();
	}
	,writeBytes: function(buf,pos,len) {
		this.b.addBytes(buf,pos,len);
		return len;
	}
	,writeByte: function(c) {
		this.b.b.push(c);
	}
	,__class__: haxe.io.BytesOutput
});
haxe.io.Eof = function() {
};
haxe.io.Eof.__name__ = true;
haxe.io.Eof.prototype = {
	toString: function() {
		return "Eof";
	}
	,__class__: haxe.io.Eof
}
haxe.io.Error = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] }
haxe.io.Error.Blocked = ["Blocked",0];
haxe.io.Error.Blocked.toString = $estr;
haxe.io.Error.Blocked.__enum__ = haxe.io.Error;
haxe.io.Error.Overflow = ["Overflow",1];
haxe.io.Error.Overflow.toString = $estr;
haxe.io.Error.Overflow.__enum__ = haxe.io.Error;
haxe.io.Error.OutsideBounds = ["OutsideBounds",2];
haxe.io.Error.OutsideBounds.toString = $estr;
haxe.io.Error.OutsideBounds.__enum__ = haxe.io.Error;
haxe.io.Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe.io.Error; $x.toString = $estr; return $x; }
var js = {}
js.Boot = function() { }
js.Boot.__name__ = true;
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2, _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i;
			var str = "[";
			s += "\t";
			var _g = 0;
			while(_g < l) {
				var i1 = _g++;
				str += (i1 > 0?",":"") + js.Boot.__string_rec(o[i1],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) { ;
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
}
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0, _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
}
js.Boot.__instanceof = function(o,cl) {
	try {
		if(o instanceof cl) {
			if(cl == Array) return o.__enum__ == null;
			return true;
		}
		if(js.Boot.__interfLoop(o.__class__,cl)) return true;
	} catch( e ) {
		if(cl == null) return false;
	}
	switch(cl) {
	case Int:
		return Math.ceil(o%2147483648.0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return o === true || o === false;
	case String:
		return typeof(o) == "string";
	case Dynamic:
		return true;
	default:
		if(o == null) return false;
		if(cl == Class && o.__name__ != null) return true; else null;
		if(cl == Enum && o.__ename__ != null) return true; else null;
		return o.__enum__ == cl;
	}
}
js.Boot.__cast = function(o,t) {
	if(js.Boot.__instanceof(o,t)) return o; else throw "Cannot cast " + Std.string(o) + " to " + Std.string(t);
}
var protohx = {}
protohx.CommonError = function(msg) {
};
protohx.CommonError.__name__ = true;
protohx.CommonError.prototype = {
	__class__: protohx.CommonError
}
protohx.Message = function() {
};
protohx.Message.__name__ = true;
protohx.Message.stringToByteArray = function(s) {
	return haxe.io.Bytes.ofString(s);
}
protohx.Message.prototype = {
	writeExtensionOrUnknownFields: function(output) {
		if(this.otherFields != null) {
			var $it0 = this.otherFields.keys();
			while( $it0.hasNext() ) {
				var tag = $it0.next();
				this.writeUnknown(output,tag);
			}
		}
	}
	,defaultUInt64: function() {
		return null;
	}
	,defaultInt64: function() {
		return null;
	}
	,defaultBytes: function() {
		return null;
	}
	,setByTag: function(tag,value) {
		if(this.otherFields == null) this.otherFields = new haxe.ds.IntMap();
		this.otherFields.set(tag,value);
	}
	,getByTag: function(tag) {
		return this.otherFields != null?this.otherFields.get(tag):null;
	}
	,readUnknown: function(input,tag) {
		var value;
		var _g = tag & 7;
		switch(_g) {
		case 0:
			value = protohx.ReadUtils.read__TYPE_UINT64(input);
			break;
		case 1:
			value = protohx.ReadUtils.read__TYPE_FIXED64(input);
			break;
		case 2:
			value = protohx.ReadUtils.read__TYPE_BYTES(input);
			break;
		case 5:
			value = protohx.ReadUtils.read__TYPE_FIXED32(input);
			break;
		default:
			throw new protohx.CommonError("Invalid wire type: " + (tag & 7));
		}
		var currentValue = this.getByTag(tag);
		if(currentValue == null) this.setByTag(tag,value); else if(js.Boot.__instanceof(currentValue,Array)) currentValue.push(value); else this.setByTag(tag,[currentValue,value]);
	}
	,writeUnknown: function(output,tag) {
		if(tag == 0) throw new protohx.CommonError("Attemp to write an undefined string filed: " + tag);
		protohx.WriteUtils.writeUnknownPair(output,tag,this.getByTag(tag));
	}
	,writeSingleUnknown: function(output,tag,value) {
		protohx.WriteUtils.write__TYPE_UINT32(output,tag);
		var _g = tag & 7;
		switch(_g) {
		case 0:
			protohx.WriteUtils.write__TYPE_UINT64(output,value);
			break;
		case 1:
			protohx.WriteUtils.write__TYPE_FIXED64(output,value);
			break;
		case 2:
			protohx.WriteUtils.write__TYPE_BYTES(output,value);
			break;
		case 5:
			protohx.WriteUtils.write__TYPE_FIXED32(output,value);
			break;
		default:
			throw new protohx.CommonError("Invalid wire type: " + (tag & 7));
		}
	}
	,writeToBuffer: function(output) {
		this.writeExtensionOrUnknownFields(output);
	}
	,hasBytes: function(input,bytesAfterSlice) {
		return input.bytesAvailable > bytesAfterSlice;
	}
	,readFromSlice: function(input,bytesAfterSlice) {
		while(input.bytesAvailable > bytesAfterSlice) {
			var tag = protohx.ReadUtils.read__TYPE_UINT32(input);
			this.readUnknown(input,tag);
		}
	}
	,writeDelimitedTo: function(output) {
		var buffer = new protohx.WritingBuffer();
		protohx.WriteUtils.write__TYPE_MESSAGE(buffer,this);
		buffer.toNormal(output);
	}
	,writeTo: function(output) {
		var buffer = new protohx.WritingBuffer();
		this.writeToBuffer(buffer);
		buffer.toNormal(output);
	}
	,mergeDelimitedFrom: function(input) {
		protohx.ReadUtils.read__TYPE_MESSAGE(new protohx.ReadingBuffer(input),this);
	}
	,mergeFrom: function(input) {
		this.readFromSlice(new protohx.ReadingBuffer(input),0);
	}
	,__class__: protohx.Message
}
protohx.ProtocolTypes = function() { }
protohx.ProtocolTypes.__name__ = true;
protohx.Utils = function() { }
protohx.Utils.__name__ = true;
protohx.Utils.getLow = function(i) {
	return js.Boot.__cast(haxe.Int64.getLow(i) , Int);
}
protohx.Utils.getHigh = function(i) {
	return js.Boot.__cast(haxe.Int64.getHigh(i) , Int);
}
protohx.Utils.newInt64 = function(l,h) {
	return new haxe.Int64(h,l);
}
protohx.Utils.newUInt64 = function(l,h) {
	return new haxe.Int64(h,l);
}
protohx.Utils.setOutputEndian = function(out) {
	out.set_bigEndian(false);
}
protohx.Utils.setInputEndian = function(out) {
	out.set_bigEndian(false);
}
protohx.ReadUtils = function() { }
protohx.ReadUtils.__name__ = true;
protohx.ReadUtils.skip = function(input,wireType) {
	switch(wireType) {
	case 0:
		while(input.readUnsignedByte() >= 128) {
		}
		break;
	case 1:
		input.readInt();
		input.readInt();
		break;
	case 2:
		var i = protohx.ReadUtils.read__TYPE_UINT32(input);
		while(i != 0) {
			input.readUnsignedByte();
			i--;
		}
		break;
	case 5:
		input.readInt();
		break;
	default:
		throw new protohx.CommonError("Invalid wire type: " + wireType);
	}
}
protohx.ReadUtils.read__TYPE_DOUBLE = function(input) {
	return input.readDouble();
}
protohx.ReadUtils.read__TYPE_FLOAT = function(input) {
	return input.readFloat();
}
protohx.ReadUtils.read__TYPE_INT64 = function(input) {
	var low = 0;
	var high = 0;
	var b = 0;
	var i = 0;
	while(true) {
		b = input.readUnsignedByte();
		if(i == 28) break; else if(b >= 128) low |= (b & 127) << i; else {
			low |= b << i;
			return protohx.Utils.newInt64(low,high);
		}
		i += 7;
	}
	if(b >= 128) {
		b &= 127;
		low |= b << i;
		high = b >>> 4;
	} else {
		low |= b << i;
		high = b >>> 4;
		return protohx.Utils.newInt64(low,high);
	}
	i = 3;
	while(true) {
		b = input.readUnsignedByte();
		if(i < 32) {
			if(b >= 128) high |= (b & 127) << i; else {
				high |= b << i;
				break;
			}
		}
		i += 7;
	}
	return protohx.Utils.newInt64(low,high);
}
protohx.ReadUtils.read__TYPE_UINT64 = function(input) {
	var tmp = protohx.ReadUtils.read__TYPE_INT64(input);
	return protohx.Utils.newUInt64(js.Boot.__cast(haxe.Int64.getLow(tmp) , Int),js.Boot.__cast(haxe.Int64.getHigh(tmp) , Int));
}
protohx.ReadUtils.read__TYPE_INT32 = function(input) {
	return protohx.ReadUtils.read__TYPE_UINT32(input);
}
protohx.ReadUtils.read__TYPE_FIXED64 = function(input) {
	var low = input.readInt();
	var high = input.readInt();
	return protohx.Utils.newUInt64(low,high);
}
protohx.ReadUtils.read__TYPE_FIXED32 = function(input) {
	return input.readInt();
}
protohx.ReadUtils.read__TYPE_BOOL = function(input) {
	return protohx.ReadUtils.read__TYPE_UINT32(input) != 0;
}
protohx.ReadUtils.read__TYPE_STRING = function(input) {
	var length = protohx.ReadUtils.read__TYPE_UINT32(input);
	return input.readUTFBytes(length);
}
protohx.ReadUtils.read__TYPE_BYTES = function(input) {
	var result = null;
	var length = protohx.ReadUtils.read__TYPE_UINT32(input);
	if(length > 0) result = input.readBytes(length);
	return result;
}
protohx.ReadUtils.read__TYPE_UINT32 = function(input) {
	var result = 0;
	var i = 0;
	while(true) {
		var b = input.readUnsignedByte();
		if(i < 32) {
			if(b >= 128) result |= (b & 127) << i; else {
				result |= b << i;
				break;
			}
		} else {
			while(input.readUnsignedByte() >= 128) {
			}
			break;
		}
		i += 7;
	}
	return result;
}
protohx.ReadUtils.read__TYPE_ENUM = function(input) {
	return protohx.ReadUtils.read__TYPE_INT32(input);
}
protohx.ReadUtils.read__TYPE_SFIXED32 = function(input) {
	return input.readInt();
}
protohx.ReadUtils.read__TYPE_SFIXED64 = function(input) {
	var low = input.readInt();
	var high = input.readInt();
	return protohx.Utils.newInt64(low,high);
}
protohx.ReadUtils.read__TYPE_SINT32 = function(input) {
	return protohx.ZigZag.decode32(protohx.ReadUtils.read__TYPE_UINT32(input));
}
protohx.ReadUtils.read__TYPE_SINT64 = function(input) {
	var result = protohx.ReadUtils.read__TYPE_INT64(input);
	var low = js.Boot.__cast(haxe.Int64.getLow(result) , Int);
	var high = js.Boot.__cast(haxe.Int64.getHigh(result) , Int);
	var lowNew = protohx.ZigZag.decode64low(low,high);
	var highNew = protohx.ZigZag.decode64high(low,high);
	return protohx.Utils.newInt64(lowNew,highNew);
}
protohx.ReadUtils.read__TYPE_MESSAGE = function(input,message) {
	var length = protohx.ReadUtils.read__TYPE_UINT32(input);
	if(input.bytesAvailable < length) throw new protohx.CommonError("Invalid message length: " + length);
	var bytesAfterSlice = input.bytesAvailable - length;
	message.readFromSlice(input,bytesAfterSlice);
	if(input.bytesAvailable != bytesAfterSlice) throw new protohx.CommonError("Invalid nested message");
	return message;
}
protohx.ReadUtils.readPackedRepeated = function(input,readFuntion,value) {
	var length = protohx.ReadUtils.read__TYPE_UINT32(input);
	if(input.bytesAvailable < length) throw new protohx.CommonError("Invalid message length: " + length);
	var bytesAfterSlice = input.bytesAvailable - length;
	while(input.bytesAvailable > bytesAfterSlice) value.push(readFuntion(input));
	if(input.bytesAvailable != bytesAfterSlice) throw new protohx.CommonError("Invalid packed repeated data");
}
protohx.ReadingBuffer = function(bytes) {
	this.length = bytes.length;
	this.bytesAvailable = this.length;
	this.buf = new haxe.io.BytesInput(bytes);
	protohx.Utils.setInputEndian(this.buf);
};
protohx.ReadingBuffer.__name__ = true;
protohx.ReadingBuffer.prototype = {
	readFloat: function() {
		this.bytesAvailable -= 4;
		return this.buf.readFloat();
	}
	,readDouble: function() {
		this.bytesAvailable -= 8;
		return this.buf.readDouble();
	}
	,readUnsignedByte: function() {
		this.bytesAvailable -= 1;
		return this.buf.readByte();
	}
	,readInt: function() {
		this.bytesAvailable -= 4;
		return this.buf.readInt32();
	}
	,readUTFBytes: function(len) {
		this.bytesAvailable -= len;
		return this.buf.readString(len);
	}
	,readBytes: function(len) {
		var b = haxe.io.Bytes.alloc(len);
		this.buf.readBytes(b,0,len);
		this.bytesAvailable -= len;
		return b;
	}
	,__class__: protohx.ReadingBuffer
}
protohx.WireType = function() { }
protohx.WireType.__name__ = true;
protohx.WriteUtils = function() { }
protohx.WriteUtils.__name__ = true;
protohx.WriteUtils.writeSingleUnknown = function(output,tag,value) {
	protohx.WriteUtils.write__TYPE_UINT32(output,tag);
	var _g = tag & 7;
	switch(_g) {
	case 0:
		protohx.WriteUtils.write__TYPE_UINT64(output,value);
		break;
	case 1:
		protohx.WriteUtils.write__TYPE_FIXED64(output,value);
		break;
	case 2:
		protohx.WriteUtils.write__TYPE_BYTES(output,value);
		break;
	case 5:
		protohx.WriteUtils.write__TYPE_FIXED32(output,value);
		break;
	default:
		throw new protohx.CommonError("Invalid wire type: " + (tag & 7));
	}
}
protohx.WriteUtils.writeUnknownPair = function(output,tag,value) {
	var repeated = js.Boot.__instanceof(value,Array)?js.Boot.__cast(value , Array):null;
	if(repeated != null) {
		var _g = 0;
		while(_g < repeated.length) {
			var element = repeated[_g];
			++_g;
			protohx.WriteUtils.writeSingleUnknown(output,tag,element);
		}
	} else protohx.WriteUtils.writeSingleUnknown(output,tag,value);
}
protohx.WriteUtils.writeVarint64 = function(output,low,high) {
	if(high == 0) protohx.WriteUtils.write__TYPE_UINT32(output,low); else {
		var _g = 0;
		while(_g < 4) {
			var i = _g++;
			output.writeByte(low & 127 | 128);
			low >>>= 7;
		}
		if((high & -8) == 0) output.writeByte(high << 4 | low); else {
			output.writeByte((high << 4 | low) & 127 | 128);
			protohx.WriteUtils.write__TYPE_UINT32(output,high >>> 3);
		}
	}
}
protohx.WriteUtils.writeTag = function(output,wireType,number) {
	protohx.WriteUtils.write__TYPE_UINT32(output,number << 3 | wireType);
}
protohx.WriteUtils.write__TYPE_DOUBLE = function(output,value) {
	output.writeDouble(value);
}
protohx.WriteUtils.write__TYPE_FLOAT = function(output,value) {
	output.writeFloat(value);
}
protohx.WriteUtils.write__TYPE_INT64 = function(output,value) {
	protohx.WriteUtils.writeVarint64(output,js.Boot.__cast(haxe.Int64.getLow(value) , Int),js.Boot.__cast(haxe.Int64.getHigh(value) , Int));
}
protohx.WriteUtils.write__TYPE_UINT64 = function(output,value) {
	protohx.WriteUtils.writeVarint64(output,js.Boot.__cast(haxe.Int64.getLow(value) , Int),js.Boot.__cast(haxe.Int64.getHigh(value) , Int));
}
protohx.WriteUtils.write__TYPE_INT32 = function(output,value) {
	if(value < 0) protohx.WriteUtils.writeVarint64(output,value,-1); else protohx.WriteUtils.write__TYPE_UINT32(output,value);
}
protohx.WriteUtils.write__TYPE_FIXED64 = function(output,value) {
	output.writeInt(js.Boot.__cast(haxe.Int64.getLow(value) , Int));
	output.writeInt(js.Boot.__cast(haxe.Int64.getHigh(value) , Int));
}
protohx.WriteUtils.write__TYPE_FIXED32 = function(output,value) {
	output.writeInt(value);
}
protohx.WriteUtils.write__TYPE_BOOL = function(output,value) {
	output.writeByte(value?1:0);
}
protohx.WriteUtils.write__TYPE_STRING = function(output,value) {
	var i = output.beginBlock();
	if(value != null) output.writeUTFBytes(value);
	output.endBlock(i);
}
protohx.WriteUtils.write__TYPE_BYTES = function(output,value) {
	if(value != null) {
		protohx.WriteUtils.write__TYPE_UINT32(output,value.length);
		output.writeBytes(value);
	} else protohx.WriteUtils.write__TYPE_UINT32(output,0);
}
protohx.WriteUtils.write__TYPE_UINT32 = function(output,value) {
	while(true) if((value & -128) == 0) {
		output.writeByte(value);
		return;
	} else {
		output.writeByte(value & 127 | 128);
		value >>>= 7;
	}
}
protohx.WriteUtils.write__TYPE_ENUM = function(output,value) {
	protohx.WriteUtils.write__TYPE_INT32(output,value);
}
protohx.WriteUtils.write__TYPE_SFIXED32 = function(output,value) {
	output.writeInt(value);
}
protohx.WriteUtils.write__TYPE_SFIXED64 = function(output,value) {
	output.writeInt(js.Boot.__cast(haxe.Int64.getLow(value) , Int));
	output.writeInt(js.Boot.__cast(haxe.Int64.getHigh(value) , Int));
}
protohx.WriteUtils.write__TYPE_SINT32 = function(output,value) {
	protohx.WriteUtils.write__TYPE_UINT32(output,protohx.ZigZag.encode32(value));
}
protohx.WriteUtils.write__TYPE_SINT64 = function(output,value) {
	protohx.WriteUtils.writeVarint64(output,protohx.ZigZag.encode64low(js.Boot.__cast(haxe.Int64.getLow(value) , Int),js.Boot.__cast(haxe.Int64.getHigh(value) , Int)),protohx.ZigZag.encode64high(js.Boot.__cast(haxe.Int64.getLow(value) , Int),js.Boot.__cast(haxe.Int64.getHigh(value) , Int)));
}
protohx.WriteUtils.write__TYPE_MESSAGE = function(output,value) {
	var i = output.beginBlock();
	value.writeToBuffer(output);
	output.endBlock(i);
}
protohx.WriteUtils.writePackedRepeated = function(output,writeFunction,value) {
	var i = output.beginBlock();
	var _g1 = 0, _g = value.length;
	while(_g1 < _g) {
		var j = _g1++;
		writeFunction.apply(null,[output,value[j]]);
	}
	output.endBlock(i);
}
protohx.WritingBuffer = function() {
	this.slices = new Array();
	this.buf = new haxe.io.BytesOutput();
	protohx.Utils.setOutputEndian(this.buf);
	this.position = 0;
};
protohx.WritingBuffer.__name__ = true;
protohx.WritingBuffer.prototype = {
	toNormal: function(output) {
		var i = 0;
		var begin = 0;
		var bytes = this.buf.getBytes();
		while(i < this.slices.length) {
			var end = this.slices[i];
			++i;
			if(end > begin) output.writeFullBytes(bytes,begin,end - begin); else if(end < begin) throw new protohx.CommonError("");
			begin = this.slices[i];
			++i;
		}
		output.writeFullBytes(bytes,begin,bytes.length - begin);
	}
	,endBlock: function(beginSliceIndex) {
		this.slices.push(this.position);
		var beginPosition = this.slices[beginSliceIndex + 2];
		this.slices[beginSliceIndex] = this.position;
		protohx.WriteUtils.write__TYPE_UINT32(this,this.position - beginPosition);
		this.slices[beginSliceIndex + 1] = this.position;
		this.slices.push(this.position);
	}
	,beginBlock: function() {
		this.slices.push(this.position);
		var beginSliceIndex = this.slices.length;
		this.slices.push(0);
		this.slices.push(0);
		this.slices.push(this.position);
		return beginSliceIndex;
	}
	,writeByte: function(v) {
		this.buf.writeByte(v);
		this.position += 1;
	}
	,writeInt: function(v) {
		this.buf.writeInt32(v);
		this.position += 4;
	}
	,writeUTFBytes: function(v) {
		var b = haxe.io.Bytes.ofString(v);
		this.buf.write(b);
		this.position += b.length;
	}
	,writeBytes: function(v) {
		this.buf.write(v);
		this.position += v.length;
	}
	,writeFloat: function(v) {
		this.buf.writeFloat(v);
		this.position += 4;
	}
	,writeDouble: function(v) {
		this.buf.writeDouble(v);
		this.position += 8;
	}
	,__class__: protohx.WritingBuffer
}
protohx.ZigZag = function() { }
protohx.ZigZag.__name__ = true;
protohx.ZigZag.encode32 = function(n) {
	return n << 1 ^ n >> 31;
}
protohx.ZigZag.decode32 = function(n) {
	return n >>> 1 ^ -(n & 1);
}
protohx.ZigZag.encode64low = function(low,high) {
	return low << 1 ^ high >> 31;
}
protohx.ZigZag.encode64high = function(low,high) {
	return low >>> 31 ^ high << 1 ^ high >> 31;
}
protohx.ZigZag.decode64low = function(low,high) {
	return high << 31 ^ low >>> 1 ^ -(low & 1);
}
protohx.ZigZag.decode64high = function(low,high) {
	return high >>> 1 ^ -(low & 1);
}
var shareLib = {}
shareLib.Main = function() { }
shareLib.Main.__name__ = true;
shareLib.Main.main = function() {
}
Math.__name__ = ["Math"];
Math.NaN = Number.NaN;
Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Math.isFinite = function(i) {
	return isFinite(i);
};
Math.isNaN = function(i) {
	return isNaN(i);
};
String.prototype.__class__ = String;
String.__name__ = true;
Array.prototype.__class__ = Array;
Array.__name__ = true;
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
haxe.io.Output.LN2 = Math.log(2);
protohx.WireType.VARINT = 0;
protohx.WireType.FIXED_64_BIT = 1;
protohx.WireType.LENGTH_DELIMITED = 2;
protohx.WireType.FIXED_32_BIT = 5;
shareLib.Main.main();

    global.ShareObject={};
    global.ShareObject["protohx"] = protohx;
    global.ShareObject["haxeio"] = haxe.io;
})();

Buffer.prototype.toByteArray = function () {
    return Array.prototype.slice.call(this, 0)
}

var ShareObject = global.ShareObject;

OutStream = function(){

    this.buffer=new ShareObject.protohx.WritingBuffer();

    this.bytes=function(){
      return this.buffer.buf.b.b;
    };

    this.offset=function(){
       return this.buffer.buf.pos;
    };

    this.writeVarint32 = function(value){
        ShareObject.protohx.WriteUtils.write__TYPE_SINT32(this.buffer,value);
    } ;

    this.writeBool = function(value){
        ShareObject.protohx.WriteUtils.write__TYPE_BOOL(this.buffer,value);
    };

    this.writeString = function(value){
        var buff=ShareObject.haxeio.Bytes.ofString(value);
        ShareObject.protohx.WriteUtils.write__TYPE_BYTES(this.buffer,buff);

    };

    this.writeRaw = function(value){
        this.buffer.writeBytes(new ShareObject.haxeio.Bytes(value.length,value));
    };

    this.writeFloat = function(value){
        ShareObject.protohx.WriteUtils.write__TYPE_FLOAT(this.buffer,value);
    };
};

InStream = function(buff){

    this.buffer=new ShareObject.protohx.ReadingBuffer(new ShareObject.haxeio.Bytes(buff.length,buff));

    this.bytes=function(){
        return this.buffer.buf.b.b;
    };

    this.offset=function(){
        return this.buffer.buf.pos;
    };

    this.readVarint32 = function(){
        return ShareObject.protohx.ReadUtils.read__TYPE_SINT32(this.buffer);
    } ;

    this.readBool = function(){
        return ShareObject.protohx.ReadUtils.read__TYPE_BOOL(this.buffer);
    };

    this.readString = function(){

      var bytes=  ShareObject.protohx.ReadUtils.read__TYPE_BYTES(this.buffer);
      return   bytes.toString();
    };

    this.readFloat = function(value){
        ShareObject.protohx.ReadUtils.read__TYPE_FLOAT(this.buffer,value);
    };
};