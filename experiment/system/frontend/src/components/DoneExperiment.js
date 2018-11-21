import React, { Component } from 'react';
import { connect } from 'react-redux';
import { CopyToClipboard } from 'react-copy-to-clipboard';

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
  	paddingTop: 20,
  	paddingBottom: 20
  },
  input: {
  	marginBottom: 15
  }
});

export class DoneExperiment extends Component {
	state = {
		copied: false
	}

	render() {
		const { session, classes } = this.props;
		const { userId, failStage, completed } = session;

		return (
			<Grid
			  container
			  direction="column"
			  justify="flex-start"
			  alignItems="center"
			>	
				<Paper className={classes.root} elevation={1}>
			  	<Typography variant="headline" component="h3" gutterBottom>
		        Experiment Completed
		      </Typography>
		      { ( completed && failStage) &&
		      	<div>
			      	<Typography component="p" paragraph>
				        Unfortunately, we require participants to successfully complete all pre-screening questions before proceeding to the main tasks. Sorry for the inconvenience.
				      </Typography>	
				     	<Typography component="p" paragraph>
					      Please close this window and return this HIT.
					    </Typography>
					  </div>
		      }
		      { ( completed && !failStage && userId) &&
		      	<div>
			      	<Typography component="p" paragraph>
				        Please copy this code and post it on the Mechanical Turk page, then submit your HIT.
				      </Typography>				      
				      <Typography component="p" paragraph>
			          Your completion code is: <b>{ userId }</b>
			        </Typography>		
			       	<CopyToClipboard text={ userId }
			          onCopy={() => this.setState({copied: true})}>  
		          	<Button
			          	variant="outlined"
			          >{ this.state.copied ? 'Copied' : 'Copy to Clipboard' }
			          </Button>
			        </CopyToClipboard>
			      </div>
		      }
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
	{}
)(withStyles(styles)(DoneExperiment));