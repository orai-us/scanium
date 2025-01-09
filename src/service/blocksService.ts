import { CHAIN_INDEXS } from '@/constants';
import { useBaseStore } from '@/stores';
import gql from 'graphql-tag';
import { apolloClient } from '@/main';

class BlocksService {
  store = useBaseStore();

  getBlockDetail = async (chainName: string, height?: number | string): Promise<{blocks?: any, sumAggregates?: any}> => {
    if (CHAIN_INDEXS.includes(chainName)) {
      const query = gql`
        query GetBlockDetail($filterBlock: BlockFilter!, $first: Int!, $filterTx: TransactionFilter! ) {
          blocks(filter: $filterBlock, first: $first) {
            results: nodes {
              id
              chainId
              round
              txCount
              proposerAddress
              time
              nodeId
            }
          }
          transactions(filter: $filterTx) {
            aggregates {
              sum {
                gasUsed
                gasWanted
              }
            }
          }
        }
      `;

      const variables = {
        filterBlock: { height: { equalTo: height } },
        first: 1,
        filterTx: { blockNumber: { equalTo: height } },
      };

      const { data } = await apolloClient.query({ query, variables });
      const blocks = data.blocks?.results[0];
      const sumAggregates = data.transactions?.aggregates?.sum;
      if (blocks) return {
        blocks, 
        sumAggregates
      }
      else return {
        blocks: await this.store.fetchBlock(height),
      }
    } else {
      return {
        blocks: await this.store.fetchBlock(height),
      }
    }
  };
}

export default new BlocksService();
