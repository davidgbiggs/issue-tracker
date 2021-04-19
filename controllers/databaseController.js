require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const issueSchema = new mongoose.Schema({
  _id: String,
  issue_title: String,
  issue_text: String,
  created_on: Date,
  updated_on: Date,
  created_by: String,
  assigned_to: String,
  open: Boolean,
  status_text: String
});

const projectSchema = new mongoose.Schema({
  name: String,
  issues: [issueSchema]
});

const Project = mongoose.model("Project", projectSchema);
const Issue = mongoose.model("Issue", issueSchema);

const createIssue = function (projectName, issueData, done) {
  Project.findOne({name: projectName}, function (error, project) {
    if (error) {
      return done(error);
    } else {
      const newIssue = new Issue(issueData);
      if (!project) {
        project = new Project({name: projectName, issues: [newIssue]});
      } else {
        project.issues.push(newIssue);
      }

      return project.save((error, data) => {
        if (error) {
          return done(error);
        } else {
          return done(null, data.issues.slice(-1)[0]);
        }
      })
    }
  })
};

const getIssues = function(projectName, filters, done) {
  Project.findOne({name: projectName}, function (error, project) {
    let issues = project ? project.issues : []
    if (project) {
      issues = issues.filter(issue => {
        let isMatch = true;
        Object.keys(filters).forEach(key => {
          isMatch = issue[key] === filters[key]
        })
        return isMatch;
      })
    }
    if (error) {
      return done(error);
    } else {
      return done(null, issues);
    }
  });
}

const updateIssue = function(projectName, _id, fieldsToUpdate, done) {
  Project.findOne({name: projectName}, function (error, project) {
    if (error) {
      return done(error);
    } else {
      let issueFound = false;
      project.issues.forEach((element, i) => {
        if (element._id === _id) {
          issueFound = true;
          const newIssueObj = element;
          element.updated_on = new Date();
          Object.keys(fieldsToUpdate).forEach(key => {
            newIssueObj[key] = fieldsToUpdate[key]
          })
          const newIssue = new Issue(newIssueObj);
          project.issues[i] = newIssue;
        }
      })
      return project.save((error, newProject) => {
        if (error) {
          return done(error);
        } else {
          return done(null, newProject, issueFound);
        }
      })
    }
  });
}

const deleteIssue = function(projectName, _id, done) {
  Project.findOne({name: projectName}, function (error, project) {
    if (error) {
      return done(error);
    } else {
      let issueFound = false;
      project.issues = project.issues.filter(element => {
        if (element._id === _id) {
          issueFound = true;
          return false;
        } else return true;
      })
      return project.save((error, newProject) => {
        if (error) {
          return done(error);
        } else {
          return done(null, newProject, issueFound);
        }
      })
    }
  });
}

const deleteAllProjects = function(done) {
  Project.deleteMany({}, function (error) {
    if (error) {
      return done(error);
    } else {
      return done(null);
    }
  });
}

exports.ProjectModel = Project;
exports.IssueModel = Issue;

exports.deleteAllProjects = deleteAllProjects;
exports.deleteIssue = deleteIssue;
exports.createIssue = createIssue;
exports.getIssues = getIssues;
exports.updateIssue = updateIssue;