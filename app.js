const crops = require('./crops');
const envfile = require('node-env-file');
const moment = require('moment');
require('console-stamp')(console, {
  formatter: function() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }
});
envfile(__dirname + '/.env');
console.log("__dirname: %s" , __dirname);
console.log("PORT:%s", process.env.PORT);
let server = crops().listen(process.env.PORT, function () {
	let host = server.address().address;
	if (host == "::") {
		host = "localhost";
	}
	let port = server.address().port;
	console.log("app listening at http://%s:%s/", host, port);
})