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
 1. Access the disasterApp using the displayed URL

### disasterBeacon
Due to an unresolved Erlang bug (see [Connection to IPv6 link local address fails due to missing scope identifier](http://erlang.org/pipermail/erlang-bugs/2010-October/002065.html)) it is not possible to replicate to a remote database using an IPv6 link local address.
As a workaround Erlang's native IP implementation can be patched, by modifying the `inet_set_address` method in `otp/erts/emulator/drivers/common/inet_drv.c`.
This method is used to set the ip address for a connection.
To use link local addresses one has to set the `sin6_scope_id` field in the `sockaddr` struct, to the correct value.
Since this value is only used for link local addresses, any other communication is unaffected by this workaround.
(see also [man 7 ipv6](http://linux.die.net/man/7/ipv6))

 1. Make sure that couchDB listens on all IPv6 addresses, by setting `chttpd.bind_address = ::`
 1. Change to the `disasterBeacon` directory
 1. Run `npm install` to install all dependencies with npm
 1. Start the disasterBeacon with `node index.js` or any node process manager (e.g. pm2)

Deploying disasterApp on a Raspberry Pi
---------------------------------------
![disasterApp on a Raspberry Pi](https://cloud.githubusercontent.com/assets/1503861/21144676/dfae9424-c14b-11e6-9a17-618e2e100b0b.jpg)
 1. Attach two WLAN USB dongles to the Raspberry Pi
 1. Configure one as an access point (e.g. using [hostapd](https://w1.fi/hostapd/)), through which a user device can be connected
 1. Configure the other one in IBSS mode
 1. Install all dependencies and follow the "Getting Started" instructions

Other resources
---------------
 * Dominik Meißner, Benjamin Erb, Rens van der Heijden, Kristin Lange, and Frank Kargl. 2016. Mobile triage management in disaster area networks using decentralized replication. In Proceedings of the Eleventh ACM Workshop on Challenged Networks (CHANTS '16). ACM, New York, NY, USA, 7-12. DOI: http://dx.doi.org/10.1145/2979683.2979689
