// client.js

const net = require('net')

var HOST = '127.0.0.1'
var PORT = 49010

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST +':'+ PORT)

    client.write('Hello..')

})

client.on('data', function(data) {
    console.log('DATA: ' + data)

    client.destroy()
})
