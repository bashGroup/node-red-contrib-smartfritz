
var fritz = require('fritzapi');

module.exports = function(RED) {
  /* ---------------------------------------------------------------------------
   * CONFIG node
   * -------------------------------------------------------------------------*/
function SmartfritzConfigNode(n){
    RED.nodes.createNode(this, n);
    var node = this;
    node.fritzip = n.fritzip;
    node.sid = null;
    var sessionID;
    node.refreshSessionId = function(){
      node.log('Triggerd session ID refresh');
      fritz.getSessionID(node.credentials.username, node.credentials.password, 'url: ' + node.fritzip ).then(function(sessionID){
         node.log('New session ID: ' + sessionID);
         if ((!sessionID) || (sessionID == '0000000000000000')) {
           node.error('Error logging in to Fritz IP: ' + node.fritzip + '. \nWrong password?');
           return;
         }
         node.sid = sessionID;
      });
    }
    try {
      node.log('Init SmartfritzConfigNode.');
      if (!node.credentials.username) {
        node.error('Empty username.');
        return;
      }
      node.log('Username: ' + node.credentials.username);
      node.refreshSessionId();
      node.log('SessionID: ' + node.sid );
      setInterval(node.refreshSessionId, 1800000); //30min
    } catch (err) {
      node.error(err + ' IP (' + node.fritzip + ').');
      return;
    }
  }
RED.nodes.registerType("smartfritz-config", SmartfritzConfigNode, {
    credentials: {
      username: {
        type: "text"
      },
      password: {
        type: "password"
      }
    }
  });

  /* ---------------------------------------------------------------------------
   * WRITE node
   * -------------------------------------------------------------------------*/
function FritzWriteNode(n){
    RED.nodes.createNode(this, n);
    var node = this;
    node.config = RED.nodes.getNode(n.config);

    if (!node.config) {
      node.error("Config node missing.");
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error. Config node missing."
      });
      return;
    }

    var sessionID;
    var actorID;

    node.on('input', function(msg) {
      sessionID = node.config.sid;
      node.log('FritzWriteNode called with SID: ' + sessionID);

      if (!sessionID) {
        node.error('No session established.');
        node.status({
          fill: "red",
          shape: "ring",
          text: "Write-Error. No session established. " + sessionID
        });
        return;
      }

        fritz.getSwitchList(sessionID, 'url: ' + node.config.fritzip).then(function(actorID) {
          if (n.aid) {
            node.log('Using configured AID.');
            actorID = n.aid;
          }

          if (!actorID) {
            node.error('No Switch found, Fritz IP (' + node.config.fritzip + ')');
            node.status({
              fill: "red",
              shape: "ring",
              text: "Error. No Switch found, Fritz IP (" + node.config.fritzip + ")"
            });
            return;
          }
          node.log('AID: ' + actorID);
          node.log('Write SwitchState to:' + msg.payload);

          function retSwitchOnOff(funRet) {
            if (funRet === '') {
              node.error('Error writing Switch. Fritz IP (' + node.config.fritzip + ')');
              node.status({
                fill: "red",
                shape: "ring",
                text: "Error writing Switch. Fritz IP (" + node.config.fritzip + ")"
              });
              return;
            }

            msg.payload = {
              sessionId: sessionID,
              actorID: actorID,
              switchState: funRet
            };
            node.status({
              fill: "green",
              shape: "dot",
              text: "OK"
            });
            node.send(msg);
          }

          if ( (msg.payload === 'true') || (msg.payload === '1') || (msg.payload === 1) || (msg.payload === true) ) {
            node.log('SwitchOn Switch AID: ' + actorID);
            fritz.setSwitchOn(sessionID, actorID, retSwitchOnOff);
          } else if ( (msg.payload === 'false') || (msg.payload === '0') || (msg.payload === 0) || (msg.payload === false) ) {
            node.log('SwitchOff Switch AID: ' + actorID);
            fritz.setSwitchOff(sessionID, actorID, retSwitchOnOff);
          } else {
            node.error('Error interpreting SwitchState: ' +  msg.payload);
          }

        }).catch(function (e) {
          node.error('Error: ' + e);
          node.status({
            fill: "red",
            shape: "ring",
            text: "Error" + e + e.message
          });
        });
    });
  }
RED.nodes.registerType('fritz write', FritzWriteNode);

  /* ---------------------------------------------------------------------------
   * READ node
   * -------------------------------------------------------------------------*/
function FritzReadNode(n){
  RED.nodes.createNode(this, n);
  var node = this;
  node.config = RED.nodes.getNode(n.config);

  if (!node.config) {
    node.error("Config node missing");
    node.status({
      fill: "red",
      shape: "ring",
      text: "Error. Config node missing"
    });
    return;
  }

  var sessionID;
  var actorID;

  node.on('input', function(msg) {
    sessionID = node.config.sid;
    fritz.getSwitchList(sessionID, 'url: ' + node.config.fritzip).then(function(actorID) {
      if (n.aid) {
            node.log('Using configured AID.');
            actorID = n.aid;
          }

      if (!actorID) {
            node.error('No Switch found, Fritz IP (' + node.config.fritzip + ')');
            node.status({
              fill: "red",
              shape: "ring",
              text: "Error. No Switch found, Fritz IP (" + node.config.fritzip + ")"
            });
            return;
          }
      node.log('AID: ' + actorID);
      fritz.getSwitchEnergy(sessionID, actorID,  'url: ' + node.config.fritzip).then(function(switchEnergy) {

        fritz.getSwitchPower(sessionID, actorID,  'url: ' + node.config.fritzip).then(function(switchPower) {

          fritz.getSwitchState(sessionID, actorID,  'url: ' + node.config.fritzip).then(function(switchState) {

            fritz.getTemperature(sessionID, actorID,  'url: ' + node.config.fritzip).then(function(temperature) {

                msg.payload = {
                    sessionID: sessionID,
                    actorID: actorID,
                    switchState: switchState,
                    switchEnergy: switchEnergy,
                    switchPower: switchPower,
                    temperature: temperature
                };

                if (temperature == 'HTTP/1.0 500 Internal Server Error\nContent-Length: 0\nContent-Type: text/plain; charset=utf-8') {
                    node.error( 'Switch not ready (yet).' );
                    node.log('msg.payload: ' + JSON.stringify(msg.payload));
                    node.status({
                      fill: "red",
                      shape: "ring",
                      text: "Error. Switch not ready (yet)."
                    });
                    return;
                }
                if (
                    (switchEnergy === 'inval') ||
                    (switchPower === 'inval') ||
                    (switchState === 'inval') ||
                    (temperature === 'inval')
                ) {
                    node.error(
                      'Error Switch values invalid.'
                    );
                    node.log('msg.payload: ' + JSON.stringify(
                      msg.payload));
                    node.status({
                      fill: "red",
                      shape: "ring",
                      text: "Error. Switch values invalid."
                    });
                    return;
                }

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "OK"
                  });
                node.send(msg);
            });
          });
        });
      }).catch(function(e) {
            node.error('Error: ' + e + e.message);
          });
    }).catch(function(e) {
          node.error('Error: ' + e + e.message);
          node.status({
            fill: "red",
            shape: "ring",
            text: "Error" + e.message
          });
        });
  });
}
RED.nodes.registerType('fritz read', FritzReadNode);
};
