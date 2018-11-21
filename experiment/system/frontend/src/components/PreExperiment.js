import React, { Component } from 'react';
import { connect } from 'react-redux';

import Header from './Header';
import Stats from './Stats';
import Task from './Task';
import Metadata from './Metadata';

import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import MultipleChoiceQuestions from './MultipleChoice';

import colorBlindnessTest1 from '../assets/color_blindness_test_1.gif';
import colorBlindnessTest2 from '../assets/color_blindness_test_2.gif';
import practiceWithoutAnnotation from '../assets/practice_without_annotation.png';
import practiceWithAnnotation from '../assets/practice_with_annotation.png';

import { START_EXPERIMENT, START_PRESCREEN, FAIL_PRESCREEN, COMPLETE_PRESCREEN, logExperimentEvent, initializeUser } from '../actions';

import Form from "react-jsonschema-form";

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    width: '100%',
    maxWidth: 500,
  },
});


const questions = [
	{
		question: "What do number do you see in this image?",
		content: <img src={ colorBlindnessTest1 } alt="Color Blindness Test 1" />,
		noneOption: true,
		choices: [{
			value: 8,
	  		correct: true,
	  	}, {
	  		value: 5,
	  		correct: false,
	  	}, {
	  		value: 9,
	  		correct: false,
	  	}, {
	  		value: 3,
	  		correct: false,
	  	}].shuffle()
	},
	{
		question: "What do number do you see in this image?",
		content: <img src={ colorBlindnessTest2 } alt="Color Blindness Test 2" />,
		noneOption: true,
		choices: [{
	  		value: 21,
	  		correct: false,
	  	}, {
	  		value: 74,
	  		correct: true,
	  	}, {
	  		value: 35,
	  		correct: false,
	  	}, {
	  		value: 86,
	  		correct: false,
	  	}].shuffle()
	},
	{
		question: <div style={{ maxWidth: 340 }}>
			<Typography component="p" paragraph>Please read the chart. Questions about the chart will show data fields such as <b>C</b> in <b>bold</b>, visual properties like <i>size</i> in <i>italics</i>, and other important words with an <u>underline</u>.</Typography>
			<Typography component="p" paragraph>Example 1: Considering all data points for <b>C</b>, which of the two following values of <b>C</b> has the greater <u>average</u> <b>W</b>?</Typography>
			<Typography component="p" paragraph>Example 2: What information is presented by the <i>color</i> property?</Typography>
			<Typography component="p" paragraph>Click "Ready" to begin answering questions.</Typography>
		</div>,
		content: <img width="350" src={ practiceWithoutAnnotation } alt="Practice Chart Without Annotations" />,
		choices: [{
  		value: 'Ready',
  		correct: true,
  		action: true
  	}]
	},
	{
		question: 'Which information is presented on the <i>x-axis</i>?',
		content: <img width="350" src={ practiceWithoutAnnotation } alt="Practice Chart Without Annotations" />,
		choices: [{
  		value: 'W',
  		correct: true,
  	}, {
  		value: 'C',
  		correct: false,
  	}].shuffle()
	},
  {
    question: 'Which data point has a <u>lower</u> value of <b>W</b>?',
    content: <img width="350" src={ practiceWithAnnotation } alt="Practice Chart With Annotations" />,
    choices: [{
      value: 'A',
      correct: false,
    }, {
    	value: 'B',
    	correct: true,
    }]
  }
]

const log = (type) => console.log.bind(console, type);

export class PreExperiment extends Component {
	constructor(props) {
		super(props);

		this.state = {
			stage: 0
		}
	}

	componentDidMount() {
		const { stage, userId, referrer } = this.props.session;

		// If not previously started
		if (stage < 0) {
			this.props.initializeUser(userId, referrer.value);
			this.props.logExperimentEvent(userId, START_EXPERIMENT);
		}
		if (stage == 1) {
			this.props.history.push('/experiment_mqi')
		}
		if (stage == 2) {
			this.props.history.push('/post_lqw')
		}
	}

	_startPrescreen = () => {
		this.props.logExperimentEvent(this.props.session.userId, START_PRESCREEN);
		this.setState({ stage: this.state.stage + 1 });
	}

	_next = () => {
		this.setState({ stage: this.state.stage + 1 });
	}


