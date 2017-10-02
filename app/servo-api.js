// Remember, the controller power is USB until the power is hard wired to draw
//  off the power supply.
//  serial port for the pi  /dev/ttyAMA0 - GPIO
//  serial port for the pi  /dev/ttyACM0 - USB
//  serial port for the pi  /dev/ttyACM1 - USB
var SerialPort = require('serialport');
var log = null;
// Permission errors on ttyAMAO - 
//  Need to RUN AS SUDO, correct permissions later.
//  sudo chmod 660 /dev/ttyAMA0
//  sudo usermod -G tty pi
//  sudo chmod 777 /dev/ttyAMA0



// move creation to separate init function. promisify
function write(positionData, duration, y) {
    // setup buffer, 4 byte, byte array.
    let buffer = new Uint8Array(4); 
    buffer[0] = 0x84;  // Compact Protocol
    buffer[1] = 0x02;  // Channel Number
    buffer[2] = positionData[2].positions[y] & 0x7f;  // Target
    buffer[3] = (positionData[2].positions[y] >>> 7) & 0x7f;  // Target
    let port = new SerialPort('/dev/ttyAMA0', function(err) {
        if(err) {
            logger.error("Error Opening Port.", err);
        } else {
            port.write(buffer, function(err) {
                if (err) {
                    logger.error("Serial Port write error: " + err.message);
                }
                logger.info('Ear buffer, frame ' + y +' = ' + buffer);
                port.close();
                //sleep(duration);  // delay;
                setTimeout(function(){ 
                    writeLoop(positionData, duration, y+1);},duration);                
            });
        }
    });
    //port.drain();
}


function listPorts() {
    SerialPort.list(function (err, ports) {
        ports.forEach(function(port) {
            logger.info(port.comName);
            logger.info(port.pnpId);
            logger.info(port.manufacturer);
        });
    });
}

module.exports = function(log) {
    logger = log;
    return {
        write: write,
        listPorts: listPorts
    }
}