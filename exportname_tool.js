const fs = require("fs");

class SCChunkReader {
	constructor(data) {
		this.data = data
		this.i = 0
	}
	addData(data) {
		Buffer.concat([this.data,data])
	}
	readInt32() {
		var intt = this.data.readInt32LE(this.i)
		this.i += 4
		return intt
	}
	readInt16() {
		var intt = this.data.readInt16LE(this.i)
		this.i += 2
		return intt
	}
	readInt8() {
		var intt = this.data.readInt8(this.i)
		this.i += 1
		return intt
	}
	readString() {
		var length = this.readInt8()
		return this.readBuffer(length).toString()
	}
	readBuffer(length) {
		var buf = this.data.slice(this.i,this.i+length)
		this.i += length
		return buf
	}
	peekBuffer(length,offset) {
		return this.data.slice(this.i+offset,this.i+length+offset)
	}
	logBuffer(length) {
		console.log("logBuffer",this.data.slice(this.i,this.i+length))
		// return this.data.slice(this.i,this.i+length)
	}
	skip(i) {
		this.i += i
	}
}
var data = fs.readFileSync(process.argv[2])
var showIDs = process.argv[3] === "true"||process.argv[3] === "yes"
if(!process.argv[3]){
	showIDs = true
}
var saveToFile = process.argv[4] === "true"||process.argv[3] === "yes"
if(!process.argv[4]){
	saveToFile = false
}
var version = null;var decompressed;

if(data[0] == 83 && data[1] == 67) {
    pre_version = (data.slice(2, 6).readInt32BE())

    if (pre_version == 4) {
        version = (data.slice(6, 10).readInt32BE())
        hash_length = (data.slice(10, 14).readInt32BE())
        end_block_size = (data.slice(-4).readInt32BE())

        data = data.slice(14 + hash_length,-end_block_size - 9)
        console.log("SC header version:",pre_version,"SC format version",version)
	console.log("( pt ) Versão do cabeçalho SC:",pre_version,"Versão do formato SC",version)

    }else{
        version = pre_version
        hash_length = (data.slice(6, 10).readInt32BE())
        data = data.slice(10 + hash_length)
        console.log("SC version: ",version)
	console.log("( pt ) Versão do SC: ",version)
    }
}
if([null, 1, 3].includes(version)) {
    try{
        if (Buffer.compare(data.slice(0,4), Buffer.from("SCLZ", 'utf8')) == 0) {
            console.log('[*] Detected LZHAM compression !')
	    console.log('[*] ( pt ) Compressão LZHAM detectada !')
            decompressed = require("sc-compression").decompress(data)

        }else if(Buffer.compare(data.slice(0,4), Buffer.from([0x28, 0xB5, 0x2F, 0xFD])) == 0){
            console.log('[*] Detected Zstandard compression !')
	    console.log('[*] ( pt ) Compressão Zstandard detectada !')
			const ZstdCodec = require('zstd-codec').ZstdCodec
            decompressed = (new ZstdCodec.Simple()).decompress(data)

        }else{
			const lzma = require("lzma");
            console.log('[*] Detected LZMA compression !')
	    console.log('[*] ( pt ) Compressão LZMA detectada !')
            data = Buffer.concat([data.slice(0,9), Buffer.from([0,0,0,0]), data.slice(9)])
            decompressed = Buffer.from(lzma.decompress(data))

        }
    }catch (e) {
        console.error(e)
        console.log(`Cannot decompress file!`)
	console.log(`( pt ) Não é possível descompactar o arquivo!`)
        return;
    }
} else {
    decompressed = data
}
// console.log(decompressed)
var reader = new SCChunkReader(decompressed)
var shapeCount = reader.readInt16()
var animationsCount = reader.readInt16()
var texturesCount = reader.readInt16()
var textFieldsCount = reader.readInt16()
var matricesCount = reader.readInt16()
var colorTransformsCount = reader.readInt16()
reader.skip(5)

var exportCount = reader.readInt16();
var exportIDs = [];var exports = []
for (let i = 0; i < exportCount; i++) {
	exportIDs.push(reader.readInt16());
}
var toWrite = ""
if(saveToFile) {
	clog = function (...args) {
		toWrite = toWrite + args.join(" ") + "\n"
		console.log(...args)
	}
	done = function () {
		fs.writeFileSync("export_names.txt",toWrite)
		console.log("Saved output to export_names.txt")
		console.log("( pt ) Saída salva em export_names.txt")
	}
}else{
	clog = function (...args) {
		console.log(...args)
	}
	done = function () {}
}
for (let i = 0; i < exportCount; i++) {
	exports.push(reader.readString());
	if(showIDs) {clog(exportIDs[i],exports[i])}else{clog(exports[i])}
	
}
done()
// console.log(exportIDs,exports)
