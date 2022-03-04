/* eslint-disable camelcase */
// Learn more about destination functions API at
// https://segment.com/docs/connections/destinations/destination-functions

/*
An example request (for edx.bi.completion.user.course.completeed) looks like:
{
  "messageId": "test-message-ubmxom",
  "timestamp": "2020-05-23T02:32:45.934Z",
  "type": "track",
  "properties": {
    "block_id": "block-v1:customer+BW101+forever+type@course+block@course",
    "block_name": "CompletionTest",
    "completion_percent": 100,
    "context": {
      "user_id": "13"
    },
    "course_id": "test",
    "course_name": "CompletionTest",
    "data": {
      "block_id": "block-v1:customer+BW101+forever+type@course+block@course",
      "block_name": "CompletionTest",
      "completion_percent": 100,
      "context": {
        "user_id": "13"
      },
      "course_id": "test",
      "course_name": "CompletionTest",
      "email": "technical@appsembler.com",
      "label": "course CompletionTest completed",
      "org": "customer"
    },
    "email": "technical@appsembler.com",
    "label": "course CompletionTest completed",
    "name": "edx.bi.completion.user.course.completed",
    "nonInteraction": 1,
    "org": "customer",
    "timestamp": "2020-05-22T20:41:52.618227+00:00"
  },
  "userId": "13",
  "event": "edx.bi.completion.user.course.completed"
}
*/

var headers;

const getHeaders = async (tahoeApiToken) => {
  return {
    Authorization: `Token ${tahoeApiToken}`,
    accept: 'application/json',
    'Content-Type': 'application/json',
  };
};

const getTahoeUserInfo= async (tahoeBaseUrl, tahoeApiToken, user_id) =>{
 
   headers = await getHeaders(tahoeApiToken); 
   const requestOptions = {
    method: 'GET',
    headers: headers,
    redirect: 'follow',
  }; 
  let tahoeAPIURL = `${tahoeBaseUrl}/tahoe/api/v1/users/${user_id}/`;
  console.log(`Tahoe API url to call is ${tahoeAPIURL}`);
  
  const response = await fetch(tahoeAPIURL, requestOptions);
  return await response.json();
}


/**
 * Handle track event
 * @param  {SegmentTrackEvent} event
 * @param  {FunctionSettings} settings
 */

// eslint-disable-next-line no-unused-vars
async function onTrack(segmentEvent, settings) {

  // add Settings to your Destination Function with these names
  const {
    tahoeApiToken,  // e.g., 'ki3n7Tm25vSRtj1qIhWD' (given to you by Appsembler)
    tahoeBaseUrl, // e.g., 'https://your-tahoe-domain.com'
    eventOfInterest, // event name; e.g., 'edx.bi.completion.user.course.completed'
    sourceFuncUrl, // the Segment Source function URL
  } = settings;

  // To filter to one event type
  if (segmentEvent.event !== eventOfInterest) {
    throw new EventNotSupported();
  }  


  const {
    event,
    properties: {
      context: { user_id },
      timestamp,
    },
  } = segmentEvent;

  console.log(`Event supplied: ${event}`);
  console.log(`user_id is ${user_id}`);
  console.log(`Tahoe base url is ${tahoeBaseUrl}`);

  // TODO: cache results from Tahoe User API 

  const tahoeApiResponse = await getTahoeUserInfo(tahoeBaseUrl, tahoeApiToken, user_id);

  console.log(`Tahoe API responded with ${tahoeApiResponse}`);
  console.log(`${tahoeApiResponse.result}`);
  console.log(`${tahoeApiResponse.result[0]}`);

  if (tahoeApiResponse && tahoeApiResponse.id && sourceFuncUrl) {

    const body = {
      trackContent: {
        event: 'transformed_example_event',
        userId: user_id + '', //requires string
        properties: {
          user_id: user_id,
          email: tahoeApiResponse.email,
          full_name: tahoeApiResponse.full_name,
        },
      },
    };

    try {
      const response = await fetch(settings.sourceFuncUrl, {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body),
      });

      const responseJson = await response.json();
      console.log(`Response from calling source function: ${responseJson}`);
    } catch (error) {
      // Retry on connection error
      throw new RetryError(error.message);
    }

      console.log("Successfully transformed event and sent to Source Function.");

  }

  else {
    console.log('Could not generate new event for source function.')
    throw new InvalidEventPayload();
  }

}
