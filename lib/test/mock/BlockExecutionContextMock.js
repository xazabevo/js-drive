/**
 * @method addDataContract
 * @method getDataContracts
 * @method getAccumulativeFees
 * @method incrementAccumulativeFees
 * @method reset
 */
class BlockExecutionContextMock {
  /**
   * @param {SinonSandbox} sinon
   */
  constructor(sinon) {
    this.addDataContract = sinon.stub();
    this.hasDataContract = sinon.stub();
    this.getDataContracts = sinon.stub();
    this.getAccumulativeFees = sinon.stub();
    this.incrementAccumulativeFees = sinon.stub();
    this.reset = sinon.stub();
    this.setHeader = sinon.stub();
    this.getHeader = sinon.stub();
    this.getValidTxCount = sinon.stub();
    this.getInvalidTxCount = sinon.stub();
    this.incrementValidTxCount = sinon.stub();
    this.incrementInvalidTxCount = sinon.stub();
    this.setConsensusLogger = sinon.stub();
    this.getConsensusLogger = sinon.stub();
  }
}

module.exports = BlockExecutionContextMock;
