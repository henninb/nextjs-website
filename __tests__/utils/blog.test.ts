const readdirSync = jest.fn();
const readFileSync = jest.fn();
const matter = jest.fn();

jest.mock("fs", () => ({
  __esModule: true,
  default: {
    readdirSync: (...args: unknown[]) => readdirSync(...args),
    readFileSync: (...args: unknown[]) => readFileSync(...args),
  },
}));

jest.mock("gray-matter", () => ({
  __esModule: true,
  default: (...args: unknown[]) => matter(...args),
}));

describe("blog utils", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
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
    readFileSync.mockReturnValue("---\ntitle: Test\n---\ncontent");
    matter.mockReturnValue({
      data: {
        title: "Test title",
        date: "2026-05-10",
      },
      content: "Rendered content",
    });

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
    expect(matter).toHaveBeenCalledWith("---\ntitle: Test\n---\ncontent");
  });

  it("returns posts sorted by newest date first", () => {
    readdirSync.mockReturnValue(["older.mdx", "newer.mdx"]);
    readFileSync
      .mockReturnValueOnce("older contents")
      .mockReturnValueOnce("newer contents");
    matter
      .mockReturnValueOnce({
        data: {
          title: "Older",
          date: "2024-01-01",
          excerpt: "older excerpt",
          author: "Author A",
          tags: ["history"],
          coverImage: "/older.png",
        },
        content: "Older content",
      })
      .mockReturnValueOnce({
        data: {
          title: "Newer",
          date: "2025-01-01",
          excerpt: "newer excerpt",
          author: "Author B",
          tags: ["current"],
          coverImage: "/newer.png",
        },
        content: "Newer content",
      });

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
