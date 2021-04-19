'use strict';
const bodyParser = require('body-parser');
const cors = require('cors');
const ObjectID = require("mongodb").ObjectID;

module.exports = function (app) {

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors());
  const TIMEOUT = 10000;

  const createIssue = require('../controllers/databaseController.js').createIssue;
  const getIssues = require('../controllers/databaseController.js').getIssues;
  const updateIssue = require('../controllers/databaseController.js').updateIssue;
  const deleteIssue = require('../controllers/databaseController.js').deleteIssue;


  app.route('/api/issues/:project')
  
    .get(function (req, res){
      const projectName = req.params.project;

      const databaseTimeout = setTimeout(() => {
        next({ message: "timeout" });
      }, TIMEOUT);
      getIssues(projectName, req.query, function (error, data) {
        clearTimeout(databaseTimeout);
        if (error) {
          return next(error)
        } else if (!data) {
          console.log("Missing done() argument");
          return next({ message: "Missing callback argument" });
        } else {
          res.send(data);
        }
      });
    })
    
    .post(function (req, res, next) {
      const projectName = req.params.project;

      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        res.json({error: 'required field(s) missing'});
      } else {
        const assignedTo = req.body.assigned_to || "";
        const statusText = req.body.status_text || "";

        const issueData = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          created_on: new Date(),
          updated_on: new Date(),
          assigned_to: assignedTo,
          status_text: statusText,
          open: true,
          _id: new ObjectID()
        }

        const databaseTimeout = setTimeout(() => {
          next({ message: "timeout" });
        }, TIMEOUT);

        createIssue(projectName, issueData, function (error, data) {
          clearTimeout(databaseTimeout);
          if (error) {
            return next(error);
          } else if (!data) {
            console.log("Missing done() argument");
            return next({ message: "Missing callback argument" });
          } else {
            res.json(data);
          }
        })

      }
    })
    
    .put(function (req, res, next) {
      const projectName = req.params.project;
      
      if (!req.body._id) {
        res.json({error: "missing _id"});
      } else if (Object.keys(req.body).length < 2) {
        res.json({error: "no update field(s) sent", _id: req.body._id});
      } else {
        const databaseTimeout = setTimeout(() => {
          next({ message: "timeout" });
        }, TIMEOUT);

        updateIssue(projectName, req.body._id, req.body, function(error, data, issueFound) {
          clearTimeout(databaseTimeout);
          if (error || !issueFound) {
            res.json({error: 'could not update', _id: req.body._id});
          } else if (!data) {
            console.log("Missing done() argument");
            return next({ message: "Missing callback argument" });
          } else {
            res.json({  result: 'successfully updated', '_id': req.body._id });
          }
        })
      }
      
    })
    
    .delete(function (req, res){
      const projectName = req.params.project;
      
      if (!req.body._id) {
        res.json({error: "missing _id"});
      } else {
        const databaseTimeout = setTimeout(() => {
          next({ message: "timeout" });
        }, TIMEOUT);

        deleteIssue(projectName, req.body._id, function(error, data, issueFound) {
          clearTimeout(databaseTimeout);
          if (error || !issueFound) {
            res.json({error: 'could not delete', _id: req.body._id});
          } else if (!data) {
            console.log("Missing done() argument");
            return next({ message: "Missing callback argument" });
          } else {
            res.json({  result: 'successfully deleted', '_id': req.body._id });
          }
        })
      }
    });
    
};
