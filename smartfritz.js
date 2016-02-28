var fritz = require('smartfritz')
var retObject = {
    Sid: "0",
    ListInfos: "0"
};

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
                var sid;
                fritz.getSessionID(node.username, node.password, function(sid)
                {
                    var listinfos;
                    fritz.getSwitchList(sid,function(listinfos){

                            node.log("Fritz!Session ID: "+ sid);
                            retObject.Sid = sid;

                            node.log("Switches AIDs: " + listinfos);
                            retObject.ListInfos = listinfos;

                            msg.payload = retObject;

                            node.send(msg);
                    });
                });



            } catch (e) {
                node.log("Error!!")
                node.log(e);
            }
        });


	}
	RED.nodes.registerType("smartfritz", SmartFritzNode);
};
