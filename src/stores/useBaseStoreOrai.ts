import { defineStore } from 'pinia';
import { useBlockchain } from '@/stores';
import dayjs from 'dayjs';
import axios from 'axios';

export const useBaseStoreOrai = defineStore('baseStoreOrai', {
    state: () => {
        return {
            transaction_count: 0,
            market_cap: 0,
            trading_volume: 0,
            total_blocks: 0,
            number_of_validators: 0,
            block_time: 0,
        };
    },
    getters: {},
    actions: {
        async initial() {
            this.loadFromStorage();
            this.fetchLatest();
        },
        async clearBaseOrai() {
            this.transaction_count = 0;
            this.market_cap = 0;
            this.trading_volume = 0;
            this.total_blocks = 0;
            this.number_of_validators = 0;
            this.block_time = 0;
        },
        async fetchLatest() {
            try {
                const result = await Promise.allSettled([
                    axios.get('https://api.scan.orai.io/v1/market?id=oraichain-token'),
                    axios.get('https://api.scan.orai.io/v1/status'),
                    axios.get('https://control-center-api.orai.io/')
                ]);

                const market = result[0].status === 'fulfilled' ? result[0].value.data : null;
                const status = result[1].status === 'fulfilled' ? result[1].value.data : null;
                const controlCenter = result[2].status === 'fulfilled' ? result[2].value.data : null;
                this.transaction_count = controlCenter?.transaction_count || 0;
                this.market_cap = market?.market_cap || 0;
                this.trading_volume = market?.total_volume || 0;
                this.total_blocks = status?.latest_block_height || 0;
                this.number_of_validators = status?.total_validator_num || 0;
                this.block_time = status?.block_time || 0;

                this.saveToStorage();
            } catch (error) {
                console.error(error);
            }
        },
        saveToStorage() {
            const data = {
                transaction_count: this.transaction_count,
                market_cap: this.market_cap,
                trading_volume: this.trading_volume,
                total_blocks: this.total_blocks,
                number_of_validators: this.number_of_validators,
                block_time: this.block_time,
            };
            localStorage.setItem('baseStoreOrai', JSON.stringify(data)); // Lưu dữ liệu vào localStorage
        },
        loadFromStorage() {
            const data = localStorage.getItem('baseStoreOrai');
            if (data) {
                this.transaction_count = JSON.parse(data).transaction_count;
                this.market_cap = JSON.parse(data).market_cap;
                this.trading_volume = JSON.parse(data).trading_volume;
                this.total_blocks = JSON.parse(data).total_blocks;
                this.number_of_validators = JSON.parse(data).number_of_validators;
                this.block_time = JSON.parse(data).block_time;
            }
        },
    },
});
