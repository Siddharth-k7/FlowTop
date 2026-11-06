/** Production stand-in. The real mock router is not bundled when mock mode is off. */
export function mockRequest(): never {
  throw new Error('Mock mode is off.');
}

export function mockAddMedia(): never {
  throw new Error('Mock mode is off.');
}
