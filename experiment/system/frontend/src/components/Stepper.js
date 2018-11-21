import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    width: '100%',
  },
  button: {
    marginRight: theme.spacing.unit,
  },
  instructions: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
});

function getSteps() {
  return ['Pre-Experiment', 'Experiment', 'Post-Experiment'];
}

let pathnameToStep = {
  '/pre_zme': 0,
  '/experiment_mqi': 1,
  '/post_lqw': 2,
  '/done_pdq': 2
};

class HorizontalLinearStepper extends Component {
  render() {
    const { classes, session, location, config, stats } = this.props;
    const { pathname } = location;
    const steps = getSteps();
    const activeStep = pathnameToStep[pathname];

    return (
      <div className={classes.root}>
        <Stepper activeStep={activeStep}>
          { steps.map((label, index) => {
            const props = {};
            const labelProps = {};          
            if ( index == 1) {
              labelProps.optional = <div>
                <Typography variant="caption">Stage: { session.stimuliTurn + 1 }/{ session.specs.length }</Typography>
                <Typography variant="caption">Question: { session.honeypot ? 1 : (session.countForCurrentSpec + 2) }/{ config.numPerSpec + 1 }</Typography>
              </div>
            }         
            return (
              <Step key={label} {...props}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <div>
          {activeStep === steps.length ? (
            <div>
              <Typography className={classes.instructions}>
                All steps completed - you&quot;re finished
              </Typography>
              <Button onClick={this.handleReset} className={classes.button}>
                Reset
              </Button>
            </div>
          ) : (
            <div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { config, session, stats } = state;
  
  return {
    config,
    session,
    stats
  };
}

export default connect(
  mapStateToProps,
  {}
)(withStyles(styles)(withRouter(HorizontalLinearStepper)));