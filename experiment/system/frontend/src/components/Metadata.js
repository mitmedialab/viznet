import React, { Component } from 'react';
import { connect } from 'react-redux';

import renderCorrectTimeSeries from '../correctTimeSeries'
import { taskIdToName, specIdToName } from '../reducers'

import { triggerGetQuestion, changeTask, changeSpec } from '../actions'

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

import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';


let id = 0;
function createData(key, value) {
  id += 1;
  return { id, key, value };
}

class MetaData extends Component {
  state = {
    createTime: Date.now(),
    time: 0
  }

  tick() {
    this.setState(prevState => ({
      time: prevState.time + 1
    }));
  }

  handleChangeTask = (taskId) => {
    this.props.changeTask(taskId);
    this.props.triggerGetQuestion();  //taskId, this.props.session.specId);
  }

  handleChangeSpec = (specId) => {
    this.props.changeSpec(specId);
    this.props.triggerGetQuestion();  //(this.props.session.taskId, specId);
  }  

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 100);
  }

  componentWillUnmount() { clearInterval(this.interval); }

  render() {
    const { userId: user_id, taskId: task_id, stage } = this.props.session;
    const { correct, id: question_id, dataset_id, corpus, honeypot } = this.props.question;
    const renderTime = Date.now();

    let specDropdown = (
      <FormControl>
        <Select
          value={ this.props.session.currentSpec.description.id }
          onChange={ (e) => this.handleChangeSpec(e.target.value) }
        >
          { ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]).map((specId, i) =>
            <MenuItem
              key={ `spec-id-selector-${ specId }`}
              value={ specId }
            >{ `${ specId }: ${ specIdToName[specId] }` }</MenuItem>
          ) }
        </Select>
      </FormControl>);

    let taskDropdown = (
      <FormControl>
        <Select
          value={ this.props.session.taskId }
          onChange={ (e) => this.handleChangeTask(e.target.value) }
        >
          { ([0, 1, 2, 3, 4 ]).map((taskId, i) =>
            <MenuItem
              key={ `task-id-selector-${ taskId }`}
              value={ taskId }
            >{ `${ taskId }: ${ taskIdToName[taskId] }` }</MenuItem>
          ) }
        </Select>
      </FormControl>);

    const rows = [
      createData('Elapsed Time', (this.state.time / 10).toFixed(1) ),
      createData('Honeypot', ( honeypot ? 'true' : 'false' ) ),
      createData('Correct Response', correct ),
      createData('Corpus', corpus ),
      createData('Question ID', question_id ),
      createData('Dataset ID', dataset_id ),
      createData('User ID', user_id ),      
    ];

    return (
      <Grid
        item
        xs={12}
        sm={4}
      >
        <Card>
          <CardHeader title="Metadata" />
          <Table>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  Task ID
                </TableCell>
                <TableCell numeric>{ taskDropdown }</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Spec ID
                </TableCell>
                <TableCell numeric>{ specDropdown }</TableCell>
              </TableRow>             
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
        </Card>
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  const { question, stats, session } = state;
  return {
    question, stats, session
  };
}

export default connect(mapStateToProps, {
  changeTask,
  changeSpec,
  triggerGetQuestion
})(MetaData);