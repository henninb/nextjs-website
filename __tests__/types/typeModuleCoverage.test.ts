import type {
  ApiEndpoint,
  ApiResponse,
  FetchOptions,
  FetchResult,
  MLBGame,
  NBAGame,
  NFLGame,
  NHLGame,
  PaginatedResponse,
  SportsDataFetcher,
  SportsGame,
} from "../../types/api/ApiTypes";
import type {
  GridCallbackDetails,
  GridPaginationModel,
  GridRowId,
  GridRowSelectionModel,
  GridValidRowModel,
  PaginationChangeHandler,
  ProcessRowUpdateHandler,
  RowSelectionChangeHandler,
  TypedGridColDef,
  TypedRenderCellParams,
} from "../../types/mui/DataGridTypes";
import type {
  CustomRenderOptions,
  CustomRenderResult,
  MockConsole,
  MockDataFactory,
  MockEventHandler,
  MockRequestHandler,
  MockResponse,
  MockedFunction,
  QueryClientWrapper,
  TestHookResult,
  TestRender,
  TestWrapperProps,
  UnknownTestUtility,
} from "../../types/test/TestTypes";
import type { PerimeterXObject } from "../../types/window/WindowExtensions";

describe("type module coverage", () => {
  it("loads interface-only and type-only modules", () => {
    expect(require("../../types/api/ApiTypes")).toBeDefined();
    expect(require("../../types/mui/DataGridTypes")).toBeDefined();
    expect(require("../../types/test/TestTypes")).toBeDefined();
    expect(require("../../types/window/WindowExtensions")).toBeDefined();
  });

  it("supports representative api and test contract shapes", async () => {
    const apiResponse: ApiResponse<{ id: number }> = {
      data: { id: 1 },
      status: 200,
      message: "ok",
      timestamp: "2026-05-10T00:00:00.000Z",
    };
    const paginatedResponse: PaginatedResponse<string> = {
      content: ["a", "b"],
      totalElements: 2,
      totalPages: 1,
      pageNumber: 0,
      pageSize: 10,
      first: true,
      last: true,
      empty: false,
    };
    const fetchOptions: FetchOptions = {
      method: "POST",
      params: { page: 1, active: true, q: "search" },
      body: { value: "payload" },
      timeout: 5000,
    };
    const successResult: FetchResult<{ slug: string }> = {
      success: true,
      data: { slug: "post" },
      status: 200,
    };
    const errorResult: FetchResult<{ slug: string }> = {
      success: false,
      error: {
        message: "failed",
        code: "FAILED",
        statusCode: 500,
      },
      status: 500,
    };
    const endpoint: ApiEndpoint = {
      url: "/api/posts",
      method: "GET",
      headers: { accept: "application/json" },
    };
    const sportsGame: SportsGame = {
      id: "game-1",
      date: "2026-05-10",
      homeTeam: "CHI",
      awayTeam: "DAL",
      status: "scheduled",
      venue: "Arena",
    };
    const nflGame: NFLGame = { ...sportsGame, week: 1, season: 2026 };
    const nbaGame: NBAGame = { ...sportsGame, quarter: 4, timeRemaining: "2:15" };
    const mlbGame: MLBGame = { ...sportsGame, inning: 7 };
    const nhlGame: NHLGame = { ...sportsGame, period: 3, timeRemaining: "1:01" };
    const sportsFetcher: SportsDataFetcher = async () => [sportsGame];

    type SampleRow = GridValidRowModel & { id: GridRowId; amount: number };
    const renderParams = { value: 25 } as TypedRenderCellParams<SampleRow>;
    const columns: TypedGridColDef<SampleRow>[] = [
      {
        field: "amount",
        headerName: "Amount",
        renderCell: (params) => `Amount: ${params.value}`,
      },
    ];
    const selectionHandler: RowSelectionChangeHandler = (
      model: GridRowSelectionModel,
      _details?: GridCallbackDetails,
    ) => {
      expect(model).toEqual([1]);
    };
    const paginationHandler: PaginationChangeHandler = (
      model: GridPaginationModel,
    ) => {
      expect(model.page).toBe(2);
    };
    const rowUpdateHandler: ProcessRowUpdateHandler<SampleRow> = (
      newRow,
      oldRow,
    ) => ({ ...oldRow, ...newRow });

    const wrapper: QueryClientWrapper = () => {
      return function Wrapper({ children }: TestWrapperProps) {
        return children;
      };
    };
    const mockedFunction: MockedFunction<(value: number) => string> = jest
      .fn<(value: number) => string>()
      .mockImplementation((value) => String(value));
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      redirected: false,
      type: "basic",
      url: "https://example.com",
      clone: () => new Response(),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
      json: async <T>() => ({ ok: true } as T),
      text: async () => "text",
    };
    const renderOptions: CustomRenderOptions = {};
    const renderResult = {} as CustomRenderResult;
    const dataFactory: MockDataFactory<{ id: number; name: string }> = (
      overrides = {},
    ) => ({
      id: 1,
      name: "sample",
      ...overrides,
    });
    const hookResult: TestHookResult<{ ready: boolean }> = {
      result: { current: { ready: true } },
      rerender: () => undefined,
      unmount: () => undefined,
    };
    const requestHandler: MockRequestHandler = {
      method: "GET",
      path: "/api/test",
      response: { ok: true },
      status: 200,
    };
    const testUtility: UnknownTestUtility = (...args) => args.length;
    const eventHandler: MockEventHandler<MouseEvent> = jest.fn();
    const mockConsole: MockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    const testRender: TestRender = () => renderResult;
    const pxObject: PerimeterXObject = {
      appId: "px-app",
      vid: "visitor",
      uuid: "uuid",
    };

    expect(apiResponse.data.id).toBe(1);
    expect(paginatedResponse.empty).toBe(false);
    expect(fetchOptions.timeout).toBe(5000);
    expect(successResult.success).toBe(true);
    expect(errorResult.success).toBe(false);
    expect(endpoint.method).toBe("GET");
    expect(nflGame.week).toBe(1);
    expect(nbaGame.timeRemaining).toBe("2:15");
    expect(mlbGame.inning).toBe(7);
    expect(nhlGame.period).toBe(3);
    await expect(sportsFetcher()).resolves.toEqual([sportsGame]);
    expect(columns[0].renderCell?.(renderParams)).toBe("Amount: 25");
    selectionHandler([1], undefined);
    paginationHandler({ page: 2, pageSize: 25 });
    expect(
      rowUpdateHandler({ id: 1, amount: 25 }, { id: 1, amount: 10 }),
    ).toEqual({ id: 1, amount: 25 });
    expect(typeof wrapper({} as never)).toBe("function");
    expect(mockedFunction(12)).toBe("12");
    await expect(mockResponse.json<{ ok: boolean }>()).resolves.toEqual({
      ok: true,
    });
    expect(renderOptions.queryClient).toBeUndefined();
    expect(renderResult).toEqual({});
    expect(dataFactory({ name: "override" })).toEqual({
      id: 1,
      name: "override",
    });
    expect(hookResult.result.current.ready).toBe(true);
    expect(requestHandler.path).toBe("/api/test");
    expect(testUtility("a", "b")).toBe(2);
    eventHandler(new MouseEvent("click"));
    expect(eventHandler).toHaveBeenCalledTimes(1);
    mockConsole.warn("warning");
    expect(mockConsole.warn).toHaveBeenCalledWith("warning");
    expect(testRender({} as never)).toBe(renderResult);
    expect(pxObject.uuid).toBe("uuid");
  });

  it("supports the declared window extensions at runtime", () => {
    const gtag = jest.fn();

    window.PXjJ0cYtn9_asyncInit = jest.fn();
    window._pxCustomAbrDomains = ["example.com"];
    window.gtag = gtag;
    window.dataLayer = [{ event: "page_view" }];
    window._px = { appId: "px-app", vid: "visitor-1" };
    window.analytics = { track: jest.fn() };
    window.heap = { addEventProperties: jest.fn() };

    expect(window._px?.appId).toBe("px-app");
    expect(window._pxCustomAbrDomains).toEqual(["example.com"]);

    window.gtag?.("event", "test");
    expect(gtag).toHaveBeenCalledWith("event", "test");
    expect(window.dataLayer).toHaveLength(1);
  });
});
