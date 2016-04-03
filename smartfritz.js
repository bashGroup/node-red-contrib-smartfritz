
var fritz = require('smartfritz');

module.exports = function (RED) {

  	function SmartfritzConfigNode(n) {
  		RED.nodes.createNode(this,n);
  		var node = this;
      node.fritzip = n.fritzip;
      node.debug = n.debug;
      node.username = this.credentials.username;
      node.password = this.credentials.password;
      node.sid = null;

      fritz.getSessionID(node.username, node.password, function (tempSID) {
        node.log('tempSID: ' + tempSID);
        if (tempSID === 0) {
          node.error('Error logging in to Fritz IP: ' + node.config.fritzip + '. \nWrong password?');
          return;
        } else {
          node.sid = tempSID;
        }
      },
      {
        url: node.fritzip
      });

  	}
  	RED.nodes.registerType("smartfritz-config", SmartfritzConfigNode, {
  		credentials: {
  			username: {type: "text"},
  			password: {type: "password"}
  		}
  	});


  /* ---------------------------------------------------------------------------
   * WRITE node
   * -------------------------------------------------------------------------*/
  function FritzWriteNode (n) {
    RED.nodes.createNode(this, n);

    var node = this;
    node.config = RED.nodes.getNode(n.config);
    if(!node.config) {
      node.error("Config node missing");
      node.status({fill:"red",shape:"ring",text:"Error: Config node missing"});
      return;
    }

    node.log('IP: ' + node.config.fritzip);
    node.log('Username: ' + node.config.username);


    node.on('input', function (msg) {
      if (!node.config.sid) {
        node.error('No session id!');
        return;
      }
      try {

            // Get Lists of Switches (AID-List)
          fritz.getSwitchList(tempSID, function (tempAID) {
            if (node.aid !== '0') {
              tempAID = node.aid;
            }
            var tempSwitchState = node.switchstate;
            if(tempSwitchState === 'NaN' || 'msg.payload')
            {
              node.log('Will take msg.payload as SwitchState');
              tempSwitchState = msg.payload;
            }

            switch (tempSwitchState) {
              case ('true' || '1'):
                {
                  node.log('SwitchOn Switch AID: ' + tempAID);
                  fritz.setSwitchOn(tempSID, tempAID, function (funRet) {
                    if (funRet === '') {
                      node.error('Error writing SwitchOn. Switch-ID (AID):' + tempAID);
                    }

                    msg.payload = {
                      switchState: funRet,
                      switchId: tempAID,
                      sessionId: tempSID
                    };
                    node.send(msg);
                  });
                }
                break;
              case ('false' || '0'):
                {
                  fritz.setSwitchOff(tempSID, tempAID, function (funRet) {
                    if (funRet === '') {
                      node.error('Error writing SwitchOff. Switch-ID (AID):' + tempAID);
                    }

                    msg.payload = {
                      switchState: funRet,
                      switchId: tempAID,
                      sessionId: tempSID
                    };
                    node.send(msg);
                  });
                }
                break;
              default:
                node.error('Error interpreting SwitchState: ' + tempSwitchState);
            }
          })
      } catch (err) {
        node.error('Error: ' + err);
      }
    });
  }

  RED.nodes.registerType('fritz write', FritzWriteNode);


  /* ---------------------------------------------------------------------------
	 * READ node
	 * -------------------------------------------------------------------------*/
  function FritzReadNode (n) {
    RED.nodes.createNode(this, n)
    var node = this;

    node.config = RED.nodes.getNode(n.config);
    if(!node.config) {
			node.error("Config node missing");
			node.status({fill:"red",shape:"ring",text:"Error: Config node missing"});
			return;
		}

//    node.fritzip
  //  node.username = n.config.credentials.username;
  //  node.password = n.config.credentials.password;
//    node.log("TestTTT ip: " + node.config.fritzip);
//    node.log('Username: ' + n.config.credentials.username);
//    node.log('Password: ' + node.password);
    node.log('Config-Node:' + JSON.stringify(node.config));
//    node.aid = n.aid;
//    node.switchstate = n.switchstate;


    node.on('input', function (msg) {
      try {
        node.log('Config-Node at read input:' + JSON.stringify(node.config));

        var moreParam = { url: node.config.fritzip }
        node.log('IP: ' + node.config.fritzip);
        //node.log('Username: ' + node.config.credentials.username);
        //node.log('Password: ' + node.config.credentials.password);
        fritz.getSessionID(node.config.credentials.username, node.config.credentials.password, function (tempSID) {
          node.log('tempSID: ' + tempSID);

          if (tempSID === 0) {
            node.error('Error logging in to Fritz IP: ' + node.config.fritzip + '. \nWrong password?')
          }

            // Get Lists of Switches (AID-List)
          fritz.getSwitchList(tempSID, function (tempAID) {
            if (node.aid !== '0') {
              tempAID = node.aid;
            }

            fritz.getSwitchEnergy(tempSID, tempAID, function (switchEnergy) {

              fritz.getSwitchPower(tempSID, tempAID, function (switchPower) {

                fritz.getSwitchState(tempSID, tempAID, function (switchState) {

                  msg.payload = {
                    switchEnergy: switchEnergy,
                    switchPower: switchPower,
                    switchState: switchState
                  };

                  node.log('Sending ' + JSON.stringify(msg.payload));
                  node.send(msg);
                })
              })
            })
          })
        }, moreParam)
      } catch (err) {
        node.error('Error: ' +  err);
      }
    })
  }

  RED.nodes.registerType('fritz read', FritzReadNode);
}
