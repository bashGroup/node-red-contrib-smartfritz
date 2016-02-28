var fritz = require('smartfritz')
var retObject = {
  SID: 'NaN',
  AID: 'NaN',
  SwitchEnergy: 'NaN',
  SwitchPower: 'NaN',
  SwitchState: 'NaN'
}

module.exports = function (RED) {
  function FritzWriteNode (n) {
    RED.nodes.createNode(this, n)
    var node = this
    node.fritzip = n.fritzip
    node.username = n.username
    node.password = n.password
    node.aid = n.aid
    node.switchstate = n.switchstate

    node.on('input', function (msg) {
      try {
        var moreParam = { url: node.fritzip }
        fritz.getSessionID(node.username, node.password, function (tempSID) {
          node.log('IP: ' + node.fritzip)
          node.log('Username: ' + node.username)
          node.log('Password: ' + node.password)
          node.log('tempSID: ' + tempSID)

          if (tempSID === 0) {
            node.error('Error logging in to Fritz IP: ' + node.fritzip + '. \nWrong password?')
          }

            // Get Lists of Switches (AID-List)
          fritz.getSwitchList(tempSID, function (tempAID) {
            if (node.aid !== '0') {
              tempAID = node.aid
            }
            var tempSwitchState = node.switchstate
            if(tempSwitchState === 'NaN' || 'msg.payload')
            {
              node.log('Will take msg.payload as SwitchState')
              tempSwitchState = msg.payload
            }

            switch (tempSwitchState) {
              case ('true' || '1'):
                {
                  node.log('SwitchOn Switch AID: ' + tempAID)
                  fritz.setSwitchOn(tempSID, tempAID, function (funRet) {
                    if (funRet === '') {
                      node.error('Error writing SwitchOn. Switch-ID (AID):' + tempAID)
                    }
                    node.log('Fritz!Session ID: ' + tempSID)
                    retObject.SID = tempSID

                    node.log('Switches AIDs: ' + tempAID)
                    node.log('Info node.aid:' + node.aid)
                    retObject.AID = tempAID

                    node.log('SwitchState: ' + funRet)
                    retObject.SwitchState = funRet

                    msg.payload = retObject
                    node.send(msg)
                  })
                }
                break;
              case ('false' || '0'):
                {
                  fritz.setSwitchOff(tempSID, tempAID, function (funRet) {
                    if (funRet === '') {
                      node.error('Error writing SwitchOff. Switch-ID (AID):' + tempAID)
                    }
                    node.log('SwitchOff Switch AID: ' + tempAID)
                    node.log('Fritz!Session ID: ' + tempSID)
                    retObject.SID = tempSID

                    node.log('Switches AIDs: ' + tempAID)
                    node.log('Info node.aid:' + node.aid)
                    retObject.AID = tempAID

                    node.log('SwitchState: ' + funRet)
                    retObject.SwitchState = funRet

                    msg.payload = retObject
                    node.send(msg)
                  })
                }
                break;
              default:
                node.error('Error interpreting SwitchState: ' + tempSwitchState)
            }
          })
        }, moreParam)
      } catch (e) {
        node.log('Error!!')
        node.log(e)
      }
    })
  }

  RED.nodes.registerType('fritz write', FritzWriteNode)

  function FritzReadNode (n) {
    RED.nodes.createNode(this, n)
    var node = this
    node.fritzip = n.fritzip
    node.username = n.username
    node.password = n.password
    node.aid = n.aid
    node.switchstate = n.switchstate

    node.on('input', function (msg) {
      try {
        var moreParam = { url: node.fritzip }
        fritz.getSessionID(node.username, node.password, function (tempSID) {
          node.log('IP: ' + node.fritzip)
          node.log('Username: ' + node.username)
          node.log('Password: ' + node.password)
          node.log('tempSID: ' + tempSID)

          if (tempSID === 0) {
            node.error('Error logging in to Fritz IP: ' + node.fritzip + '. \nWrong password?')
          }

            // Get Lists of Switches (AID-List)
          fritz.getSwitchList(tempSID, function (tempAID) {
            if (node.aid !== '0') {
              tempAID = node.aid
            }

            fritz.getSwitchEnergy(tempSID, tempAID, function (SwitchEnergy) {

              fritz.getSwitchPower(tempSID, tempAID, function (SwitchPower) {

                fritz.getSwitchState(tempSID, tempAID, function (SwitchState) {

                  node.log('SID: ' + tempSID)
                  retObject.SID = tempSID

                  node.log('AID: ' + tempAID)
                  retObject.AID = tempAID

                  node.log('SwitchEnergy: ' + SwitchEnergy)
                  retObject.SwitchEnergy = SwitchEnergy

                  node.log('SwitchPower: ' + SwitchPower)
                  retObject.SwitchPower = SwitchPower

                  node.log('SwitchState: ' + SwitchState)
                  retObject.SwitchState = SwitchState

                  msg.payload = retObject
                  node.send(msg)
                })
              })
            })
          })
        }, moreParam)
      } catch (e) {
        node.log('Error!!')
        node.log(e)
      }
    })
  }

  RED.nodes.registerType('fritz read', FritzReadNode)
}
