const { SCChunkReader } = require('./SCChunkReader');
const fs = require("fs");
const sc = require("sc-compression");
const { ZstdCodec } = require('zstd-codec');
const lzma = require("lzma");

if (!process.argv[2] || process.argv[2].slice(-3) != ".sc"){
	console.error("Некорректный SC файл!");
	process.exit(1)
};

let data = fs.readFileSync(process.argv[2]);
let showIDs = !process.argv[3] ? true : /true|yes|да/i.test(process.argv[3]);
let saveToFile = !process.argv[4] ? false : /true|yes|да/i.test(process.argv[4]);
let version, decompressed;

if(data[0] == 83 && data[1] == 67) {
    let pre_version = (data.slice(2, 6).readInt32BE())

    if (pre_version == 4) {
        version = (data.slice(6, 10).readInt32BE())
        let hash_length = (data.slice(10, 14).readInt32BE())
        let end_block_size = (data.slice(-4).readInt32BE())

        data = data.slice(14 + hash_length, -end_block_size - 9)
        console.log(`Версия SC заголовка: ${pre_version}\nВерсия SC формата: ${version}`)

    }else{
        version = pre_version
        let hash_length = (data.slice(6, 10).readInt32BE())
        data = data.slice(10 + hash_length)
        console.log(`Версия SC: ${version}`)
    }
};

if([null, 1, 3].includes(version)) {
    try{
        if (Buffer.compare(data.slice(0,4), Buffer.from("SCLZ", 'utf8')) == 0) {
            console.log('[*] Обнаружено LZHAM сжатие!');
            decompressed = sc.decompress(data)
        }else if(Buffer.compare(data.slice(0,4), Buffer.from([0x28, 0xB5, 0x2F, 0xFD])) == 0){
            console.log('[*] Обнаружено Zstandard сжатие!');
            decompressed = (new ZstdCodec.Simple()).decompress(data)
        }else{
            console.log('[*] Обнаружено LZMA сжатие!');
            data = Buffer.concat([data.slice(0,9), Buffer.from([0,0,0,0]), data.slice(9)]);
            decompressed = Buffer.from(lzma.decompress(data))
        }
    }catch (e) {
		fs.writeFileSync("./error.txt", e)
        console.error(`Невозможно распаковать файл!`);
		process.exit(1)
    }
} else {
    decompressed = data
};

const reader = new SCChunkReader(decompressed);

reader.skip(17);

const exportCount = reader.readInt16();
let exportIDs = [];
exports = [];
for (let i = 0; i < exportCount; i++) 
	exportIDs.push(reader.readInt16());

let output = "";
let	clog = saveToFile ? function (...args) {
	output = output + args.join(" ") + "\n"
} : function (...args) {
	console.log(...args)
};

for (let i = 0; i < exportCount; i++) {
	exports.push(reader.readString());
	showIDs ? clog(exportIDs[i], exports[i]) : clog(exports[i])	
};

if (saveToFile) {
	fs.writeFileSync("export_names.txt", output);
	console.log("Вывод сохранён в export_names.txt")
} 
