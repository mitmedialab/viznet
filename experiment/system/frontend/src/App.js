import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  BrowserRouter as Router,
  Redirect,
  Switch,
  Route,
  Link
} from 'react-router-dom'

import './App.css';
import PreExperiment from './components/PreExperiment';
import Experiment from './components/Experiment';
import PostExperiment from './components/PostExperiment';
import DoneExperiment from './components/DoneExperiment';
import Stepper from './components/Stepper';

import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';

const ProtectedRoute = ({ isAllowed, ...props }) => 
    isAllowed ? <Route {...props}/> : <Redirect to="/done_pdq"/>;

export class App extends Component {
	render() {
		const { completed } = this.props.session;
		return (
			<Router>
				<div>
					<Route path="/" component={ Stepper } />
					<Switch>
					  	<ProtectedRoute path="/pre_zme" component={ PreExperiment } isAllowed={ !completed } />
					 	<ProtectedRoute path="/experiment_mqi" component={ Experiment } isAllowed={ !completed } />
					 	<ProtectedRoute path="/post_lqw" component={ PostExperiment } isAllowed={ !completed }  />
					 	<Route path="/done_pdq" component={ DoneExperiment } />
					 	<Route path="/" render={() => (completed ? <Redirect to="/done_pdq" /> : <Redirect to="/pre_zme" /> )} />
				 	</Switch>
			 	</div>
			</Router>
  	);
	}
};

function mapStateToProps(state) {
  const { session, user, error } = state;
  return {
  	session,
    user,
    error
  };
}

export default connect(
	mapStateToProps,
	{}
)(App);