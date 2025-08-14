import { modalTitles, modalBodies } from "../../utils/modalMessages";

describe("modalMessages copy", () => {
  it("provides consistent titles", () => {
    expect(modalTitles.confirmDeletion).toBe("Confirm Deletion");
    expect(modalTitles.confirmClone).toBe("Confirm Clone");
    expect(modalTitles.confirmMove).toBe("Confirm Move");
    expect(modalTitles.addNew("payment")).toBe("Add New Payment");
  });

  it("describes deletion with consequences", () => {
    const text = modalBodies.confirmDeletion("payment", "#123");
    expect(text).toMatch(/permanently delete the payment/i);
    expect(text).toMatch(/cannot be undone/i);
    expect(text).toMatch(/#123/);
  });

  it("describes clone action clearly", () => {
    const text = modalBodies.confirmClone("transaction", "ABC-001");
    expect(text).toMatch(/new copy of the transaction/i);
    expect(text).toMatch(/review and edit/i);
    expect(text).toMatch(/ABC-001/);
  });

  it("describes move action with guidance", () => {
    const text = modalBodies.confirmMove("transaction", "TX-9");
    expect(text).toMatch(/move the transaction/i);
    expect(text).toMatch(/Select the destination/i);
    expect(text).toMatch(/update its account and totals/i);
  });
});
