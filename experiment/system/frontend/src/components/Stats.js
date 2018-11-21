import React, { Component } from 'react';
import { connect } from 'react-redux';
import renderCorrectTimeSeries from '../correctTimeSeries'

import { resetStats } from '../actions'

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

let id = 0;
function createData(key, value) {
  id += 1;
  return { id, key, value };
}

const styles = {
  card: {
    minWidth: 275,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    marginBottom: 16,
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
};

class Stats extends Component {

  componentDidMount() {
    const { responses } = this.props.stats;
    if (responses.length) {
      renderCorrectTimeSeries('#time-series', responses);
    }    
  }

  componentWillReceiveProps(nextProps) {
    const { responses } = nextProps.stats;
    if (responses.length) {
      renderCorrectTimeSeries('#time-series', responses);
    }
  }

  _resetStats = () => {
    this.props.resetStats();
  }
  
  render() {
    const { correctNum, skippedNum, totalNum, responses } = this.props.stats;

    const rows = [
      createData('Correct #', correctNum ),
      createData('Skipped #', skippedNum ),
      createData('Total #', totalNum ),
    ];

    return (
      <Grid
        item
        xs={12}
        sm={4}
      >
        <Card>
          <CardHeader title="Stats" />
            <div id="time-series" />
          <Table>  
            <TableBody>
              { rows.map(row => {
                return (
                  <TableRow key={row.id}>
                    <TableCell component="th" scope="row">
                      {row.key}
                    </TableCell>
                    <TableCell numeric>{row.value}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <CardActions>
            <Button
              variant="outlined"
              color="secondary"
              onClick={ this._resetStats }
            >Reset Votes</Button>
          </CardActions>
        </Card>
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  const { stats } = state;
  return {
    stats
  };
}

export default connect(mapStateToProps, {
  resetStats
})(withStyles(styles)(Stats));