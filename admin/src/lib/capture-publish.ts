/** Turns a publish rejection into a message the editor can show, instead of an unhandled rejection. */
export async function capturePublish(run: () => Promise<void>): Promise<string | undefined> {
  try {
    await run();
    return undefined;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : 'Could not publish.';
  }
}
