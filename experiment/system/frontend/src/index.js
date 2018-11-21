import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose, applyMiddleware } from 'redux';
import persistState from 'redux-localstorage'
import { Provider } from 'react-redux'
import { createLogger } from 'redux-logger'
import app from './reducers';
import './index.css';
import App from './App';
import 'typeface-roboto';
import registerServiceWorker from './registerServiceWorker';
// import thunkMiddleware from 'redux-thunk';
import thunk from 'redux-thunk';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import RavenMiddleware from 'redux-raven-middleware';

let debug = (process.env.NODE_ENV == 'development');
let enhancer;
if ( debug ) {
	enhancer = compose(
		applyMiddleware(thunk),
		persistState(),
		applyMiddleware(createLogger({
			collapsed: true
		})),
	)
} else {
	enhancer = compose(
		applyMiddleware(thunk),
		persistState(),
		applyMiddleware(RavenMiddleware(
		  'https://553ca2bc3bde4fad9ce6d22698bcda94@sentry.io/1279836'
		))
	)
}

const store = createStore(app, enhancer);

const theme = createMuiTheme({
	overrides: {
		MuiButton: {
			outlined: {
				textTransform: 'none'
			}
		},
		MuiTypography: {
			title: {
				fontWeight: 400
			}
		}
	}
});

ReactDOM.render(
	<Provider store={ store }>
		<MuiThemeProvider theme={theme}>
			<App />
		</MuiThemeProvider>
	</Provider>,
	document.getElementById('root')
);

registerServiceWorker();
