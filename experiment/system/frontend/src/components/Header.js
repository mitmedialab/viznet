import React, { Component } from 'react';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
});

class Header extends Component {
  render() {
    const { classes } = this.props;
    return (
      <header>
        <nav className="top-nav">
            <div className="container">
              <div className="nav-wrapper">
                <div className="row">
                  <div className="col s12 m10 offset-m1">
                    <Typography variant="title" component="h3" align="center">
                      VizNet Pilot Experiment
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </nav>
      </header>
    );
  }
}

export default withStyles(styles)(Header);