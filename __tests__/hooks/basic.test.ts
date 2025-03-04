// A minimal TypeScript test to verify Jest is working with TS
describe("Basic TypeScript test", () => {
  it("should work with TypeScript", () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(1, 2)).toBe(3);
  });
});
