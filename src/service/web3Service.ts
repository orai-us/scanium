import { BASE_URL_EVM } from '@/config';
import { Web3 } from 'web3';

export const givenProvider = BASE_URL_EVM;

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

  public async isAccountEVM(address: string) {
    try {
      const code = await this.web3.eth.getCode(address);
      return code === '0x';
    } catch (error) {
      return false;
    }
  }

  public contractMethod(minABI: any, address: string) {
    return new this.web3.eth.Contract(minABI, address);
  }
}

const web3Service = new Web3Service();
export default web3Service;
