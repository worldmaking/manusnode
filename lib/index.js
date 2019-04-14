// hello.js
const manus = require('../build/Release/manusnode');

console.log(manus.connectApollo());
// Prints: '...testing'

console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));




// const addon = require('../build/Release/manusnode-native');

// function Manusnode(name) {
//     this.greet = function(str) {
//         return _addonInstance.greet(str);
//     }

//     var _addonInstance = new addon.Manusnode(name);
// }

// module.exports = Manusnode;
