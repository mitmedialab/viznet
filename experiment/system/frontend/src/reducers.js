import {
    TRIGGER_GET_QUESTION,
	REQUEST_GET_QUESTION,
	RECEIVE_GET_QUESTION,
    STARTED_QUESTION,
	REQUEST_SUBMIT_RESPONSE,
	RECEIVE_SUBMIT_RESPONSE,
    CHANGE_TASK,
    CHANGE_SPEC,
	RESET_STATS,
    START_EXPERIMENT,
    FAIL_PRESCREEN,
    COMPLETE_PRESCREEN,
    COMPLETE_TASKS,
    COMPLETE_POSTSCREEN,
} from './actions'

import shortid from 'shortid';
import specs from './specs.json';

// Randomize spec order
Array.prototype.shuffle = function(){
  for (let i = this.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [this[i - 1], this[j]] = [this[j], this[i - 1]];
  }
  return this;
}
specs.shuffle();

const numTasks = 5;
const numSpecs = specs.length;

const debug = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');

const numPerSpec = 8; // debug ? 1 : 8;
export const taskIdToName = {
    0: 'Find Value',
    1: 'Compare Values',
    2: 'Compare Maximum',
    3: 'Compare Averages',
    4: 'Detect Outliers'
}

export const specIdToName = {
    0: 'C: color, Q1: x, Q2: y',
    1: 'C: row, Q1: x, Q2: y',
    2: 'C: y, Q1: x, Q2: color',
    3: 'C: y, Q1: x, Q2: size',
    4: 'C: y, Q1: color, Q2: x',
    5: 'C: y, Q1: size, Q2: x',
    6: 'C: color, Q1: y, Q2: x',
    7: 'C: row, Q1: y, Q2: x',
    8: 'C: x, Q1: y, Q2: color',
    9: 'C: x, Q1: y, Q2: size',
    10: 'C: x, Q1: color, Q2: y',
    11: 'C: c, Q1: size, Q2: y',     
}

const initialState = {
    debug: debug,
	config: {
		apiUrl: process.env.API_URL,
        numPerSpec: numPerSpec,
        limit: numPerSpec * numSpecs,
        numTasks: numTasks
	},
	session: {
        referrer: document.referrer,
		specs: specs,
		userId: shortid.generate(),
        taskId: Math.floor(Math.random() * numTasks),
        completed: false,
        currentSpec: specs[0],
        totalNumResponses: 0,
        stimuliTurn: 0,
        stage: -1,  // not started, prescreen, experiment, post, end
        countForCurrentSpec: 0,  // Number of tasks completed for current spec (Kim and Heer = questionTurn)
        startTime: Date.now(),
        previousQuestionIds: [],        
        allPreviousQuestionIds: [],
        endTime: null,
        failStage: false,
        honeypot: true,
        shouldLoadQuestion: true
	},
	data: [],
	question: {
		loaded: false,
        rendered: false,
		options: [ null, null ],
		correct: null,
		questionId: null,
		specId: null,
		datasetId: null,
        startTime: null,
	},
	stats: {
		correctNum: 0,
		skippedNum: 0,
		validNum: 0,
		totalNum: 0,
		responses: []
	}
}

export default function app(state = initialState, action) {
  switch (action.type) {
    case START_EXPERIMENT:
        return {
            ...state,
            session: {
                ...state.session,
                stage: 0
            }
        }   
    case COMPLETE_PRESCREEN:
        return {
            ...state,
            session: {
                ...state.session,
                stage: 1
            }
        }    
    case COMPLETE_POSTSCREEN:
        return {
            ...state,
            session: {
                ...state.session,
                stage: 2,
                completed: true
            }
        }            
    case RECEIVE_GET_QUESTION:
        return {
            ...state,
            data: action.data,
            question: {
                loaded: Date.now(),
                ...action.question
            },
            session: {
                ...state.session,
                shouldLoadQuestion: false,
                previousQuestionIds: [ ...state.session.previousQuestionIds, action.question.id ],
                allPreviousQuestionIds: [ ...state.session.allPreviousQuestionIds, action.question.id ]
            }
        }


    case TRIGGER_GET_QUESTION:
        return {
            ...state,
            session: {
                ...state.session,
                shouldLoadQuestion: true
            }
        }

    case RECEIVE_SUBMIT_RESPONSE:
        var newSession = { ...state.session };
        newSession.totalNumResponses = state.session.totalNumResponses + 1;

        if (action.honeypot) {
            newSession.honeypot = false;
        }        

        if (action.response !== -1 && !action.honeypot) {
            let newCountForCurrentSpec = state.session.countForCurrentSpec + 1;

            // If user evaluated the desired # per spec, increment the spec
            if (newCountForCurrentSpec >= state.config.numPerSpec) {
                
                // If the user evaluated the desired number of specs, complete the experiment
                if (newSession.stimuliTurn + 1 >= numSpecs) {
                    newSession.stage = 2;
                } else {
                    newSession.honeypot = true;
                    newSession.stimuliTurn = newSession.stimuliTurn + 1;
                    newSession.currentSpec = specs[newSession.stimuliTurn];
                    newSession.previousQuestionIds = [];
                    newSession.countForCurrentSpec = 0;

                }
            } else {
                newSession.countForCurrentSpec = newCountForCurrentSpec;
            }
        }
        newSession.shouldLoadQuestion = true;

    	return {
            ...state,
            question: initialState.question,
            session: newSession,
            stats: {
                correctNum: ((action.isCorrect) ? state.stats.correctNum += 1 : state.stats.correctNum),
                skippedNum: ((action.response === -1 && !action.honeypot) ? state.stats.skippedNum += 1 : state.stats.skippedNum),
                validNum: ((action.response !== -1 && !action.honeypot) ? state.stats.validNum += 1 : state.stats.validNum),
                honeypotNum: (action.honeypot) ? state.stats.honeypotNum += 1 : state.stats.honeypotNum,
                totalNum: state.stats.totalNum += 1,
                responses: [ ...state.stats.responses, { 
                    question_id: action.question_id,
                    isCorrect: action.isCorrect,
                    response: action.response 
                } ]
            }
        }    
    case RESET_STATS:
        return {
            ...state,
            stats: initialState.stats
        }
    case FAIL_PRESCREEN:
        return {
            ...state,
            session: {
                ...state.session,
                failStage: action.data.stage,
                completed: true
            }
        }        
    case STARTED_QUESTION:
        return {
            ...state,
            question: {
                ...state.question,
                rendered: Date.now(),
                startTime: action.startTime
            }
        }	
    case CHANGE_TASK:
        var newState = { ...state };
        newState['session']['taskId'] = action.taskId;
        return newState;

    case CHANGE_SPEC:
        var newState = { ...state };
        newState['session']['currentSpec'] = specs.find((s) => { return s.description.id == action.specId });
        return newState;     
  }
  return state
}