import { Cnd } from "../cnd";
import { ComitClient } from "../comitClient";
import { TakerNegotiator } from "./taker_negotiator";

jest.mock("../comitClient");
jest.mock("./maker_client");

const defaultCnd = new Cnd("");
const defaultComitClient = new ComitClient(defaultCnd);

describe("Taker Negotiator", () => {
  it("Returns an order with the correct trading pair, given buy/sell input", async () => {
    const takerNegotiator = new TakerNegotiator(defaultComitClient, "");

    const criteria = {
      buy: "BTC",
      sell: "ETH"
    };

    const order = await takerNegotiator.getOrder(criteria);

    expect(order).toHaveProperty("tradingPair", "ETH-BTC");
  });
});
