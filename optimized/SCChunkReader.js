class SCChunkReader {
	constructor(data) {
		this.data = data
		this.i = 0
	};

	addData(data) {
		Buffer.concat([this.data, data])
	};

	readInt32() {
		let int = this.data.readInt32LE(this.i);
		this.i += 4;
		return int
	};

	readInt16() {
		let int = this.data.readInt16LE(this.i);
		this.i += 2;
		return int
	};

	readInt8() {
		let int = this.data.readInt8(this.i);
		this.i += 1;
		return int
	};

	readString() {
		let length = this.readInt8();
		return this.readBuffer(length).toString()
	};

	readBuffer(length) {
		let buf = this.data.slice(this.i, this.i + length);
		this.i += length;
		return buf
	};

	peekBuffer(length,offset) {
		return this.data.slice(this.i + offset, this.i + length + offset)
	};

	logBuffer(length) {
		console.log(`logBuffer: ${this.data.slice(this.i, this.i + length)}`)
	};

	skip(i) {
		this.i += i
	}
};

module.exports = { SCChunkReader }