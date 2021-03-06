import { BigNumber } from "bignumber.js";
import { Asset, Ledger, SwapProperties } from "../cnd";
import { getToken, Token } from "../tokens/tokens";

export interface Order {
  tradingPair: string;
  id: string;
  validUntil: number;
  bid: OrderAsset;
  ask: OrderAsset;
}

export interface OrderAsset {
  ledger: string;
  asset: string;
  nominalAmount: string;
}

export function orderSwapMatchesForMaker(
  order: Order,
  props: SwapProperties
): boolean {
  const params = props.parameters;

  return (
    orderSwapAssetMatchesForMaker(
      order.ask,
      params.alpha_asset,
      params.alpha_ledger
    ) &&
    orderSwapAssetMatchesForMaker(
      order.bid,
      params.beta_asset,
      params.beta_ledger
    )
  );
}

export function isNative({ asset, ledger }: OrderAsset): boolean {
  return (
    (asset === "bitcoin" && ledger === "bitcoin") ||
    (asset === "ether" && ledger === "ethereum")
  );
}

export function orderSwapAssetMatchesForMaker(
  orderAsset: OrderAsset,
  swapAsset: Asset,
  swapLedger: Ledger
): boolean {
  if (isNative(orderAsset)) {
    return (
      swapAsset.name === orderAsset.asset &&
      areAmountsEqual(
        swapAsset.name,
        swapAsset.quantity,
        orderAsset.nominalAmount
      ) &&
      swapLedger.name === orderAsset.ledger
    );
  }

  if (swapLedger.name === "ethereum") {
    const token = getToken(orderAsset.asset);
    if (token) {
      return (
        swapAsset.name.toLowerCase() === token.type.toLowerCase() &&
        areAmountsEqual(
          swapAsset.name,
          swapAsset.quantity,
          orderAsset.nominalAmount,
          token
        )
      );
    }
  }

  return false;
}

export function assetOrderToSwap(orderAsset: OrderAsset): Asset | undefined {
  if (isNative(orderAsset)) {
    const name = orderAsset.asset;
    const quantity = fromNominal(name, orderAsset.nominalAmount);
    if (!quantity) {
      return undefined;
    }
    return {
      name,
      quantity: quantity.toString()
    };
  }

  const token = getToken(orderAsset.asset);
  if (token) {
    const name = token.type.toLowerCase();
    const quantity = fromNominal(name, orderAsset.nominalAmount, token);
    if (!quantity) {
      return undefined;
    }

    return {
      name,
      quantity: quantity.toString(),
      token_contract: token.address
    };
  }

  return undefined;
}

function areAmountsEqual(
  asset: string,
  unitAmount: string,
  nominalAmount: string,
  token?: Token
): boolean {
  const amount = fromNominal(asset, nominalAmount, token);

  if (!amount) {
    return false;
  }

  return amount.eq(new BigNumber(unitAmount));
}

const BITCOIN_DECIMALS = 8;
const ETHER_DECIMALS = 18;

export function fromNominal(
  asset: string,
  nominalAmount: string,
  token?: Token
): BigNumber | undefined {
  let decimals = 0;
  switch (asset) {
    case "bitcoin": {
      decimals = BITCOIN_DECIMALS;
      break;
    }
    case "ether": {
      decimals = ETHER_DECIMALS;
      break;
    }
    default: {
      if (token) {
        decimals = token.decimals;
      } else {
        return undefined;
      }
    }
  }
  return new BigNumber(10).pow(decimals).times(nominalAmount);
}
