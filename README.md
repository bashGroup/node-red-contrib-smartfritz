# SmartFritz for Node-RED
Easily integrate AVM Fritz!Dect 200 switches into your node-RED flow. Based on the SmartFritz library.
Please make sure to give some critical feedback. :)

## Installation
Use `npm install node-red-contrib-smartfritz` to install.

## Usage
This package provides nodes to read and write signals to Fritz!Dect 200 switches via Node-RED. The configuration node lets you setup your Fritz!Box account and Actor Identification (AID).

The fritz read node is used to read the switch state (1/on, 0/off) from a Fritz!Dect 200 device. Make sure to use a valid AID or leave it empty. The message contains the info structure in `msg.payload`.

The fritz write node is used to write the switch state (1/on, 0/off) from a Fritz!Dect 200 device. Make sure to use a valid AID or leave it empty. The message can contain boolean or string values in `msg.payload`.

## Contributing
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

## Credits
Pedro Reboredo

## License
MIT
