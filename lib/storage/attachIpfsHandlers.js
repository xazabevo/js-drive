const ArrayBlockIterator = require('../blockchain/iterator/ArrayBlockIterator');
const StateTransitionHeaderIterator = require('../blockchain/iterator/StateTransitionHeaderIterator');
const rejectAfter = require('../util/rejectAfter');
const InvalidPacketCidError = require('./InvalidPacketCidError');

const PIN_REJECTION_TIMEOUT = 1000 * 60 * 3;

/**
 * Add State Transition Packet from blockchain when new ST header will appear.
 * Remove State Transition Packet from blockchain when wrong sequence.
 * Remove all State Transition Packets from blockchain when reset.
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {IpfsAPI} ipfsAPI
 * @param {unpinAllIpfsPackets} unpinAllIpfsPackets
 */
function attachIpfsHandlers(stHeadersReader, ipfsAPI, unpinAllIpfsPackets) {
  const { stHeaderIterator: { rpcClient } } = stHeadersReader;

  stHeadersReader.on('header', async ({ header }) => {
    const pinPromise = ipfsAPI.pin.add(header.getPacketCID(), { recursive: true });
    const error = new InvalidPacketCidError();

    await rejectAfter(pinPromise, error, PIN_REJECTION_TIMEOUT);
  });

  stHeadersReader.on('wrongSequence', async (block) => {
    const blockIterator = new ArrayBlockIterator([block]);
    const stHeadersIterator = new StateTransitionHeaderIterator(blockIterator, rpcClient);

    let done;
    let header;

    // eslint-disable-next-line no-cond-assign
    while ({ done, value: header } = await stHeadersIterator.next()) {
      if (done) {
        break;
      }

      await ipfsAPI.pin.rm(header.getPacketCID(), { recursive: true });
    }
  });

  stHeadersReader.on('reset', async () => {
    await unpinAllIpfsPackets();
  });
}

Object.assign(attachIpfsHandlers, {
  PIN_REJECTION_TIMEOUT,
});

module.exports = attachIpfsHandlers;