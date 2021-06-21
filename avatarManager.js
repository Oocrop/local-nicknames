const fs = require("fs");
const path = require("path");

if (!fs.existsSync(path.join(__dirname, "avatars")))
	fs.mkdirSync(path.join(__dirname, "avatars"));

const cache = {};

module.exports = {
	getAvatarUrl: (id, asDataUri) => {
		if (!fs.existsSync(path.join(__dirname, "avatars", id))) return false;
		if (cache[id]) return cache[id][asDataUri ? "dataUri" : "objectUrl"];
		const dataUri = fs
			.readFileSync(path.join(__dirname, "avatars", id))
			.toString("utf-8");
		const data = Uint8Array.from(
			Buffer.from(dataUri.split(",")[1], "base64")
		);
		const mimeType = dataUri.split(";")[0].split(":")[1];
		cache[id] = {
			objectUrl: URL.createObjectURL(
				new Blob([data], { type: mimeType })
			),
			dataUri: dataUri
		};
		return cache[id][asDataUri ? "dataUri" : "objectUrl"];
	},
	setAvatar: (id, dataUri) => {
		fs.writeFileSync(path.join(__dirname, "avatars", id), dataUri);
		const data = Uint8Array.from(
			Buffer.from(dataUri.split(",")[1], "base64")
		);
		const mimeType = dataUri.split(";")[0].split(":")[1];
		cache[id] = {
			objectUrl: URL.createObjectURL(
				new Blob([data], { type: mimeType })
			),
			dataUri: dataUri
		};
	},
	removeAvatar: id => {
		if (cache[id])
			URL.revokeObjectURL(cache[id].objectUrl), delete cache[id];
		if (fs.existsSync(path.join(__dirname, "avatars", id)))
			fs.unlinkSync(path.join(__dirname, "avatars", id));
	},
	clearCache: () => {
		for (var k in cache) {
			URL.revokeObjectURL(cache[k].objectUrl);
			delete cache[k];
		}
	}
};
