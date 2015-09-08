var ScheduleDashboard = React.createClass({
    getInitialState: function() {
        return {page: "schedule", viewSchedule: null, edit: false}
    },
    renderSchedule: function(name, edit) {
        console.log("render", name, edit);
        this.setState({viewSchedule: name,
                       edit: edit});
    },
    deleteSchedule: function(name) {
        $.ajax({
            url: '/schedule/delete',
            datatype: 'json',
            type: 'POST',
            data: {name: name},
            success: function() {
                console.log("delete", name);
                this.setState({viewSchedule: null});
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },
    render: function() {
        return (
            <div className="scheduleDashboard">
                <h1>XBOS</h1>
                <div className="row">
                    <ReactBootstrap.Nav bsStyle='tabs' activeKey={this.state.page} >
                        <ReactBootstrap.NavItem eventKey={"dashboard"} href="/dashboard">Dashboard</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"schedule"} href="/schedule">Schedule</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"status"} href="/deckard"><Glyphicon glyph="chevron-right" /> Status</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"plotter"} href="/plotter"><Glyphicon glyph="chevron-right" /> Plotter</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"logout"} href="/logout">Logout</ReactBootstrap.NavItem>
                    </ReactBootstrap.Nav>
                </div>
                <div className="row">
                    <div className="col-md-4">
                        <ScheduleList renderSchedule={this.renderSchedule} deleteSchedule={this.deleteSchedule} />
                    </div>
                    <div className="col-md-8">
                        {this.state.viewSchedule == null ? <span></span> : <ScheduleView scheduleName={this.state.viewSchedule} edit={this.state.edit} />}
                    </div>
                </div>
            </div>
        )
    }
});

