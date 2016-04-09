var fritz = require('smartfritz');

module.exports = function(RED) {

  function SmartfritzConfigNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    node.fritzip = n.fritzip;
    node.username = this.credentials.username;
    node.password = this.credentials.password;
    node.sid = null;
    var sessionID;

    try {
      node.log('Init SmartfritzConfigNode.')
      if (!node.username) {
        node.log('Replaced empty username with default.')
        node.username = 'admin';
      }
      node.log('Username: ' + node.username)

      fritz.getSessionID(node.username, node.password, function(sessionID) {
        node.log('Session ID: ' + sessionID);
        if ((!sessionID) || (sessionID == '0000000000000000')) {
          node.error('Error logging in to Fritz IP: ' + node.fritzip +
            '. \nWrong password?');
          node.status({
            fill: "red",
            shape: "ring",
            text: "Error"
          });
          return;
        }
        node.sid = sessionID;
      }, {
        url: node.fritzip
      });

    } catch (err) {
      var errText = 'Error while Fritz config. '
      if (err == 'Error: Invalid password') {
        errText += 'Wrong IP (' + node.fritzip +
          ') or Password.'
      }
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error"
      });
      node.error(errText);
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
  function FritzWriteNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    node.config = RED.nodes.getNode(n.config);
    if (!node.config) {
      node.error("Config node missing");
      node.log('node.config:' + JSON.stringify(node.config));
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error"
      });
      return;
    }

    var sessionID;
    var actorID;

    node.on('input', function(msg) {
      node.log('FritzWriteNode called')
      sessionID = node.config.sid

      if (!sessionID) {
        node.error('Error no session established.');
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error"
        });
        return;
      }
      try {
        fritz.getSwitchList(sessionID, function(actorID) {
          if (node.config.aid) {
            node.log('Using configured AID.')
            actorID = node.config.aid;
          }

          if (!actorID) {
            node.error('No Switch found, Fritz IP (' + node
              .config.fritzip + ')');
            node.status({
              fill: "red",
              shape: "ring",
              text: "Error"
            });
            return;
          }
          node.log('AID: ' + actorID)

          var tempSwitchState = node.switchstate;
          if (tempSwitchState === 'NaN' || 'msg.payload') {
            node.log('Will take msg.payload as SwitchState');
            tempSwitchState = msg.payload;
          }

          node.log('Write SwitchState to:' + tempSwitchState)

          if (
            (tempSwitchState == 'true') || (tempSwitchState == '1') ||
            (tempSwitchState == 1)
          ) {
            node.log('SwitchOn Switch AID: ' + actorID);
            fritz.setSwitchOn(sessionID, actorID, function(
              funRet) {
              if (funRet === '') {
                node.error(
                  'Error writing SwitchOn. Fritz IP (' +
                  node.config.fritzip +
                  ')');
                node.status({
                  fill: "red",
                  shape: "ring",
                  text: "Error"
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
            });
          } else if (
            (tempSwitchState == 'false') || (tempSwitchState == '0') ||
            (tempSwitchState == 0)
          ) {
            fritz.setSwitchOff(sessionID, actorID, function(
              funRet) {
              if (funRet === '') {
                node.error(
                  'Error writing SwitchOff. Fritz IP (' +
                  node.config.fritzip +
                  ')');
                node.status({
                  fill: "red",
                  shape: "ring",
                  text: "Error"
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
            });
          } else {
            node.error('Error interpreting SwitchState: ' +
              tempSwitchState);
          }

        })
      } catch (err) {
        node.error('Error: ' + err);
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error"
        });

      }
    });
  }

  RED.nodes.registerType('fritz write', FritzWriteNode);


  /* ---------------------------------------------------------------------------
   * READ node
   * -------------------------------------------------------------------------*/
  function FritzReadNode(n) {
    RED.nodes.createNode(this, n)
    var node = this;

    node.config = RED.nodes.getNode(n.config);
    if (!node.config) {
      node.error("Config node missing");
      node.log('node.config:' + JSON.stringify(node.config));
      node.status({
        fill: "red",
        shape: "ring",
        text: "Error"
      });
      return;
    }

    var sessionID;
    var actorID;

    node.on('input', function(msg) {
      node.log('FritzReadNode called')
      sessionID = node.config.sid

      if (!sessionID) {
        node.error('Error no session established.');
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error"
        });
        return;
      }

      try {
        fritz.getSwitchList(sessionID, function(actorID) {
          if (node.config.aid) {
            node.log('Using configured AID.')
            actorID = node.config.aid;
          }

          if (!actorID) {
            node.error('No Switch found, Fritz IP (' + node
              .config.fritzip + ')');
            node.status({
              fill: "red",
              shape: "ring",
              text: "Error"
            });
            return;
          }
          node.log('AID: ' + actorID)

          fritz.getSwitchEnergy(sessionID, actorID, function(
            switchEnergy) {

            fritz.getSwitchPower(sessionID, actorID,
              function(
                switchPower) {

                fritz.getSwitchState(sessionID, actorID,
                  function(switchState) {


                    msg.payload = {
                      sessionID: sessionID,
                      actorID: actorID,
                      switchState: switchState,
                      switchEnergy: switchEnergy,
                      switchPower: switchPower
                    };

                    if (switchState ==
                      'HTTP/1.0 500 Internal Server Error\nContent-Length: 0\nContent-Type: text/plain; charset=utf-8'
                    ) {
                      node.error(
                        'Switch not ready (yet).'
                      )
                      node.log('msg.payload: ' + JSON.stringify(
                        msg.payload))
                      node.status({
                        fill: "red",
                        shape: "ring",
                        text: "Error"
                      });
                      return
                    }
                    if (
                      (switchEnergy == 'inval') || (
                        switchPower == 'inval') || (
                        switchState == 'inval')
                    ) {
                      node.error(
                        'Error Switch values invalid.'
                      )
                      node.log('msg.payload: ' + JSON.stringify(
                        msg.payload))
                      node.status({
                        fill: "red",
                        shape: "ring",
                        text: "Error"
                      });
                      return
                    }

                    node.status({
                      fill: "green",
                      shape: "dot",
                      text: "OK"
                    });
                    node.send(msg);
                  })
              })
          })
        })
      } catch (err) {
        var errText = 'Error while Fritz read. '
        if (err == 'Error: Invalid password') {
          errText += 'Wrong IP (' + node.config.fritzip +
            ') or Password.'
        }
        node.error(errText);
        node.status({
          fill: "red",
          shape: "ring",
          text: "Error"
        });
        return;
      }
    })
  }

  RED.nodes.registerType('fritz read', FritzReadNode);
}
