const {
  tendermint: {
    abci: {
      ResponseInfo,
    },
  },
} = require('@dashevo/abci/types');

const { asValue } = require('awilix');

const NoPreviousBlockExecutionStoreTransactionsFoundError = require('./errors/NoPreviousBlockExecutionStoreTransactionsFoundError');

const { version: driveVersion } = require('../../../package');

/**
 * @param {ChainInfoExternalStoreRepository} chainInfoRepository
 * @param {Number} protocolVersion
 * @param {RootTree} rootTree
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {BaseLogger} logger
 * @param {
 *   PreviousBlockExecutionStoreTransactionsRepository
 * } previousBlockExecutionStoreTransactionsRepository
 * @param {AwilixContainer} container
 * @return {infoHandler}
 */
function infoHandlerFactory(
  chainInfoRepository,
  protocolVersion,
  rootTree,
  updateSimplifiedMasternodeList,
  logger,
  previousBlockExecutionStoreTransactionsRepository,
  container,
) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @return {Promise<ResponseInfo>}
   */
  async function infoHandler(request) {
    let contextLogger = logger.child({
      abciMethod: 'info',
    });

    contextLogger.debug('Info ABCI method requested');
    contextLogger.trace({ request });

    const chainInfo = await chainInfoRepository.fetch();

    container.register({
      chainInfo: asValue(chainInfo),
    });

    contextLogger = contextLogger.child({
      height: chainInfo.getLastBlockHeight().toString(),
    });

    if (chainInfo.getLastBlockHeight().gt(0)) {
      // If the current block is higher than 1 we need to obtain previous block data
      if (!container.has('previousBlockExecutionStoreTransactions')) {
        // If container doesn't have previous transactions, load them from file (node cold start)
        const previousBlockExecutionStoreTransactions = (
          await previousBlockExecutionStoreTransactionsRepository.fetch()
        );

        if (!previousBlockExecutionStoreTransactions) {
          throw new NoPreviousBlockExecutionStoreTransactionsFoundError();
        }

        container.register({
          previousBlockExecutionStoreTransactions: asValue(previousBlockExecutionStoreTransactions),
        });
      }

      // Update SML store to latest saved core chain lock to make sure
      // that verfy chain lock handler has updated SML Store to verify signatures
      const lastCoreChainLockedHeight = chainInfo.getLastCoreChainLockedHeight();

      await updateSimplifiedMasternodeList(lastCoreChainLockedHeight, {
        logger: contextLogger,
      });
    }

    const appHash = rootTree.getRootHash();

    contextLogger.info(
      {
        ...chainInfo.toJSON(),
        appHash: appHash.toString('hex').toUpperCase(),
      },
      `Start processing from block #${chainInfo.getLastBlockHeight()} with appHash ${appHash.toString('hex').toUpperCase() || 'nil'}`,
    );

    return new ResponseInfo({
      version: driveVersion,
      appVersion: protocolVersion,
      lastBlockHeight: chainInfo.getLastBlockHeight(),
      lastBlockAppHash: appHash,
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
