disasterApp
===========

A prototypical triage management system based on commodity hardware and software components using a single-hop, ad-hoc network architecture with multi-master replication, a tablet-based device setup, and a mobile application for emergency services.

Dependencies
------------
 * [CouchDB](https://couchdb.apache.org/)
 * [CouchApp](https://github.com/couchapp/couchapp)
 * [Node.js](https://nodejs.org/)

Getting Started
---------------

### disasterApp
 1. Ensure that all dependencies are installed and available in your PATH
 1. Change to the `disasterApp` directory
 1. Run `npm install` to install all client dependencies with npm
 1. Run `gulp dist` to pack all client dependencies together
 1. Modify the `.couchapprc` according to your CouchDB configuration
 1. Run `npm run deploy` to push the application to your CouchDB instance

Deploying disasterApp on a Raspberry Pi
---------------------------------------
![disasterApp on a Raspberry Pi](https://cloud.githubusercontent.com/assets/1503861/21144676/dfae9424-c14b-11e6-9a17-618e2e100b0b.jpg)
 1. Attach two WLAN USB dongles to the Raspberry Pi
 1. Configure one as an access point, through which a user device can be connected
 1. Configure the other one in IBSS mode
 1. Install all dependencies and follow the "Getting Started" instructions
