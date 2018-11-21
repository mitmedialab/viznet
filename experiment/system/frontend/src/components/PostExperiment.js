import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import Header from './Header';
import Stats from './Stats';
import Task from './Task';
import Metadata from './Metadata';

import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import { withStyles } from '@material-ui/core/styles';

import { START_POSTSCREEN, COMPLETE_POSTSCREEN, logExperimentEvent, submitPostExperiment } from '../actions';

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,  	
    width: '100%',
    maxWidth: 500,
  },
  formOptions: {
  	display: 'flex',
  	flexDirection: 'column',
  	paddingBottom: 20
  },
  input: {
  	marginBottom: 15
  },
  body: {
  	marginTop: 15,
  	marginBottom: 15
  }
});

export class PostExperiment extends Component {
	state = {
		age: '',
		gender: '',
		education: '',
		visionDeficiency: '',
		dataFrequency: '',
		freeformText: ''
	}

	componentDidMount() {
		this.props.logExperimentEvent(this.props.session.userId, START_POSTSCREEN);
	}	

	handleChange = (event) => {
		let newState = this.state;
		newState[event.target.name] = event.target.value;
    this.setState(newState);
  }
	
	handleSubmit = () => {
		const { age, gender, education, visionDeficiency, dataFrequency, freeformText } = this.state;
		this.props.submitPostExperiment(this.props.session.userId, gender, education, age, visionDeficiency, dataFrequency, freeformText);
		this.props.logExperimentEvent(this.props.session.userId, COMPLETE_POSTSCREEN);
		this.props.history.push('/done_pdq')
	}

	render() {
		const { classes } = this.props;
		const { age, gender, education, visionDeficiency, dataFrequency, freeformText } = this.state;

		return (
			<Grid
			  container
			  direction="column"
			  justify="flex-start"
			  alignItems="center"
			>	
				<Paper className={classes.root} elevation={1}>
			  	<Typography variant="headline" component="h3" gutterBottom>
		        Post-Experiment
		      </Typography>
		      <div className={ classes.body }>
			      <Typography component="p" paragraph>
		          Before you complete this experiment, please fill in the questions below.
	  	      </Typography>
	  	    </div>

          <ValidatorForm
            ref="form"
            onSubmit={ this.handleSubmit }
            onError={errors => console.log(errors)}
          >
          	<div className={ classes.formOptions} >
	            <SelectValidator
	              label="What is your age?"
	              onChange={this.handleChange}
	              name="age"
	              value={ age }
	              validators={['required']}
	              errorMessages={['This field is required']}
	              className={ classes.input }
	            >
		            <MenuItem value={0}>Under 18</MenuItem>
		            <MenuItem value={1}>18-23</MenuItem>
		            <MenuItem value={2}>24-34</MenuItem>            	
		            <MenuItem value={3}>35-40</MenuItem>            	
		            <MenuItem value={4}>41-54</MenuItem>            	
		            <MenuItem value={5}>Above 55</MenuItem>            	
		            <MenuItem value={6}>I would prefer to not comment</MenuItem>            	
	            </SelectValidator>    

	            <SelectValidator
	              label="What gender do you identify most with?"
	              onChange={this.handleChange}
	              name="gender"
	              value={ gender }
	              validators={['required']}
	              errorMessages={['This field is required']}
	              className={ classes.input }
	            >
		            <MenuItem value={0}>Male</MenuItem>
		            <MenuItem value={1}>Female</MenuItem>
		            <MenuItem value={2}>Non-binary / third gender</MenuItem>            	
		            <MenuItem value={3}>Prefer not to say</MenuItem>            	
	            </SelectValidator>    

	            <SelectValidator
	              label="Do you have color vision deficiency?"
	              onChange={this.handleChange}
	              name="visionDeficiency"
	              value={ visionDeficiency }
	              validators={['required']}
	              errorMessages={['This field is required']}
	              className={ classes.input }
	            >
		            <MenuItem value={0}>Yes</MenuItem>
		            <MenuItem value={1}>No</MenuItem>
		            <MenuItem value={2}>Unsure</MenuItem>            	
	            </SelectValidator>    	            

	            <SelectValidator
	              label="What is your highest qualification?"
	              onChange={this.handleChange}
	              name="education"
	              value={ education }
	              validators={['required']}
	              errorMessages={['This field is required']}
	              className={ classes.input }	              
	            >
		            <MenuItem value={0}>High school diploma</MenuItem>
		            <MenuItem value={1}>Associate degree</MenuItem>
		            <MenuItem value={2}>No degree</MenuItem>            	
		            <MenuItem value={3}>Bachelor's degree</MenuItem>      
		            <MenuItem value={4}>Master's degree</MenuItem>            	
		            <MenuItem value={5}>PhD</MenuItem>            	
	            </SelectValidator>                   

	            <SelectValidator
	              label="How frequently do you perform data analysis?"
	              onChange={this.handleChange}
	              name="dataFrequency"
	              value={ dataFrequency }
	              validators={['required']}
	              errorMessages={['This field is required']}
	              className={ classes.input }	              
	            >
		            <MenuItem value={0}>Daily as part of a job</MenuItem>
		            <MenuItem value={1}>Daily as a hobby</MenuItem>
		            <MenuItem value={2}>Monthly</MenuItem>            	
		            <MenuItem value={3}>Less than once a month</MenuItem>            	
		            <MenuItem value={4}>Never</MenuItem>            	
	            </SelectValidator>                                  

	            <TextValidator
	              label="Any comments or questions?"
	              onChange={this.handleChange}
	              name="freeformText"
	              value={ freeformText }
	              validators={[]}
	              errorMessages={['This field is required']}
	              className={ classes.input }	              
	            />
	          </div>
            <Button
	          variant="contained"
	          color="primary"
	          type="submit"
	          style={{ float: 'right' }}	          
	        >Submit</Button>
          </ValidatorForm>			  	
        </Paper>
    	</Grid>
  	);
	}
};

function mapStateToProps(state) {
	const { session } = state;
  return { session };
}

export default connect(
	mapStateToProps,
	{ logExperimentEvent, submitPostExperiment }
)(withStyles(styles)(withRouter(PostExperiment)));