import { CHAIN_INDEXS } from '@/constants';
import { useBaseStore } from '@/stores';
import { api, METHODS } from './api';

const baseUrlOptimalQueriesScanium = 'https://api-optimal-queries.scanium.io';
const urlInfoBlock = '/v1/block';
export const getBlockByHeight = async (height?: number | string) => {
  const config = {
    baseURL: baseUrlOptimalQueriesScanium,
    url: `${urlInfoBlock}/${height}`,
    method: METHODS.GET,
  };
  const res = await api.request(config);
  return res?.data;
};

class BlocksService {
  store = useBaseStore();

  getBlockDetail = async (
    chainName: string,
    height?: number | string
  ): Promise<{ blocks?: any; sumAggregates?: any }> => {
    if (CHAIN_INDEXS.includes(chainName)) {
      const resBlock = await getBlockByHeight(height);
      const blocks = resBlock?.data;
      if (blocks)
        return {
          blocks,
          sumAggregates: {
            gasWanted: blocks.gasWanted,
            gasUsed: blocks.gasUsed,
          },
        };
      else
        return {
          blocks: await this.store.fetchBlock(height),
        };
    } else {
      return {
        blocks: await this.store.fetchBlock(height),
      };
    }
  };
}

export default new BlocksService();
