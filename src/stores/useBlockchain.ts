import { defineStore } from 'pinia';
import {
  useDashboard,
  type ChainConfig,
  type Endpoint,
  EndpointType,
} from './useDashboard';
import type {
  NavGroup,
  NavLink,
  NavSectionTitle,
  VerticalNavItems,
} from '@/layouts/types';
import { useRouter } from 'vue-router';
import { CosmosRestClient } from '@/libs/client';
import {
  useBankStore,
  useBaseStore,
  useGovStore,
  useMintStore,
  useStakingStore,
  useWalletStore,
} from '.';
import { useBlockModule } from '@/modules/[chain]/block/block';
import { DEFAULT } from '@/libs';
import { hexToRgb, rgbToHsl } from '@/libs/utils';
import { useI18n } from 'vue-i18n';

export const useBlockchain = defineStore('blockchain', {
  state: () => {
    return {
      status: {} as Record<string, string>,
      rest: '',
      chainName: '',
      endpoint: {} as {
        type?: EndpointType;
        address: string;
        provider: string;
      },
      connErr: '',
    };
  },
  getters: {
    current(): ChainConfig | undefined {
      const chain = this.dashboard.chains[this.chainName];
      // update chain config with dynamic updated sdk version
      const sdkversion = localStorage.getItem(`sdk_version_${this.chainName}`);
      if (sdkversion && chain?.versions) {
        chain.versions.cosmosSdk = sdkversion;
      }
      return chain;
    },
    logo(): string {
      return this.current?.logo || '';
    },
    defaultHDPath(): string {
      const cointype = this.current?.coinType || '118';
      return `m/44'/${cointype}/0'/0/0`;
    },
    dashboard() {
      return useDashboard();
    },
    isConsumerChain() {
      // @ts-ignore
      return this.current && this.current.providerChain;
    },
    computedChainMenu() {
      const { t } = useI18n();
      let currNavItem: VerticalNavItems = [];
      const router = useRouter();
      const routes = router?.getRoutes() || [];
      console.log({ routes });

      if (this.current && routes) {
        if (this.current?.themeColor) {
          const { color } = hexToRgb(this.current?.themeColor);
          const { h, s, l } = rgbToHsl(color);
          const themeColor = h + ' ' + s + '% ' + l + '%';
          // document.body.style.setProperty('--p', `${themeColor}`);
          // document.body.style.setProperty('--p', `${this.current?.themeColor}`);
          document.body.style.setProperty('--p', '262 79% 55%'); // #7332E7
        } else {
          document.body.style.setProperty('--p', '262 79% 55%'); // #7332E7
        }
        currNavItem = [
          {
            title: this.current?.prettyName || this.chainName || '',
            icon: { image: this.current.logo, size: '22' },
            i18n: false,
            badgeContent: this.isConsumerChain ? 'Consumer' : undefined,
            badgeClass: 'bg-error',
            children: routes
              .filter((x) => x.meta.i18n) // defined menu name
              .filter((x) => {
                // shortcut to ignore cosmwasm
                if (
                  !this.current?.cosmwasmEnabled &&
                  String(x.meta.i18n) === 'cosmwasm'
                )
                  return false;
                return (
                  !this.current?.features ||
                  this.current.features.includes(String(x.meta.i18n))
                );
              }) // filter none-custom module
              .map((x) => ({
                title: `module.${x.meta.i18n}`,
                to: { path: x.path.replace(':chain', this.chainName) },
                icon: { icon: 'mdi-chevron-right', size: '22' },
                i18n: true,
                order: Number(x.meta.order || 100),
              }))
              .sort((a, b) => a.order - b.order),
          },
        ];
      }

      // compute favorite menu
      const favNavItems: VerticalNavItems = [];
      Object.keys(this.dashboard.favoriteMap).forEach((name) => {
        const ch = this.dashboard.chains[name];
        if (ch && this.dashboard.favoriteMap?.[name]) {
          favNavItems.push({
            title: ch.prettyName || ch.chainName || name,
            to: { path: `/${ch.chainName || name}` },
            icon: { image: ch.logo, size: '22' },
          });
        }
      });

      // combine all together
      return [
        ...currNavItem,
        { heading: t('module.ecosystem') } as NavSectionTitle,
        {
          title: t('module.favorite'),
          children: favNavItems,
          badgeContent: favNavItems.length,
          badgeClass: 'bg-primary',
          i18n: true,
          icon: { icon: 'mdi-star', size: '22' },
        } as NavGroup,
        {
          title: t('module.all_blockchains'),
          to: { path: '/' },
          badgeContent: this.dashboard.length,
          badgeClass: 'bg-primary',
          i18n: true,
          icon: { icon: 'mdi-grid', size: '22' },
        } as NavLink,
      ];
    },
  },
  actions: {
    async initial() {
      // this.current?.themeColor {
      //     const { global } = useTheme();
      //     global.current
      // }
      useWalletStore().$reset();
      await useStakingStore().init();
      useBankStore().initial();
      useBaseStore().initial();
      useGovStore().initial();
      useMintStore().initial();
      useBlockModule().initial();
    },

    randomEndpoint(chainName: string): Endpoint | undefined {
      const end = localStorage.getItem(`endpoint-${chainName}`);
      if (end) {
        return JSON.parse(end);
      } else {
        const all = this.current?.endpoints?.rpc;
        if (all) {
          const rn = Math.random();
          const endpoint = all[Math.floor(rn * all.length)];
          return endpoint;
        }
      }
    },

    randomSetupEndpoint() {
      const endpoint = this.randomEndpoint(this.chainName);
      if (endpoint) this.setRestEndpoint(endpoint);
    },

    setRestEndpoint(endpoint: Endpoint) {
      this.connErr = '';
      this.endpoint = endpoint;
      this.rpc = CosmosRestClient.newStrategy(endpoint.address, this.current);
      localStorage.setItem(
        `endpoint-${this.chainName}`,
        JSON.stringify(endpoint)
      );
    },

    async getEndpoint(chainName: string) {
      const endpoints = this.dashboard.chains[chainName]?.endpoints?.rpc || [];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const statusEndpoint = await fetch(endpoint.address + '/status', {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (statusEndpoint.ok) {
            return endpoint;
          }
        } catch (error) {
          console.warn(`Failed to check status for endpoint ${endpoint.address}:`, error);
          continue; // Try next endpoint
        }
      }

      // If no endpoints are working, return the first one as fallback
      return endpoints[0];
    },

    async setCurrent(name: string) {
      // Ensure chains are loaded due to asynchronous calls.
      // if (this.dashboard.length === 0) {
      //   await this.dashboard.initial();
      // }

      // Find the case-sensitive name for the chainName, else simply use the parameter-value.
      const caseSensitiveName =
        Object.keys(this.dashboard.chains).find(
          (x) => x.toLowerCase() === name.toLowerCase()
        ) || name;

      // Update chainName if needed
      if (caseSensitiveName !== this.chainName) {
        this.chainName = caseSensitiveName;
      }
    },

    supportModule(mod: string) {
      return !this.current?.features || this.current.features.includes(mod);
    },
  },
});
