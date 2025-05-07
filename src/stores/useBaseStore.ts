import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores';
import { decodeTxRaw, type DecodedTxRaw } from '@cosmjs/proto-signing';
import dayjs from 'dayjs';
import { hashTx } from '@/libs';
import { toBase64 } from '@cosmjs/encoding';
import type { BlockResponse } from '@cosmjs/tendermint-rpc';
import { WS_URL } from '@/config';

const compareHashEqual = (
  firstHash: Uint8Array,
  secondHash: Uint8Array
): boolean => {
  for (let i = 0; i < firstHash.length; i++) {
    if (firstHash[i] !== secondHash[i]) {
      return false;
    }
  }
  return true;
};

export const useBaseStore = defineStore('baseStore', {
  state: () => {
    return {
      earlest: {} as BlockResponse,
      latest: {} as BlockResponse,
      recents: [] as BlockResponse[],
      blocks: [] as any[],
      txs: [] as any[],
      socket: null as WebSocket | null,
      theme: (window.localStorage.getItem('theme') || 'dark') as
        | 'light'
        | 'dark',
      connected: true,
    };
  },
  getters: {
    blocktime(): number {
      if (this.earlest && this.latest) {
        if (
          this.latest?.block?.header?.height !==
          this.earlest?.block?.header?.height
        ) {
          const diff = dayjs(this.latest.block?.header?.time.toString()).diff(
            this.earlest.block?.header?.time.toString()
          );
          const latestHeight = Number(this.latest.block?.header?.height);
          const earlestHeight = Number(this.earlest.block?.header?.height);
          if (isNaN(latestHeight) || isNaN(earlestHeight)) return 6000;
          const blocks = latestHeight - earlestHeight;
          return diff / blocks;
        }
      }
      return 6000;
    },
    blockchain() {
      return useBlockchain();
    },
    currentChainId(): string {
      return this.latest?.block?.header.chainId || '';
    },
    txsInRecents() {
      const txs = [] as {
        height: number;
        hash: string;
        tx: DecodedTxRaw;
      }[];
      this.recents.forEach((b) =>
        b?.block?.txs.forEach((raw) => {
          if (raw) {
            try {
              txs.push({
                height: b.block.header.height,
                hash: hashTx(raw),
                tx: decodeTxRaw(raw),
              });
            } catch (e) {
              console.error(e);
            }
          }
        })
      );
      return txs.sort((a, b) => {
        return Number(b.height) - Number(a.height);
      });
    },
  },
  actions: {
    async initial() {
      this.fetchLatest();
    },
    async clearRecentBlocks() {
      this.recents = [];
    },
    async fetchLatest() {
      try {
        this.latest = await this.blockchain.rpc?.getBaseBlockLatest();
        this.connected = true;
      } catch (e) {
        this.connected = false;
      }

      if (
        !this.earlest ||
        this.earlest?.block?.header?.chainId !=
        this.latest?.block?.header?.chainId
      ) {
        //reset earlest and recents
        this.earlest = this.latest;
        this.recents = [];
      }

      //check if the block exists in recents
      if (
        this.latest?.blockId?.hash &&
        !this.recents.some(
          (x) => toBase64(x.blockId.hash) === toBase64(this.latest.blockId.hash)
        )
      ) {
        if (this.recents.length >= 50) {
          this.recents.shift();
        }
        this.recents.push(this.latest);
      }
      return this.latest;
    },

    async fetchValidatorByHeight(height?: number, offset = 0) {
      return this.blockchain.rpc.getBaseValidatorsetAt(String(height), offset);
    },
    async fetchLatestValidators(offset = 0) {
      return this.blockchain.rpc.getBaseValidatorsetLatest(offset);
    },
    async fetchBlock(height?: number | string) {
      return this.blockchain.rpc.getBaseBlockAt(height);
    },
    async fetchAbciInfo() {
      return this.blockchain.rpc.getBaseNodeInfo();
    },
    async listenToBlocks() {
      try {
        const socket = new WebSocket(WS_URL);
        this.socket = socket;
        socket.onopen = () => {
          console.log('WebSocket connection established');
        };
        socket.onmessage = (event) => {
          const topic = JSON.parse(event.data);
          if (topic.type === 'REDPANDA_TOPIC_BLOCK') {
            const existingBlock = this.blocks.some(b => b.hash === topic.payload.hash);
            if (!existingBlock) {
              if (this.blocks.length >= 10) {
                this.blocks.pop();
              }
              this.blocks.unshift(topic.payload);
            }

          }
          if (topic.type === 'REDPANDA_TOPIC_TXS') {
            const existingTx = this.blocks.some(b => b.hash === topic.payload.hash);
            if (!existingTx) {
              if (this.txs.length >= 10) {
                this.txs.pop();
              }
              this.txs.unshift(topic.payload);
            }
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        console.error('Error listening to blocks:', error);
      }
    },
    disconnectWebSocket() {
      if (this.socket) {
        this.socket.close();
        console.log('WebSocket connection closed');
      }
    },
    // async fetchNodeInfo() {
    //     return this.blockchain.rpc.no()
    // }
  },
});
