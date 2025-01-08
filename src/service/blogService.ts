import { CHAIN_INDEXS } from '@/constants';
import { useBaseStore } from '@/stores';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client/core';

class BlogService {
  store = useBaseStore();
  cache = new InMemoryCache();
  httpLink = createHttpLink({
    uri: 'https://indexer.scanium.io/',
  });
  apolloClient = new ApolloClient({
    cache: this.cache,
    link: this.httpLink,
  });

  getBlockDetail = async (chainName: string, height?: number | string) => {
    if (CHAIN_INDEXS.includes(chainName)) {
      const query = gql`
        query GetBlockDetail($filter: BlockFilter!, $first: Int!) {
          blocks(filter: $filter, first: $first) {
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
        }
      `;

      const variables = {
        filter: { height: { equalTo: height } },
        first: 1,
      };

      const { data } = await this.apolloClient.query({ query, variables });
      const result = data.blocks?.results[0];
      if (result) return result;
      else return await this.store.fetchBlock(height);
    } else {
      return await this.store.fetchBlock(height);
    }
  };

  getAggregates = async (chainName: string, height?: number | string) => {
    if (CHAIN_INDEXS.includes(chainName)) {
      const query = gql`
        query GetTransactions($filter: TransactionFilter!) {
          transactions(filter: $filter) {
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
        filter: { blockNumber: { equalTo: height } },
      };

      const { data } = await this.apolloClient.query({ query, variables });
      const result = data?.transactions?.aggregates?.sum;
      return result;
    }
    return null;
  };
}

export default new BlogService();
