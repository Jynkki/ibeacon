var iotf = require("ibmiotf");
var noble = require('noble');
var fs = require('fs');

var RSSI_THRESHOLD    = -90;
var EXIT_GRACE_PERIOD = 10000; // milliseconds
var BEACONNAME = "MiniBeacon";

if (process.argv[2] === '-l') {
   var config = require("./secrets/device.json");
   var appClientConfig = JSON.parse(fs.readFileSync('./secrets/device.json', 'utf8'));
} else {
   var config = JSON.parse(fs.readFileSync('/run/secrets/ibmbeacon', 'utf8'));  
}

var inRange = [];

var deviceClient = new iotf.IotfDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();
deviceClient.on('connect', function(){
});

deviceClient.on('reconnect', function(){
});

deviceClient.on('disconnect', function(){
    process.exit(0);
});

deviceClient.on('error', function (argument) {
    console.log(argument);
});


noble.on('discover', function(peripheral) {
    if (peripheral.rssi < RSSI_THRESHOLD) {
        //ignore
        return;
    }

    var id = parseInt(peripheral.id, 16);
    var entered = !inRange[id];
    inRange[id] = {
        peripheral: peripheral
    };
     
    if (entered) {
       inRange[id] = {
           peripheral: peripheral
       };
       if (typeof peripheral.advertisement.localName !== 'undefined' && (peripheral.advertisement.localName.indexOf(BEACONNAME) !== -1) ) {
           console.log('"' + peripheral.advertisement.localName + '" entered (RSSI ' + peripheral.rssi + ') ' + new Date());
           deviceClient.publish('Beacon', 'json', '{"BeaconId": "'+peripheral.advertisement.localName+'","Beacon":"entered" }', 2);
       }

    inRange[id].lastSeen = Date.now();
    } else {
        inRange[id].lastSeen = Date.now();
    }
});

setInterval(function() {
    for (var id in inRange) {
        if (inRange[id].lastSeen < (Date.now() - EXIT_GRACE_PERIOD)) {
            var peripheral = inRange[id].peripheral;
            if (typeof peripheral.advertisement.localName !== 'undefined' && (peripheral.advertisement.localName.indexOf(BEACONNAME) !== -1) ) {
                console.log('"' + peripheral.advertisement.localName + '" exited (RSSI ' + peripheral.rssi + ') ' + new Date());
                deviceClient.publish('Beacon', 'json', '{"BeaconId": "'+peripheral.advertisement.localName+'","Beacon":"exited" }', 2);
            }
            delete inRange[id];
        }
    }
}, EXIT_GRACE_PERIOD / 2);

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning([], true);
        console.log('Scanning Started');
    } else {
        noble.stopScanning();
        console.log('Scanning Stopped');
    }
});

 
 
