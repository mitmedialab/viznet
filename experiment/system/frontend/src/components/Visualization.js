import React, { Component } from 'react';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';
import { task, plot } from '../plot';
import { triggerGetQuestion, startedQuestion, flagQuestion } from '../actions';

import CircularProgress from '@material-ui/core/CircularProgress';

class Visualization extends Component {

	getErrorHandler = (questionId) => {
		let context = this;
		return () => {
			context.props.flagQuestion(questionId);
			context.props.triggerGetQuestion();
		}
	}

	successHandler = () => {
		this.props.startedQuestion();
	}

	componentDidMount() {
		const { spec, data, question, session } = this.props;
		const canRenderVisualization = (typeof spec == 'object' && data.length && typeof question == 'object');

		let errorHandler = this.getErrorHandler(question.id);
		if (canRenderVisualization) {
			try {
				task("#viz-container", spec, data, question, this.successHandler, errorHandler);
			} catch (error) {
				errorHandler();
			}
		}
	}

	componentWillReceiveProps(nextProps) {
		const { spec, data, question, session } = nextProps;
		const { taskId, specId } = session;

		let errorHandler = this.getErrorHandler(question.id);

		const canRenderVisualization = (typeof spec == 'object' && data.length && typeof question == 'object');
		const shouldRerenderVisualization = (
			( spec.description.id != this.props.spec.description.id ) ||
			( data.length != this.props.data.length ) ||
			( question.id != this.props.question.id ) &&
			( question.loaded )
		)
		if (canRenderVisualization && shouldRerenderVisualization) {
			try {
				task("#viz-container", spec, data, question, this.successHandler, errorHandler);
			} catch (error) {
				console.log('Visualization componentWillReceiveProps error:', error);
				errorHandler();
			}
		}
	}

	render() {
		const { shouldLoadQuestion } = this.props.session;
		return (
			<div id="viz-container">
				<CircularProgress />
			</div>
		)
	}
}

function mapStateToProps(state) {
  const { data, session, question } = state;
  
  return {
    spec: session.currentSpec,
    session,
    question,
    data
  };
}

export default connect(
  mapStateToProps, 
  { triggerGetQuestion, startedQuestion, flagQuestion }
)(Visualization);