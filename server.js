var page = require('webpage').create();
var server = require('webserver').create();
var system = require('system');
var host, port;

page.onResourceError = function(resourceError) {
  system.stderr.writeLine('= onResourceError()');
  system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
  system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
};

if (system.args.length !== 2) {
  console.log('Usage: server.js <some port>');
  phantom.exit(1);
} else {
  port = system.args[1];
  
  page.open("https://gothere.sg/api/maps/examples/directions-advanced.html", function (status) {
    if (status === 'success'){
      console.log("API up, started listening at " + port);
      var service = server.listen(port, function (request, response) {
        var data = request.url.substring(1).split('/')
        console.log('Request received at ' + new Date());

        page.onConsoleMessage = function(msg, lineNum, sourceId) {
          console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
          response.write(msg);
          response.close();
        };

        if (data.length > 1){
            response.statusCode = 200;
            response.headers = {
                'Cache': 'no-cache',
                'Content-Type': 'application/json',
            }
            page.evaluate(function(data){
              GEvent.addListener(directions, "addoverlay", function() {
                // console log to catch on page.
                var routes = document.querySelector("#gotheredir ol").children;
                var obj = {}
                var timeAndPrice = document.querySelector(".gotheresum").innerHTML.split("(");
                var time = timeAndPrice[0].trim();
                var price = timeAndPrice[1];

                obj.time = time.substring(0, time.length - 3).trim();
                obj.price = price.substring(1, price.length - 1);
                obj.mode = data[2];
                obj.routes = [];
                for (var i = 0; i < routes.length; i++){
                  obj.routes.push(routes[i].textContent);
                }
                console.log(JSON.stringify(obj));
              });
              getDirections(data[0].replace(/%20/g, " "), data[1].replace(/%20/g, " "), data[2]);
            }, data);
        }
      });
    } else {
      console.error("API down.");
    }
  });
}