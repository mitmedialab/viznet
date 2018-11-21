import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { styles as taskStyles } from './Task';

const styles = theme => ({ ...taskStyles(theme), 
  root: {
    flexGrow: 1,
  },
  buttonGroup: {
  	marginTop: 20
  },
  button: {
  	marginLeft: 2,
  	marginRight: 2
  }
});

class MultipleChoiceQuestions extends Component {
	render() {
		const { header, question, noneOption, choices, correctFn, incorrectFn, classes } = this.props;

		return (
			<Grid container spacing={40}>
        <Grid 
          item 
          xs={12}
          sm={6}
        >
          <Grid
            container
            direction="column"
            justify="center"
            alignItems="flex-end"
            className={classes.taskContainer}
          >
          	
	          { (typeof question === 'string') ?
              <Typography className={ classes.questionText } variant="title" dangerouslySetInnerHTML={{__html: question }}></Typography> :
              question
            }
	          <div className={classes.buttonContainer}>
		          <div className={ classes.button }>
	              { choices.map((choice, i) => 
									<Button
										key={`button-${ i }`}
										variant={ choice.action ? "contained" : "outlined" }
					          color="primary"
										onClick={ choice.correct ? correctFn : incorrectFn }
										className={ classes.button }
									>
										{ choice.value }
									</Button>
								)}
	            </div>
	            { noneOption && <Button
                className={ classes.skipButton }
                onClick={ incorrectFn }
              >None</Button> }
            </div>
          </Grid>
        </Grid>
        <Grid
          item 
          xs={12}
          sm={6}
          className={classes.visualizationContainer}
        >
          <div className={ classes.visualization }>
            { this.props.children }
          </div>
        </Grid>    
      </Grid>
		);
	}
}

MultipleChoiceQuestions.defaultProps = {
	noneOption: false
}

MultipleChoiceQuestions.propTypes = {
	question: PropTypes.string.isRequired,
	noneOption: PropTypes.bool,
	incorrectFn: PropTypes.func.isRequired,
	correctFn: PropTypes.func.isRequired
}

export default withStyles(styles)(MultipleChoiceQuestions);