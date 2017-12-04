'use strict'
const phantom = require('phantom')
const Hapi = require('hapi')
const server = new Hapi.Server()
server.connection = { port: 3000, host: '0.0.0.0' }
let instance, page, status

const watermelon = async () => {
  instance = await phantom.create()
  page = await instance.createPage()
  status = await page.open("https://gothere.sg/api/maps/examples/directions-advanced.html")
  return status
}

server.start((err) => {
    if (err) {
        throw err;
    }
    watermelon().then(value => {
      console.log(`${value}`)
      console.log(`Server running at: ${server.info.uri}`)
    })
    console.log(`Server running at: ${server.info.uri}`)
})

server.route({
  method: 'GET',
  path: '/{vertex1}/{vertex2}/{mode}',
  handler: async (request, reply) => {

    await page.on('onResourceRequested', function(requestData) {
      console.info('Requesting', requestData.url)
    });

    let vertex1 = request.params.vertex1
    let vertex2 = request.params.vertex2
    let mode    = request.params.mode
    page.onConsoleMessage = function(msg, lineNum, sourceId) {
      //console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
      reply(msg)
    };

    page.evaluate(function(data){
      GEvent.addListener(directions, "addoverlay", function() {
        // console log to catch on page.
        var routes = document.querySelector("#gotheredir ol").children;
        var obj = {}
        var timeAndPrice = document.querySelector(".gotheresum").innerHTML.split("(");
        var firstItem = timeAndPrice[0].trim();
        var secondItem = timeAndPrice[1].trim();

        if (firstItem[0] === '$'){
          obj.price = firstItem.substring(1);
          obj.time = secondItem.replace("min)", "").trim();
        } else {
          obj.price = secondItem.substring(1, secondItem.length - 1);
          obj.time = firstItem.replace("min", "").trim();
        }
        obj.routes = [];
        for (var i = 0; i < routes.length; i++){
          obj.routes.push(routes[i].textContent);
        }
        console.log(JSON.stringify(obj));
      });
      getDirections(data[0].replace(/%20/g, " "), data[1].replace(/%20/g, " "), data[2]);
    }, data);

  }
})