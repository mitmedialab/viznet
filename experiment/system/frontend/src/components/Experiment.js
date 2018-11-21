import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Header from './Header';
import Stats from './Stats';
import Task from './Task';
import Metadata from './Metadata';

import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';

import { START_TASKS, COMPLETE_TASKS, logExperimentEvent, getQuestion } from '../actions';

export class Experiment extends Component {
	componentDidMount() {
		const { taskId, stage, currentSpec, honeypot, shouldLoadQuestion, previousQuestionIds } = this.props.session;
		if (shouldLoadQuestion) {
			this.props.getQuestion(taskId, currentSpec.description.id, honeypot, previousQuestionIds);
		}

		if (this.props.stats.validNum == 0) {
			this.props.logExperimentEvent(this.props.session.userId, START_TASKS)
		}

		if (stage < 1) {
			this.props.history.push('/pre_zme')
		}
		if (stage > 1) {
			this.props.history.push('/done_pdq')
		}				
	}

	componentWillReceiveProps(nextProps) {
		const { taskId, currentSpec, honeypot, shouldLoadQuestion, previousQuestionIds } = nextProps.session;
		if (shouldLoadQuestion) {
			nextProps.getQuestion(taskId, currentSpec.description.id, honeypot, previousQuestionIds);
		}

		if (nextProps.stats.validNum >= nextProps.config.limit) {
			this.props.logExperimentEvent(nextProps.session.userId, COMPLETE_TASKS)
			nextProps.history.push('/post_lqw')
		}
	}

	render() {
		return (
		  <div className="experiment">
		    <Task />
		    { this.props.debug && 
		    	<div>
			    	<Divider />
				    <Grid
				    	container
				    	justify="center"
				    	alignItems="flex-start"
				    	spacing={24}
				    >
					    <Stats />
					    <Metadata />
				    </Grid>
				</div>
			}
		  </div>
  	);
	}
};

function mapStateToProps(state) {
  const { config, session, stats, debug } = state;
  return { config, session, stats, debug };
}

export default connect(
	mapStateToProps,
	{ getQuestion, logExperimentEvent }
)(withRouter(Experiment));