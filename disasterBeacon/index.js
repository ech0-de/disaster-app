#!/bin/node

// required modules
const os = require('os');
const dgram = require('dgram');
const request = require('request');
const logger = require('simple-node-logger');

// beacon configuration
const REPLICATION_INTERVAL = 3; // 3 seconds
const BEACON_INTERVAL = 10; // 10 seconds
const DELTA_T = 60 * 1; // 1 minute

// url of the local couchdb instance and the database name
const COUCHDB = 'http://[::1]:5984/';
const DATABASE = 'disaster-app';

// ipv6 all-nodes multicast address
const BROADCAST_ADDR = 'FF02:0:0:0:0:0:0:1';
const BEACON_PORT = 5555;

// create udp socket for udp broadcasts
const socket = dgram.createSocket('udp6');

// initialize log file
const log = logger.createSimpleLogger('disaster-beacon.log');

// helper function to get current timestamp in seconds
const time = function() { return Date.now() / 1000; };
const START_TIME = time();

// detect all IPv6 addresses of the local node
const networkInterfaces = os.networkInterfaces();
const LOCAL_ADDRESSES = [];

Object.keys(networkInterfaces).forEach((key) => {
    networkInterfaces[key].forEach((nic) => {
        if (nic.family === 'IPv6') {
            LOCAL_ADDRESSES.push(nic.address);
        }
    });
});

const nearbyNodes = { };
// dictionary to store detected nodes and additional information
/* Example: 
 * const nearbyNodes = {
 *   'fe80::7261:a82f:f26f:7c5f': {
 *      lastReplication: 1444490900,
 *      receivedBeacons: [
 *          1444490800,
 *          1444490830,
 *          1444490890,
 *      ],
 *      availabilityRatio: 0.25,
 *      numberOfReplications: 2,
 *      numberOfErrors: 1,
 *      errorRatio: 0.5,
 *      endLastSeq: 5
 *   },
 * };
 *
 * Every node entry SHOULD contain the following fields and is identified by its
 * link-local ipv6 address:
 * - lastReplication (number): Required
 *    Timestamp of the last replication (Seconds since 1970-01-01 00:00:00)
 * - receivedBeacons (array): Required
 *    Timestamps of the beacons that where received during the last DELTA_T seconds
 * - availabilityRatio (number): 
 *    Number of received beacons (receivedBeacons.length) divided by the number
 *    of beacons that could be received in DELTA_T seconds (DELTA_T / BEACON_INTERVAL)
 * - numberOfReplications (number): Required
 *    Number of successful replications to this node
 * - numberOfErrors (number): Required
 *    Number of failed replications to this node
 * - errorRatio (number): Required
 *    Number of failed replications divided by the number of succesful replications
 *    (numberOfErrors / numberOfReplications)
 * - endLastSeq (number):
 *    Last processed Update Sequence ID of the remote node
 */

// method to send an udp broadcast (= beacon) to inform nearby nodes about ourself
function sendBeacon() {
    var m = new Buffer('some payload!');

    socket.send(m, 0, m.length, BEACON_PORT, BROADCAST_ADDR, (err, c) => {
        if (err) {
            log.error(err);
            return;
        }

        log.info(`beacon sent with ${c} bytes ("${m.toString()}")`);
    });
}

// bind socket to BEACON_PORT
socket.bind(BEACON_PORT);

// emitted when socket starts listening
socket.on('listening', () => {
    const address = socket.address();
    log.info(`disasterBeacon listening on [${address.address}]:${address.port}`);
    log.info('START_TIME = ', START_TIME);
});

// emitted when an incoming beacon is received
socket.on('message', (msg, source) => {
    // check if the received beacon originated from another node 
    if (LOCAL_ADDRESSES.indexOf(source.address) !== -1) {
        log.info('ignoring local beacon from ' + source.address);
        return;
    }

    log.info('retrieved beacon from ' + source.address);

    // if we see this node for the first time, initialize a map entry for it
    if (!nearbyNodes[source.address]) {
        nearbyNodes[source.address] = {
            lastReplication: 0,
            receivedBeacons: [],
            availabilityRatio: 1,
            numberOfReplications: 0,
            numberOfErrors: 0,
            errorRatio: 0,
            endLastSeq: 0
        };
    }

    const now = time();

    // record the received beacon in the nodes map
    nearbyNodes[source.address].receivedBeacons.push(now);

    // throw away old timestamps
    nearbyNodes[source.address].receivedBeacons = nearbyNodes[source.address].receivedBeacons.filter((e) => {
        return (e - now + DELTA_T) > 0;
    });

    // update the availability ratio
    nearbyNodes[source.address].availabilityRatio = nearbyNodes[source.address].receivedBeacons.length / (DELTA_T / BEACON_INTERVAL);
});

// method to invoke a replication with another node
function initiateReplication() {
    const address = calculateBestNode();
    if (!address) {
        // abort replication, when there is no node that needs one
        log.info('there are currently no nodes to start a replication');
        return;
    }

    log.info('replicate with ' + address);

    // initiate replication process with the target node
    request.post({
        url: COUCHDB + '_replicate',
        json: true,
        body: {
            source: DATABASE,
            target: 'http://[' + address + ']:5984/' + DATABASE
        }
    }, (err, res, body) => {
        // record the timestamp of the last successful replication
        nearbyNodes[address].lastReplication = time();
        nearbyNodes[address].numberOfReplications += 1;

        // take note, if the replication was not successful
        if (err || res.statusCode != 200) {
            nearbyNodes[address].numberOfErrors += 1;
            nearbyNodes[address].errorRatio = nearbyNodes[address].numberOfErrors / nearbyNodes[address].numberOfReplications;

            log.error(err);
            return;
        }

        // save the new remote state, after the successful replication
        nearbyNodes[address].endLastSeq = body.history[0].end_last_seq;

        // log the replication result, it might contain useful information
	log.info('succesful replication with ' + address);
	log.info(body);
    });
}

// calculate the best node to initiate a replication attempt and return its address
function calculateBestNode(lastSeq) {
    log.info('nearbyNodes: ', JSON.stringify(nearbyNodes));

    const weights = Object.keys(nearbyNodes).filter((address) => {
        // filter nodes that might have recent data
        return (lastSeq > nearbyNodes[address].endLastSeq && nearbyNodes[address].availabilityRatio > 0);
    }).map((address) => {
        const node = nearbyNodes[address];

        let weight = (time() - node.lastReplication) * node.availabilityRatio;
	weight *= Math.pow(2, -(1 - node.errorRatio));
        weight *= Math.pow(2, -(node.endLastSeq / lastSeq));
	
        return [address, weight]
    }).sort((a, b) => {
        return b[1] - a[1];
    });

    log.info('weights: ', JSON.stringify(weights));
    
    if (weights.length > 0)
        return weights.shift().shift();

    return null;
}

// send beacon every BEACON_INTERVAL seconds
setInterval(sendBeacon, BEACON_INTERVAL * 1000);

// try to initiate a replication every REPLICATION_INTERVAL seconds
setInterval(initiateReplication, REPLICATION_INTERVAL * 1000);
