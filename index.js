const fs = require(`fs`);
const moment = require('moment-timezone');
const archiver = require(`archiver`);
const Discord = require(`discord.js`);

const TorchLogsLocation = `C:\\Users\\Administrator\\Desktop\\Server\\Logs`
const TempLocation = `C:\\Users\\Administrator\\Documents\\LogDumper\\Temp`;

function getCurrentDate() {
	return moment().format(`YYYY-MM-DD`)
}

function getCurrentDateAndTimeGB() {
	return moment().tz(`Europe/London`).format(`YYYY-MM-DD-HH-mm-zz`);
}

const currentDate = getCurrentDate();
const zipFileName = `Torch-Logs-${getCurrentDateAndTimeGB()}.zip`;
const logFiles = [`Keen`, `Torch`, `ownerships`, `deleted-basic`, `BlockLimiter`];
const hook = new Discord.WebhookClient(``, ``, {retryLimit: 3});

logFiles.forEach((fileName) => {
	try {
		fs.copyFileSync(`${TorchLogsLocation}\\${fileName}-${currentDate}.log`, `${TempLocation}\\Logs\\${fileName}-${currentDate}.log`);
	} catch (error) {
		console.log(error);
	}
});
console.log(`files copied`);

const output = fs.createWriteStream(`${TempLocation}\\${zipFileName}`);
const archive = archiver(`zip`, {
	zlib: {level: 9}
});

output.on(`close`, () => {
	console.log(archive.pointer() + ' total bytes');
	console.log('archiver has been finalized and the output file descriptor has closed.');
	hook.send({
		files: [{
			attachment: `${TempLocation}\\${zipFileName}`,
			name: `${zipFileName}`
		}]
	})
	.then((res) => {
		logFiles.forEach((fileName) => {
			try {
				fs.unlinkSync(`${TempLocation}\\Logs\\${fileName}-${currentDate}.log`);
			} catch (error) {
				console.log(error);
			}
		});
		fs.unlinkSync(`${TempLocation}\\${zipFileName}`);
		process.exit();
	})
	.catch((error) => {
		console.log(error);
		process.exit();
	});
});

output.on('end', function() {
	console.log('Data has been drained');
});

archive.on('warning', function(err) {
	console.log(err);
	if (err.code === 'ENOENT') {
	  // log warning
	} else {
	  // throw error
	  throw err;
	}
});

archive.on(`error`, function(err) {
	console.log(error);
})

archive.pipe(output);
archive.directory(`${TempLocation}\\Logs`, false);
archive.finalize();