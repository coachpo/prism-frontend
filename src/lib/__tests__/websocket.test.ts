import { describe, expect, it } from "vitest";
import { calculateReconnectDelay, getInitialConnectionState } from "@/lib/websocket/transport";
import {
  buildPingMessage,
  buildPongMessage,
  buildSubscribeMessage,
  buildUnsubscribeAllMessage,
  buildUnsubscribeChannelMessage,
} from "@/lib/websocket/protocol";
import {
  decrementChannelRefCount,
  incrementChannelRefCount,
} from "@/lib/websocket/subscriptions";

describe("websocket helpers", () => {
  it("caps reconnect delay growth after the fifth attempt", () => {
    expect(calculateReconnectDelay(3_000, 1)).toBe(3_000);
    expect(calculateReconnectDelay(3_000, 3)).toBe(9_000);
    expect(calculateReconnectDelay(3_000, 5)).toBe(15_000);
    expect(calculateReconnectDelay(3_000, 8)).toBe(15_000);
  });

  it("returns reconnecting only after a previous connection or reconnect attempt", () => {
    expect(getInitialConnectionState({ hasConnectedOnce: false, reconnectAttempts: 0 })).toBe(
      "connecting",
    );
    expect(getInitialConnectionState({ hasConnectedOnce: true, reconnectAttempts: 0 })).toBe(
      "reconnecting",
    );
    expect(getInitialConnectionState({ hasConnectedOnce: false, reconnectAttempts: 2 })).toBe(
      "reconnecting",
    );
  });

  it("builds websocket protocol messages with the existing payload shapes", () => {
    expect(buildSubscribeMessage(7, "dashboard")).toEqual({
      type: "subscribe",
      profile_id: 7,
      channel: "dashboard",
    });
    expect(buildUnsubscribeChannelMessage("dashboard")).toEqual({
      type: "unsubscribe_channel",
      channel: "dashboard",
    });
    expect(buildUnsubscribeAllMessage()).toEqual({ type: "unsubscribe" });
    expect(buildPingMessage()).toEqual({ type: "ping" });
    expect(buildPongMessage()).toEqual({ type: "pong" });
  });

  it("tracks first subscribe and last unsubscribe for a channel", () => {
    const firstAdd = incrementChannelRefCount(new Map(), "dashboard");
    expect(firstAdd.shouldSubscribe).toBe(true);
    expect(firstAdd.nextRefCounts.get("dashboard")).toBe(1);

    const secondAdd = incrementChannelRefCount(firstAdd.nextRefCounts, "dashboard");
    expect(secondAdd.shouldSubscribe).toBe(false);
    expect(secondAdd.nextRefCounts.get("dashboard")).toBe(2);

    const firstRemove = decrementChannelRefCount(secondAdd.nextRefCounts, "dashboard");
    expect(firstRemove.shouldUnsubscribe).toBe(false);
    expect(firstRemove.nextRefCounts.get("dashboard")).toBe(1);
    expect(firstRemove.hasSubscriptions).toBe(true);

    const finalRemove = decrementChannelRefCount(firstRemove.nextRefCounts, "dashboard");
    expect(finalRemove.shouldUnsubscribe).toBe(true);
    expect(finalRemove.nextRefCounts.has("dashboard")).toBe(false);
    expect(finalRemove.hasSubscriptions).toBe(false);
  });
});
