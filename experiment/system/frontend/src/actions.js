// Log experiment flow
export const START_EXPERIMENT = 'START_EXPERIMENT'
export const START_PRESCREEN = 'START_PRESCREEN'
export const FAIL_PRESCREEN = 'FAIL_PRESCREEN'
export const COMPLETE_PRESCREEN = 'COMPLETE_PRESCREEN'
export const START_TASKS = 'START_TASKS'
export const COMPLETE_TASKS = 'COMPLETE_TASKS'
export const START_POSTSCREEN = 'START_POSTSCREEN'
export const COMPLETE_POSTSCREEN = 'COMPLETE_POSTSCREEN'

export const REQUEST_GET_SPECS = 'REQUEST_GET_SPECS'
export const RECEIVE_GET_SPECS = 'RECEIVE_GET_SPECS'
export const TRIGGER_GET_QUESTION = 'TRIGGER_GET_QUESTION'
export const REQUEST_GET_QUESTION = 'REQUEST_GET_QUESTION'
export const RECEIVE_GET_QUESTION = 'RECEIVE_GET_QUESTION'
export const STARTED_QUESTION = 'STARTED_QUESTION'
export const REQUEST_SUBMIT_RESPONSE = 'REQUEST_SUBMIT_RESPONSE'
export const RECEIVE_SUBMIT_RESPONSE = 'RECEIVE_SUBMIT_RESPONSE'
export const REQUEST_SUBMIT_POST_EXPERIMENT = 'REQUEST_SUBMIT_POST_EXPERIMENT';
export const RECEIVE_SUBMIT_POST_EXPERIMENT = 'RECEIVE_SUBMIT_POST_EXPERIMENT';
export const RENDER_VISUALIZATION = 'RENDER_VISUALIZATION'

// Debugging
export const RESET_STATS = 'RESET_STATS'
export const CHANGE_TASK = 'CHANGE_TASK'
export const CHANGE_SPEC = 'CHANGE_SPEC'


let API_URL;
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL
} else {
  if (process.env.NODE_ENV === 'development') {
    API_URL = 'http://localhost:9999';
  } else {
    API_URL = 'http://OMITTED:8888';
  }
}

export function logExperimentEvent(userId, event, data={}) {
  let eventTime = Date.now();
  const params = {
    user_id: userId,
    event_time: eventTime,
    event: event
  };
  return dispatch => {
    dispatch({ type: event, time: eventTime, data: data })
    return fetch(`${ API_URL }/api/event`, {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json'}
    })
    .then(r => r.json())
    .then(j => {});
  };
}

export function changeTask(taskId) {
  return {
    type: CHANGE_TASK,
    taskId: taskId
  };
}

export function changeSpec(specId) {
  return {
    type: CHANGE_SPEC,
    specId: specId
  };
}

export function triggerGetQuestion() {
  return {
    type: TRIGGER_GET_QUESTION,
  };
}

function requestGetQuestionDispatcher() {
  return {
    type: REQUEST_GET_QUESTION,
  };
}

function successGetQuestionDispatcher(question, data) {

  let parsedData = data;
  parsedData.forEach(d => {
    d[question.q1] = +d[question.q1],
    d[question.q2] = +d[question.q2],
    d[question.c] = String(d[question.c])
  });
  return {
    type: RECEIVE_GET_QUESTION,
    question: question,
    data: parsedData,
    receivedAt: Date.now(),
  };
}

export function flagQuestion(questionId) {
  return dispatch => {
    return fetch(`${ API_URL }/api/flag_question?question_id=${ questionId }`)
      .then(r => r.json())
      .then(j => { console.log('Flagged questionId', questionId) });
  };
}

const maxRetries = 5;
export function getQuestion(taskId, specId, honeypot, previousQuestionIds=[], retries=0) {
  previousQuestionIds = JSON.stringify(previousQuestionIds);
  return dispatch => {
    dispatch(requestGetQuestionDispatcher());
    return fetch(`${ API_URL }/api/question?taskId=${ taskId }&specId=${ specId }&previousQuestionIds=${ previousQuestionIds }${ honeypot ? '&hp=true' : '' }`)
      .then(r => r.json())
      .then(j => {
        fetch(`${ API_URL }/data/${ j.dataset_id }`)
          .then(r => r.json())
          .then(data => { dispatch(successGetQuestionDispatcher(j, data)) })
          .catch(error => {
            console.log('Error getting question:', error);
            console.log('Fetching again. Retries:', retries)
            retries = retries + 1
            if (retries < maxRetries) {
              dispatch(getQuestion(taskId, specId, honeypot, previousQuestionIds, retries));
            }
          })
      });
  };
}