var ScheduleView = React.createClass({
    getInitialState: function() {
        return {name: this.props.scheduleName,
                description: null,
                point_descs: {},
                periods: []}
    },
    componentDidUpdate: function(prevProps) {
        if ((prevProps.scheduleName != this.props.scheduleName) || (prevProps.edit != this.props.edit)) {
            this.fetchSchedule();
        }
    },
    componentWillMount: function() {
        this.fetchSchedule();
    },
    fetchSchedule: function() {
        $.ajax({
            url: '/schedule/name/'+this.props.scheduleName,
            datatype: 'json',
            type: 'GET',
            success: function(schedule) {
                this.setState({description: schedule.description,
                               point_descs: schedule["point descriptions"],
                               periods: schedule.periods});
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },
    render: function() {
        var view = (<span></span>);
        if (this.props.edit) {
            view = (
                <Panel header={"EDIT Schedule:" + this.props.scheduleName} bsStyle="warning">
                    <ScheduleEditor name={this.props.scheduleName} />
                </Panel>
            );
        } else {
            view = (
                <Panel header={"Schedule:" + this.props.scheduleName} bsStyle="info">
                    <p>{this.state.description}</p>
                    <PointDescriptionView descriptions={this.state.point_descs} />
                    <EpochListView epochs={this.state.periods} />
                </Panel>
            );
        }

        return (
            <div className="scheduleView">
                {view}
            </div>
        )
    }
});

var PointDescriptionView = React.createClass({
    render: function() {
        var rows = _.map(this.props.descriptions, function(value, name) {
            return (
                <tr key={"row"+name}>
                    <td>{name}</td>
                    <td>{value.units}</td>
                    <td>{value.desc}</td>
                </tr>
            )
        });
        return (
            <div className="pointDescriptionView">
                <Table striped bordered condensed>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Units</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </Table>
            </div>
        );
    }
});

var ScheduleEditor = React.createClass({
    getInitialState: function() {
        return {name: null, description: null, point_descs: [], periods: []}
    },
    componentDidUpdate: function(prevProps) {
        if (prevProps.name != this.props.name) {
            this.fetchSchedule();
        }
    },
    componentWillMount: function() {
        this.fetchSchedule();
    },
    fetchSchedule: function() {
        $.ajax({
            url: '/schedule/name/'+this.props.name,
            datatype: 'json',
            type: 'GET',
            success: function(schedule) {
                var point_descs = _.map(schedule["point descriptions"], function(value, key) {
                    return {name: key, desc: value.desc, units: value.units};
                });
                this.setState({name: schedule.name,
                               description: schedule.description,
                               point_descs: point_descs,
                               periods: schedule.periods});
                this.forceUpdate();
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },

    editHeader: function(field, evt) {
        var s = this.state
        s[field] = evt.target.value;
        this.setState({s});
    },

    editPointDescRow: function(idx, field, evt) {
        var point_descs = this.state.point_descs;
        point_descs[idx][field] = evt.target.value;
        this.setState({point_descs: point_descs});
    },
    addPointDescRow: function() {
        var point_descs = this.state.point_descs;
        point_descs[point_descs.length] = {name: "", desc: "", units: ""}
        this.setState({point_descs: point_descs});
    },
    removePointDescRow: function(idx) {
        var point_descs = this.state.point_descs;
        point_descs.splice(idx, 1);
        this.setState({point_descs: point_descs});
    },

    editEpoch: function(idx, field, evt) {
        evt.preventDefault();
        var epochs = this.state.periods;
        epochs[idx][field] = evt.target.value;
        this.setState({periods: epochs});
    },
    addEpoch: function() {
        var epochs = this.state.periods;
        if (epochs == null) {
            epochs = [];
        }
        epochs[epochs.length] = {name: "", start: "", points: []};
        this.setState({periods: epochs});
    },
    removeEpoch: function(idx) {
        var epochs = this.state.periods;
        epochs.splice(idx, 1);
        this.setState({periods: epochs});
    },

    editEpochPoint: function(epoch_idx, point_idx, field, evt) {
        var epochs = this.state.periods;
        var epoch = epochs[epoch_idx];
        console.log(field, evt.target.value);
        epoch.points[point_idx][field] = evt.target.value;
        epochs[epoch_idx] = epoch;
        this.setState({periods: epochs});
    },
    addEpochPoint: function(epoch_idx) {
        var epochs = this.state.periods;
        var epoch = epochs[epoch_idx];
        if (epoch.points == null) {
            epoch.points = [];
        }
        var pds = this.state.point_descs;
        epoch.points[epoch.points.length] = {name: pds[pds.length-1].name, value: ""}
        epochs[epoch_idx] = epoch;
        this.setState({periods: epochs});
    },
    removeEpochPoint: function(epoch_idx, point_idx) {
        var epochs = this.state.periods;
        var epoch = epochs[epoch_idx];
        epoch.points.splice(point_idx, 1);
        epochs[epoch_idx] = epoch;
        this.setState({periods: epochs});
    },
    submitSchedule: function(e) {
        e.preventDefault();
        var point_descs = {};
        _.each(this.state.point_descs, function(pd) {
            point_descs[pd.name] = {desc: pd.desc, units: pd.units}
        });
        var schedule = {
            name: this.state.name,
            description: this.state.description,
            periods: this.state.periods
        };
        schedule["point descriptions"] = point_descs;
        console.log(schedule);
        $.ajax({
            url: '/schedule/save',
            datatype: 'json',
            type: 'POST',
            data: schedule,
            success: function() {
                console.log("success!");
                this.fetchSchedule();
                location.reload();
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },
    render: function () {
        var self = this;

        // setup the rows for the point descriptions
        var pointDescRows = _.map(this.state.point_descs, function(pd, idx) {
            return (
                <tr key={"row"+idx}>
                    <td><Input onChange={self.editPointDescRow.bind(null, idx, "name")} type="text" size="8" maxLength="50" defaultValue={pd.name} /></td>
                    <td><Input onChange={self.editPointDescRow.bind(null, idx, "units")} type="text" size="4" maxLength="10" defaultValue={pd.units} /></td>
                    <td><Input onChange={self.editPointDescRow.bind(null, idx, "desc")} type="text" defaultValue={pd.desc} /></td>
                    <td><Button onClick={self.removePointDescRow.bind(null, idx)}><Glyphicon glyph="minus" /> Remove</Button></td>
                </tr>
            )
        });

        var pointDescriptionOptions = _.map(this.state.point_descs, function(desc) {
            return (<option key={"option"+desc.name} value={desc.name}>{desc.name}</option>);
        });

        // set up the epochs
        var epochs = _.map(this.state.periods, function(ep, idx) {
            // these are the actuation points for each epoch
            var points = _.map(ep.points, function(p, pidx) {
                return (
                    <tr key={"epoch"+idx+"point"+pidx}>
                        <td><Input type='select' onChange={self.editEpochPoint.bind(null, idx, pidx, "name")} defaultValue={p.name}>{pointDescriptionOptions}</Input></td>
                        <td><Input onChange={self.editEpochPoint.bind(null, idx, pidx, "value")} type="text" size="8" maxLength="50" defaultValue={p.value} /></td>
                        <td><Button onClick={self.removeEpochPoint.bind(null, idx, pidx)}><Glyphicon glyph="minus" /></Button></td>
                    </tr>
                )
            });
            return (
                <ListGroupItem key={"epoch"+idx}>
                    <p>Name: <Input onChange={self.editEpoch.bind(null, idx, "name")} type="text" size="8" maxLength="50" defaultValue={ep.name} /></p>
                    <p>Start: <Input onChange={self.editEpoch.bind(null, idx, "start")} type="text" size="4" maxLength="5" defaultValue={ep.start} /></p>
                    <Table bordered condensed>
                        <thead>
                            <tr>
                                <td>Point Name</td>
                                <td>Value</td>
                                <td></td>
                            </tr>
                        </thead>
                        <tbody>
                            {points}
                            <tr>
                                <td><Button onClick={self.addEpochPoint.bind(null, idx)}><Glyphicon glyph="plus" /></Button></td>
                            </tr>
                        </tbody>
                    </Table>
                    <Button onClick={self.removeEpoch.bind(null, idx)}><Glyphicon glyph="minus" />  Remove</Button>
                </ListGroupItem>
            )
        });

        var headerEdit = (
            <div>
                <Input type="text" onChange={this.editHeader.bind(null, "name")} value={this.state.name} />
                <Input type="text" onChange={this.editHeader.bind(null, "description")} value={this.state.description} />
            </div>
        );

        // now here's the actual layout
        return (
            <div className="scheduleEditor">
                {headerEdit}
                <form onSubmit={this.submitSchedule}>
                    <Table striped bordered condensed>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Units</th>
                                <th>Description</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pointDescRows}
                            <tr>
                                <td colSpan="3"></td>
                                <td><Button onClick={this.addPointDescRow}><Glyphicon glyph="plus" /> Add</Button></td>
                            </tr>
                        </tbody>
                    </Table>
                    <ListGroup>
                        {epochs}
                    </ListGroup>
                    <Button onClick={self.addEpoch}><Glyphicon glyph="plus" />  Add Epoch</Button>
                    <Button type='submit' bsStyle="primary">Submit</Button>
                </form>
            </div>
        )
    }
});

var EpochListView = React.createClass({
    render: function () {
        var epochs = _.map(this.props.epochs, function(epoch) {
            return (<EpochView key={epoch.name} {...epoch} />);
        });
        return (
            <div className="epochListView">
                <ListGroup>
                {epochs}
                </ListGroup>
            </div>
        )
    }
});

var EpochView = React.createClass({
    render: function() {
        var points = _.map(this.props.points, function(point) {
            return (
                <tr key={point.name}>
                    <td>{point.name}</td>
                    <td>{point.value}</td>
                </tr>
            )
        });
        var cx = React.addons.classSet;
        var classes = cx("epochView", "ListGroupItem");
        return (
            <div className={classes}>
                <div className="col-md-4">
                    <p>Name : {this.props.name}</p>
                    <p>Start : {this.props.start}</p>
                </div>
                <div className="col-md-8">
                    <Table bordered condensed>
                        <tbody>
                            {points}
                        </tbody>
                    </Table>
                </div>
            </div>
        )
    }
});

var ScheduleList = React.createClass({
    getInitialState: function() {
        return {names: []}
    },
    newSchedule: function() {
        var names = this.state.names;
        names[names.length] = "[untitled schedule]";
        this.setState({names: names});
        this.props.renderSchedule(names[names.length-1], true);
    },
    deleteSchedule: function(name) {
        this.props.deleteSchedule(name);
        $.ajax({
            url: '/schedule/list',
            datatype: 'json',
            type: 'GET',
            success: function(schedules) {
                this.setState({names: schedules});
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },
    componentDidMount: function() {
        $.ajax({
            url: '/schedule/list',
            datatype: 'json',
            type: 'GET',
            success: function(schedules) {
                this.setState({names: schedules});
            }.bind(this),
            error: function(err) {
                console.error(err);
            }.bind(this)
        });
    },
    render: function() {
        var self = this;
        var names = _.map(this.state.names, function(name) {
            return (
                <ListGroupItem href="#" key={name} >
                    <div className="row">
                        <div className="col-md-4">
                            {name}
                        </div>
                        <div className="col-md-2">
                            <Button bsStyle="info" onClick={self.props.renderSchedule.bind(null, name, false)} >View</Button>
                        </div>
                        <div className="col-md-2">
                            <Button bsStyle="warning" onClick={self.props.renderSchedule.bind(null, name, true)} >Edit</Button>
                        </div>
                        <div className="col-md-2">
                            <Button bsStyle="danger" onClick={self.deleteSchedule.bind(null, name)} >Delete</Button>
                        </div>
                    </div>
                </ListGroupItem>
            )
        });
        return (
            <div className="scheduleList">
                <Panel header="Schedules">
                    <ListGroup>
                        {names}
                        <ListGroupItem>
                            <Button bsStyle="success" onClick={this.newSchedule}><Glyphicon glyph="plus" /> New Schedule</Button>
                        </ListGroupItem>
                    </ListGroup>
                </Panel>
            </div>
        )
    }
});

React.render(
    <ScheduleDashboard />,
    document.getElementById('content')
);
