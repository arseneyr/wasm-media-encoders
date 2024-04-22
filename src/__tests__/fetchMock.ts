import { jest } from "@jest/globals";

interface FetchMock extends jest.Mock<typeof fetch> {
  dontMockIf(
    matchingUrl: RegExp,
    createResp: (
      url: string,
      options?: RequestInit
    ) => Response | PromiseLike<Response>
  ): void;
  mockResponse(fn: (req: Request) => Response | PromiseLike<Response>): void;
}

declare global {
  var fetchMock: FetchMock;
}

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
globalThis.fetchMock.mockResponse = (createResponse) => {
  globalThis.fetchMock.mockImplementation((request) =>
    Promise.resolve(createResponse(new Request(request)))
  );
};
