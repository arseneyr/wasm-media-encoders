interface FetchMock
  extends jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>> {
  dontMockIf(
    matchingUrl: RegExp,
    createResp: (
      url: string,
      options?: RequestInit
    ) => Response | PromiseLike<Response>
  ): void;
}

var fetchMock: FetchMock;

const realFetch = globalThis.fetch;
globalThis.fetch = jest.fn(realFetch);
globalThis.fetchMock = Object.create(globalThis.fetch);
globalThis.fetchMock.dontMockIf = (matchingUrl, createResponse) => {
  globalThis.fetchMock.mockImplementation((urlOrRequest, ...args) => {
    const url = (
      urlOrRequest instanceof Request ? urlOrRequest.url : urlOrRequest
    ).toString();
    return matchingUrl.test(url)
      ? realFetch(urlOrRequest, ...args)
      : Promise.resolve(createResponse(url, ...args));
  });
};
