// Remember, the controller power is USB until the power is hard wired to draw
//  off the power supply.
//  serial port for the pi  /dev/ttyS0 - GPIO
//  serial port for the pi  /dev/ttyACM0 - USB
//  serial port for the pi  /dev/ttyACM1 - USB
var SerialPort = require('serialport');
var log = null;
var port = null;
// Permission errors on ttyAMAO - 
//  Need to RUN AS SUDO, correct permissions later.
//  sudo chmod 660 /dev/ttyAMA0
//  sudo usermod -G tty pi
//  sudo chmod 777 /dev/ttyAMA0

function init() {
    return new Promise(function(fulfill, reject){
        port = new SerialPort('/dev/ttyS0', function(err) {
            if(err) {
                logger.error("Error Opening Port.", err);
                reject(err);
            } else {
                logger.debug("Port open");
                fulfill();
            }
        });
    });
}

// move creation to separate init function. promisify
function write(channel, position) {
    return new Promise(function(fulfill, reject){
        // setup buffer, 4 byte, byte array.
        let buffer = []; 
        buffer.push(0x84);  // Compact Protocol
        buffer.push(0x2);  // Channel Number
        buffer.push(position & 0x7f);  // Target
        buffer.push((position >>> 7) & 0x7f);  // Target
        logger.debug(buffer);
        // port = new SerialPort('/dev/ttyAMA0', function(err) {
            port.write(buffer, function(err) {
                if (err) {
                    logger.error("Serial Port write error: " + err.message);
                    reject(err);
                } else {
                    logger.info("Wrote: " + buffer);
                    // port.close();
                    fulfill();
                }
            });
        // });
    });
}

function close() {
    port.close();
}

function listPorts() {
    return new Promise(function(fulfill, reject) {
        SerialPort.list(function (err, ports) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                ports.forEach(function(port) {
                    logger.info(port.comName);
                    logger.info(port.pnpId);
                    logger.info(port.manufacturer);
                });
                fulfill();
            }
        });
    });
}

module.exports = function(log) {
    logger = log;
    return {
        init: init,
        write: write,
        listPorts: listPorts,
        close: close
    }
}