import { Web3 } from 'web3';

export const givenProvider = 'https://evm.orai.io';

class Web3Service {
  web3: Web3;
  private static singletonInstance: Web3Service;

  constructor() {
    this.web3 = new Web3(givenProvider);
  }

  public static getInstance(): Web3Service {
    if (!Web3Service.singletonInstance) {
      Web3Service.singletonInstance = new Web3Service();
    }
    return Web3Service.singletonInstance;
  }
}

const web3Service = new Web3Service();
export default web3Service;
