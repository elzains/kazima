const welcome = require('cli-welcome');
const pkg = require('./../package.json');
const unhandled = require('cli-handle-unhandled');

module.exports = ({ clear = true }) => {
	unhandled();
	welcome({
		title: `KAZIMA CLI`,
		tagLine: `by Qusthantinia Team`,
		description: pkg.tagline,
		version: pkg.versions,
		bgColor: '#DC0A16',
		color: '#000000',
		bold: true,
		clear
	});
};
