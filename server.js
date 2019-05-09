const express = require('express');
const bodyParser = require('body-parser');
const spawn = require('child_process');

const config = require('config');
const port = config.has('port') ? config.get('port') : 80;

const { 
  HeatingDevice,
  Eq3CommandFactory
} = require('./lib/heating');

const baseCommand = config.has('executeCommand') ? config.get('executeCommand') : undefined;
const scriptBase = './eq3.exp';

app = express();
app.use(bodyParser.json());

app.post('/:mac/:type/:command', (req, res) => {
  let devices = config.has('devices') ? config.get('devices') : [];
  let success = false;

  if (!devices.length) {
    return res.json({
      success,
      message: 'Es ist keine Konfiguration vorhanden'
    });
  }

  devices = devices.filter((device) => device.mac.replace(/\:/g, '') === req.params.mac);

  if (!req.params || !req.params.mac || !devices.length) {
    return res.status(400).json({
      success: false,
      message: 'Es konnte kein Gerät gefunden werden.'
    });
  }

  const type = req.params.type || undefined;
  const cmd = (req.params.command || undefined).replace('_', ' ');
  const parameters = req.body.parameters || [];

  if (!type || !cmd) {
    return res.status(400).json({
      success: false,
      message: 'Es wurde kein korrekter Befehl aufgerufen.'
    });
  }

  let attempts = 0;
  success = true;
  const [ deviceConfig ] = devices;
  const device = new HeatingDevice(deviceConfig.mac);
  
  establishConnection(device, (success, data) => {
    data.message = data.message.replace(/\n|\r|\t/g, '')

    try {
      data.message = JSON.parse(data.message);
    }
    catch (e) {}

    return res.json({
      success,
      request: {
        executable: data.executable 
      },
      response: {
        attempts, 
        data: data.message
      }
    });
  });

  function establishConnection(device, callback) {
    const command = Eq3CommandFactory.createCommand(type, cmd, parameters);
    const executable = Eq3CommandFactory.getExecutable(scriptBase, command, device);
    const ssh = spawn.exec(baseCommand.replace('[eq3-command]', executable));

    let message = '';
  
    ssh.stdout.on('data', (data) => {
      error = false;
      message += data;
    });
  
    ssh.stderr.on('data', (err) => {
      error = true;
      attempts += 1;
    });
  
    ssh.on('close', (code) => {
      if (attempts > 5) {
        return callback(false, {message: 'too much attempts', executable});
      }
      if (!connectionFailed(message)) {
        return callback(true, {message, executable});
      }
  
      attempts++;
      return establishConnection(device, callback);
    })
  }
  
  function connectionFailed(message) {
    return message.indexOf('Connection failed') !== -1;
  }
});

app.listen(port, () => {
  console.log('listening on port ' + port);
});