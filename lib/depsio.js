var fs = require('fs');
var path = require('path');
var https = require('https');
var querystring = require('querystring');


function getPackageVersion(rootDir, packageName) {
  var package_path = path.resolve(rootDir, packageName, "package.json");
  
  if (fs.existsSync(package_path)) {
    var version = JSON.parse(fs.readFileSync(package_path)).version || '<unknown>';
    return [packageName, version];
  }

  return [];
}

function getPackages(rootDir) {
  var packages = [];

  var modules_path = path.resolve(rootDir, "node_modules");
  var dirs = fs.readdirSync(modules_path);
  dirs.forEach(function(dir) {
    var info = getPackageVersion(modules_path, dir);
    if (info.length > 0) {
      packages.push(info);
    }
  });

  return packages;
}

function updateDependencies(apiKey, deps) {
  var data = querystring.stringify({
    dependencies: deps,
    type: "npm"
  });

  var params = {
      host: 'deps.io',
      port: 443,
      path: '/api/v1/apps/' + apiKey + '/update.json',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
      }
  };

  var req = https.request(params, function(res) {
    console.log("Deps.io: dependencies updated");
  });
  req.write(data);
  req.end();  
}

module.exports = {

  createClient: function(apiKey) {
    if (apiKey == undefined) {
      console.err("Deps.io: apikey is undefined");
      return;
    }

    var packages = getPackages(process.cwd());
    updateDependencies(apiKey, JSON.stringify(packages));
  }
}