export function startedQuestion() {
  return {
    type: STARTED_QUESTION,
    startTime: Date.now()
  };
}


function requestSubmitResponseDispatcher(question_id, response, isCorrect, honeypot) {
  return {
    type: REQUEST_SUBMIT_RESPONSE,
    question_id: question_id,
    response: response,
    isCorrect: isCorrect,
    honeypot: honeypot
  };
}

function successSubmitResponseDispatcher(question_id, response, isCorrect, honeypot) {
  return {
    type: RECEIVE_SUBMIT_RESPONSE,
    question_id: question_id,
    response: response,
    isCorrect: isCorrect,
    honeypot: honeypot
  };
}

export function submitResponse(question_id, user_id, startTime, honeypot, response, isCorrect, container, stimuliTurn, countForCurrentSpec) {
  let submitTime = Date.now();

  const { innerHeight, innerWidth, outerHeight, outerWidth, screen } = window;
  const { availHeight, availLeft, availTop, availWidth, availDepth, height, colorDepth, pixelDepth, width, orientation } = screen;
  let display = {
    container: container,
    window: {
      innerHeight,
      innerWidth,
      outerHeight,
      outerWidth,
      screen: {
        availHeight,
        availLeft,
        availTop,
        availWidth,
        colorDepth,
        height,
        pixelDepth,
        width,
      }
    },
  }

  let userInfo = {
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    userAgent:  navigator.userAgent,
    platform: navigator.platform,
    appCodeName: navigator.appCodeName,
    appName: navigator.appName,
    appVersion: navigator.appVersion
  }

  const params = {
    question_id: question_id,
    user_id: user_id,
    honeypot: honeypot,
    response: response,
    correct: isCorrect,
    start_time: startTime,
    response_time: submitTime - startTime,
    submit_time: submitTime,
    user_info: userInfo,
    display: display,
    stimuli_turn: stimuliTurn,
    count_for_current_spec: countForCurrentSpec
  };
  
  return dispatch => {
    dispatch(requestSubmitResponseDispatcher(question_id, response, isCorrect, honeypot));
    return fetch(`${ API_URL }/api/response`, {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json'}
    })
    .then(r => r.json())
    .then(j => {
      dispatch(successSubmitResponseDispatcher(question_id, response, isCorrect, honeypot))
    });
  };
}

function requestSubmitPostExperimentDispatcher() {
  return {
    type: REQUEST_SUBMIT_POST_EXPERIMENT,
  };
}

function successSubmitPostExperimentDispatcher() {
  return {
    type: RECEIVE_SUBMIT_POST_EXPERIMENT,
  };
}

export function initializeUser(userId, referrer) {
  const params = {
    user_id: userId,
    referrer: referrer,
    mturk: (referrer ? referrer.contains('mturk') : false)
  }

  return dispatch => {
    return fetch(`${ API_URL }/api/start_user`, {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json'}
    })
    .then(r => r.json())
    .then(j => { console.log('Initialized user' )});
  };
}

export function submitPostExperiment(userId, gender, education, age, visionDeficiency, dataFrequency, freeformText) {
  let submitTime = Date.now();

  const params = {
    user_id: userId,
    gender,
    education,
    age,
    vision_deficiency: visionDeficiency,
    data_frequency: dataFrequency,
    freeform_text: freeformText
  }

  return dispatch => {
    dispatch(requestSubmitPostExperimentDispatcher());
    return fetch(`${ API_URL }/api/end_user`, {
      method: 'post',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json'}
    })
    .then(r => r.json())
    .then(j => {
      dispatch(successSubmitPostExperimentDispatcher(j))
    });
  };
}

export function resetStats() {
  return {
    type: RESET_STATS
  };
}