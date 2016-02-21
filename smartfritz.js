var fritz = require('smartfritz')

module.exports = function (RED) {
  function SmartFritzNode (n) {
        RED.nodes.createNode(this, n);
		var node = this;
		node.fritzip    = n.fritzip;
		node.username   = n.username;
        node.password   = n.password;

		node.on('input', function(msg) {
            try {
                fritz.getSessionID(node.username, node.password, function(sid)
                {
                    console.log(sid);
                });
            } catch (e) {
                console.log("Error!!")
                console.log(e);
            }
        });

	}
	RED.nodes.registerType("smartfritz", SmartFritzNode);
};
