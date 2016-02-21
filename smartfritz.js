var fritz = require('smartfritz')
var retObject = {Sid:"0", Calls:"0",ListInfos:"0"};
var sid;
var calls;
var listinfos;

module.exports = function (RED) {
  function SmartFritzNode (n) {
        RED.nodes.createNode(this, n);
		var node = this;
		node.fritzip    = n.fritzip;
		node.username   = n.username;
        node.password   = n.password;

		node.on('input', function(msg) {
            try {
                // AB HIER NEBENLAEUFIGKEITEN!!!
                fritz.getSessionID(node.username, node.password, function(sid)
                {
                    console.log("SID =" + sid);
                    retObject.Sid = sid;
                });

                console.log("Fritz!Session ID: "+ sid);
                fritz.getSwitchList(sid,function(listinfos){
                    retObject.ListInfos = listinfos;
                    console.log("Switches AIDs: "+listinfos);
                });

                fritz.getPhoneList(sid,function(calls){
                    retObject.Calls = calls;
                    console.log("Phone List: " + calls);
                });
            } catch (e) {
                console.log("Error!!")
                console.log(e);
            } finally {
                msg.payload = retObject;
                node.send(msg);
            }


        });


	}
	RED.nodes.registerType("smartfritz", SmartFritzNode);
};
