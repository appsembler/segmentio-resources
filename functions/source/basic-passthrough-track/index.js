// Learn more about source functions API at
// https://segment.com/docs/connections/sources/source-functions

/**
 * Handle incoming HTTP request
 *
 * @param  {FunctionRequest} request
 * @param  {FunctionSettings} settings
 */
// eslint-disable-next-line no-unused-vars
async function onRequest(request) {
  const body = request.json();

  const {
    trackContent,
  } = body;

  Segment.track(trackContent);
}
