const readdirSync = jest.fn();
const readFileSync = jest.fn();

jest.mock("fs", () => ({
  __esModule: true,
  default: {
    readdirSync: (...args: unknown[]) => readdirSync(...args),
    readFileSync: (...args: unknown[]) => readFileSync(...args),
  },
}));

describe("blog utils", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.cwd = jest.fn(() => "/workspace") as typeof process.cwd;
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  it("returns all post slugs from mdx filenames", () => {
    readdirSync.mockReturnValue([
      "first-post.mdx",
      "second-post.mdx",
      "notes.txt",
    ]);

    const { getAllPostSlugs } = require("../../utils/blog");

    expect(getAllPostSlugs()).toEqual([
      { params: { slug: "first-post" } },
      { params: { slug: "second-post" } },
      { params: { slug: "notes.txt" } },
    ]);
    expect(readdirSync).toHaveBeenCalledWith("/workspace/content/blog");
  });

  it("reads a post by slug and applies optional front matter defaults", () => {
    readFileSync.mockReturnValue(
      "---\ntitle: Test title\ndate: '2026-05-10'\n---\nRendered content",
    );

    const { getPostBySlug } = require("../../utils/blog");

    expect(getPostBySlug("test-post")).toEqual({
      slug: "test-post",
      title: "Test title",
      date: "2026-05-10",
      excerpt: "",
      content: "Rendered content",
      author: "",
      tags: [],
      coverImage: "",
    });
    expect(readFileSync).toHaveBeenCalledWith(
      "/workspace/content/blog/test-post.mdx",
      "utf8",
    );
  });

  it("returns posts sorted by newest date first", () => {
    readdirSync.mockReturnValue(["older.mdx", "newer.mdx"]);
    readFileSync
      .mockReturnValueOnce(
        "---\ntitle: Older\ndate: '2024-01-01'\nexcerpt: older excerpt\nauthor: Author A\ntags:\n  - history\ncoverImage: /older.png\n---\nOlder content",
      )
      .mockReturnValueOnce(
        "---\ntitle: Newer\ndate: '2025-01-01'\nexcerpt: newer excerpt\nauthor: Author B\ntags:\n  - current\ncoverImage: /newer.png\n---\nNewer content",
      );

    const { getAllPosts } = require("../../utils/blog");

    expect(getAllPosts()).toEqual([
      {
        slug: "newer",
        title: "Newer",
        date: "2025-01-01",
        excerpt: "newer excerpt",
        content: "Newer content",
        author: "Author B",
        tags: ["current"],
        coverImage: "/newer.png",
      },
      {
        slug: "older",
        title: "Older",
        date: "2024-01-01",
        excerpt: "older excerpt",
        content: "Older content",
        author: "Author A",
        tags: ["history"],
        coverImage: "/older.png",
      },
    ]);
  });
});
