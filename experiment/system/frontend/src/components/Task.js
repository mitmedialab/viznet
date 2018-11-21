import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitResponse } from '../actions';

import Visualization from './Visualization';

import grey from '@material-ui/core/colors/grey';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { plot } from '../plot';

import CircularProgress from '@material-ui/core/CircularProgress';

import { prettyFloat, formatOption } from '../util'

export const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  taskContainer: {
    height: 500,
    minHeight: 500
  },
  questionText: {
    maxWidth: 450,
    fontSize: '1.2rem',
    textAlign: 'right'
  },
  visualizationContainer: {
    display: 'flex',
    // maxHeight: 500,
    'overflow-y': 'auto',  
  },
  visualization: {
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 20
  },
  optionButton: {
    minWidth: 120
  },
  skipButton: {
    color: grey[400]
  },
  [theme.breakpoints.down('xs')]: {
    taskContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 0,
      height: 'inherit',
      padding: 10
    },
    visualizationContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10
    }
  }
});

class Task extends Component {
  _onSubmit = (v) => {
    const { id, correct, startTime, rendered } = this.props.question;
    const { taskId, honeypot, userId, stimuliTurn, countForCurrentSpec } = this.props.session;
    const isCorrect = ( v === correct);

    const vizContainerStyle = getComputedStyle(document.getElementById('viz-container'));
    const container = {
      width: vizContainerStyle.width.match(/\d+/)[0],
      height: vizContainerStyle.height.match(/\d+/)[0]
    }

    const throttle = 500;
    const timeSinceRender = Date.now() - rendered;

    if (rendered && timeSinceRender >= throttle) {
      this.props.submitResponse(id, userId, startTime, honeypot, v, isCorrect, container, stimuliTurn, countForCurrentSpec );  
    } else {
      console.log('Cannot submit response: not rendered');
    };
  }

  render() {
    const { debug, classes, question, data, submitResponse } = this.props;
    const { question: questionText, options, rendered } = this.props.question;

    return (
      <Grid container spacing={40}>
        <Grid item xs={12} sm={6}>
        { rendered ?
          <Grid container direction="column" justify="center" alignItems="flex-end" className={classes.taskContainer}>
            { (questionText && questionText.text) &&
                <Typography className={ classes.questionText } variant="title" component="h3" dangerouslySetInnerHTML={{__html: questionText.text }}></Typography>
            }
            <div className={classes.buttonContainer}>
              <div className={ classes.button }>
                { (options && typeof options[0] !== 'undefined') && <Button
                    variant="outlined"
                    color="primary"
                    className={classes.optionButton}
                    style={{ marginRight: 2 }}
                    onClick={ () => { this._onSubmit(0) }}
                  >{ formatOption(options[0]) }</Button> }
                { (options && typeof options[1] !== 'undefined') && <Button
                  variant="outlined"
                  color="primary"
                  className={classes.optionButton}
                  style={{ marginLeft: 2 }}
                  onClick={ () => { this._onSubmit(1) }}
                >{ formatOption(options[1]) }</Button> }
              </div>
              { debug && <Button
                className={classes.skipButton}
                onClick={ () => { this._onSubmit(-1) }}
              >Skip</Button> }
            </div>
          </Grid> : 
          <Grid container direction="column" justify="center" alignItems="center" className={classes.taskContainer}>
            <CircularProgress className={classes.progress} /> 
          </Grid>
        }
        </Grid>
        <Grid item xs={12} sm={6} className={classes.visualizationContainer}>
          <div className={classes.visualization }>
            <Visualization />
          </div>
        </Grid>    
      </Grid>
    );
  }
}



function mapStateToProps(state) {
  const { debug, session, question, data } = state;

  return {
    session,
    question,
    data,
    debug
  };
}

export default connect(
  mapStateToProps, 
  { submitResponse }
)(withStyles(styles)(Task));