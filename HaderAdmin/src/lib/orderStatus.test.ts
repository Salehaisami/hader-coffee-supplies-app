import { describe, it, expect } from "vitest";
import { getNextStatus, getStatusActionLabel, getStatusConfirmMessage } from "./orderStatus";

describe("getNextStatus", () => {
  it("returns sent_to_supplier when current status is pending", () => {
    expect(getNextStatus("pending")).toBe("sent_to_supplier");
  });

  it("returns delivered when current status is sent_to_supplier", () => {
    expect(getNextStatus("sent_to_supplier")).toBe("delivered");
  });

  it("returns null when current status is delivered (terminal)", () => {
    expect(getNextStatus("delivered")).toBeNull();
  });

  it("returns null when current status is cancelled (terminal)", () => {
    expect(getNextStatus("cancelled")).toBeNull();
  });
});

describe("getStatusActionLabel", () => {
  it("returns correct label for sent_to_supplier", () => {
    expect(getStatusActionLabel("sent_to_supplier")).toBe("Mark Sent to Supplier");
  });

  it("returns correct label for delivered", () => {
    expect(getStatusActionLabel("delivered")).toBe("Mark Delivered");
  });
});

describe("getStatusConfirmMessage", () => {
  it("returns confirmation message for sent_to_supplier", () => {
    expect(getStatusConfirmMessage("sent_to_supplier")).toBe(
      "Are you sure you want to mark this order as Sent to Supplier?"
    );
  });

  it("returns confirmation message for delivered", () => {
    expect(getStatusConfirmMessage("delivered")).toBe(
      "Are you sure you want to mark this order as Delivered?"
    );
  });
});