	_toExperiment = () => {
		this.props.logExperimentEvent(this.props.session.userId, COMPLETE_PRESCREEN);
		this.props.history.push(`/experiment_mqi`)
	}

	_correct = (v) => {
		this.setState({ stage: this.state.stage + 1 });
	}

	_incorrect = (v) => {
		if (!this.props.debug) {
			this.props.logExperimentEvent(this.props.session.userId, FAIL_PRESCREEN, { stage: v });
		}
	}

	render() {
		const { stage } = this.state;
		const { classes, session } = this.props;
		return ( <div>

			{ stage == 0 &&
			  <Grid
				  container
				  direction="column"
				  justify="flex-start"
				  alignItems="center"
				>
					<Paper className={classes.root} elevation={1}>
						<div>
					  	<Typography variant="headline" component="h3" gutterBottom >
				        Pre-Experiment
				      </Typography>
				      <Typography component="p" paragraph>
			          This HIT is part of a [OMITTED] scientific research project. Your decision to complete this HIT is voluntary. There is no way for us to identify you. The only information we will have, in addition to your responses, is the time at which you completed the survey.
				      </Typography>
				      <Typography component="p" paragraph>
								The results of the research may be presented at scientific meetings or published in scientific journals. Clicking on the 'Continue' button on the bottom of this page indicates that you are at least 18 years of age and agree to complete this HIT voluntarily.
							</Typography>
							<Typography component="p" paragraph>
					      You can withdraw from the experiment at any time without penalty or consequences of any kind. However, if you do so, you will not be paid. No tasks will take more than 30 minutes.
			        </Typography>
			        <Button
					  		variant="contained"
			          color="primary"
			          onClick={ this._startPrescreen }
			          style={{ float: 'right' }}
			        >Continue</Button>
			      </div>
				  </Paper>
				</Grid>
			}
		  { questions.map((q, i) => {
		  	if (stage == ( i + 1 )) {
		  		return (
		  			<MultipleChoiceQuestions
		  				key={ `pre-experiment-question${ i }`}
				  		header={ q.header }
				  		question={ q.question }
				  		choices={ q.choices }
				  		noneOption={ q.noneOption }
				      correctFn={ this._correct }
				      incorrectFn={ () => { this._incorrect(i + 1) } }
				  	>
				  		{ q.content }
				  	</MultipleChoiceQuestions>
		  		);
		  	}
		  })}
			{ stage == (questions.length + 1) &&
			  <Grid
				  container
				  direction="column"
				  justify="flex-start"
				  alignItems="center"
				>
					<Paper className={classes.root} elevation={1}>
						<div>
					  	<Typography variant="headline" component="h3" gutterBottom>
				        Congratulations
				      </Typography>
              <Typography component="p" paragraph>
                You have successfully completed the pre-screen. You will now complete 12 tasks in a row, each consisting of 9 questions.
              </Typography>
              { ( session.taskId == 0 ) &&
                <Typography component="p" paragraph>
                  You will be asked to read values of annotated data points. To answer, you can choose between two options, one of which is correct.
                </Typography>
              }
              { ( session.taskId == 1 ) &&
                <Typography component="p" paragraph>
                  You will be asked to compare values of annotated data points. To answer, you can choose between two options, one of which is correct.
                </Typography>
              }
              { ( session.taskId == 2 ) &&
                <Typography component="p" paragraph>
                  You will be asked to find the group containing the maximum value of a field. To answer, you can choose between two options, one of which is correct.
                </Typography>
              }
              { ( session.taskId == 3 ) &&
                <Typography component="p" paragraph>
                  You will be asked to compare the averages of two groups of data points. To answer, you can choose between two options, one of which is correct.
                </Typography>
              }
              { ( session.taskId == 4 ) &&
                <Typography component="p" paragraph>
                  You will be asked about the existence of outliers, which are observations that lie outside the overall pattern of a distribution. To answer, you can choose between two options, one of which is correct.
                </Typography>
              }
			        <Button
					  	variant="contained"
			          color="primary"
			          onClick={ this._toExperiment }
			          style={{ float: 'right' }}
			        >Next</Button>
			      </div>
				  </Paper>
				</Grid>
			}
  	</div>);
	}
};

function mapStateToProps(state) {
	const { session, debug } = state;
  return { session, debug };
}

export default connect(
  mapStateToProps,
  { logExperimentEvent, initializeUser }
)(withStyles(styles)(PreExperiment));