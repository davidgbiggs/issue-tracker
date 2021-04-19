const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const deleteAllProjects = require('../controllers/databaseController.js').deleteAllProjects;

suite('Functional Tests', function() {
  test("Create an issue with every field:", function (done) {
    deleteAllProjects(function() {
      const request = {
        'issue_title': 'every field test issue',
        'issue_text': 'every field test issue text',
        'created_by': 'every field test user',
        'assigned_to': 'every field other test user',
        'status_text': 'every field status text',
      };
      chai
        .request(server)
        .post("/api/issues/chai-tests")
        .type('form')
        .send(request)
        .end(function (err, res) {
          const result = JSON.parse(res.text);
          assert.strictEqual(result.issue_title, request.issue_title)
          assert.strictEqual(result.issue_text, request.issue_text)
          assert.strictEqual(result.created_by, request.created_by)
          assert.strictEqual(result.assigned_to, request.assigned_to)
          assert.strictEqual(result.status_text, request.status_text)
          assert.isTrue(result.open);
          assert.isOk(result.created_on);
          assert.isOk(result.updated_on);
          assert.isOk(result._id);
          done();
        });
    });
  });
  test("Create an issue with only required fields:", function (done) {
    const request = {
        'issue_title': 'only required test issue',
        'issue_text': 'only required test issue text',
        'created_by': 'only required test user',
      };
    chai
      .request(server)
      .post("/api/issues/chai-tests")
      .type('form')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.strictEqual(result.issue_title, request.issue_title);
        assert.strictEqual(result.issue_text, request.issue_text);
        assert.strictEqual(result.created_by, request.created_by);
        assert.isNotOk(result.assigned_to);
        assert.isNotOk(result.status_text);
        assert.isTrue(result.open);
        assert.isOk(result.created_on);
        assert.isOk(result.updated_on);
        assert.isOk(result._id);
        done();
      });
  });
  test("Create an issue with missing required fields:", function (done) {
    const request = {
        'issue_text': 'test issue text',
        'created_by': 'test user',
        'assigned_to': 'other test user',
        'status_text': 'some status text',
    };
    chai
      .request(server)
      .post("/api/issues/chai-tests")
      .type('form')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.deepEqual(result, { error: 'required field(s) missing' })
        done();
      });
  });
  test("View issues on a project:", function (done) {
    chai
      .request(server)
      .get("/api/issues/chai-tests")
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.isArray(result);
        assert.hasAllKeys(result[0], ['_id', 'issue_text', 'issue_title', 'created_on', 'updated_on', 'created_by', 'assigned_to', 'open', 'status_text']);
        done();
      });
  });
  test("View issues on a project with one filter:", function (done) {
    const request = {
        'issue_title': 'every field test issue',
        'issue_text': 'every field test issue text',
        'created_by': 'every field test user',
        'assigned_to': 'every field other test user',
        'status_text': 'every field status text',
    };
    const request2 = {
        'issue_title': 'only required test issue',
        'issue_text': 'only required test issue text',
        'created_by': 'only required test user',
      };
    const requestString = `/api/issues/chai-tests?issue_title=${encodeURI(request.issue_title)}`;
    chai
      .request(server)
      .get(requestString)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].issue_title, request.issue_title);
        assert.notEqual(result[0]._id, request2._id);
        done();
      });
  });
  test("View issues on a project with multiple filters:", function (done) {
    const request = {
        'issue_title': 'every field test issue',
        'issue_text': 'every field test issue text',
        'created_by': 'every field test user',
        'assigned_to': 'every field other test user',
        'status_text': 'every field status text',
    };
    const request2 = {
        'issue_title': 'only required test issue',
        'issue_text': 'only required test issue text',
        'created_by': 'only required test user',
      };
    const requestString = `/api/issues/chai-tests?issue_title=${encodeURI(request.issue_title)}&assigned_to=${encodeURI(request.assigned_to)}`;
    chai
      .request(server)
      .get(requestString)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].issue_title, request.issue_title);
        assert.strictEqual(result[0].assigned_to, request.assigned_to);
        assert.notEqual(result[0]._id, request2._id);
        done();
      });
  });
  test("Update one field on an issue:", function (done) {
    // callback hell! seems unavoidable
    // get an issue, update that issue, then check if the updates persisted
    chai
      .request(server)
      .get("/api/issues/chai-tests")
      .end(function (error, res) {
        const result = JSON.parse(res.text)[0];
        const targetObject = result;
        delete targetObject.updated_on;
        const targetId = result._id;
        const update = {
          _id: targetId,
          issue_title: 'updated issue title',
        }

        chai
          .request(server)
          .put("/api/issues/chai-tests")
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(update)
          .end(function (error, res) {

            chai
              .request(server)
              .get(`/api/issues/chai-tests?_id=${targetId}`)
              .end(function (error, res) {
                const result = JSON.parse(res.text)[0];
                delete result.updated_on;
                assert.deepEqual(result, {...targetObject, issue_title: update.issue_title});
                done();
              })
          })
      })
  });
  test("Update multiple fields on an issue:", function (done) {
    // callback hell! seems unavoidable
    // get an issue, update that issue, then check if the updates persisted
    chai
      .request(server)
      .get("/api/issues/chai-tests")
      .end(function (error, res) {
        const result = JSON.parse(res.text)[0];
        const targetObject = result;
        delete targetObject.updated_on;
        const targetId = result._id;
        const update = {
          _id: targetId,
          issue_title: 'updated issue title',
          issue_text: 'updated issue text'
        }

        chai
          .request(server)
          .put("/api/issues/chai-tests")
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(update)
          .end(function (error, res) {

            chai
              .request(server)
              .get(`/api/issues/chai-tests?_id=${targetId}`)
              .end(function (error, res) {
                const result = JSON.parse(res.text)[0];
                delete result.updated_on;
                assert.deepEqual(result, {...targetObject, issue_title: update.issue_title, issue_text: update.issue_text});
                done();
              });
          });
      });
  });
  test("Update an issue with missing _id:", function (done) {
    const request = {
        'issue_title': 'test issue',
      };
    chai
      .request(server)
      .put("/api/issues/chai-tests")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.deepEqual(result, {error: 'missing _id'});
        done();
      });
  });
  test("Update an issue with no fields to update:", function (done) {
    chai
      .request(server)
      .get("/api/issues/chai-tests")
      .end(function (error, res) {
        const result = JSON.parse(res.text)[0];
        const targetId = result._id;
        const update = {
          _id: targetId
        }

        chai
          .request(server)
          .put("/api/issues/chai-tests")
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(update)
          .end(function (error, res) {
            const result = JSON.parse(res.text);
            assert.deepEqual(result, {error: 'no update field(s) sent', '_id': update._id });
            done();
          })
      });
  });
  test("Update an issue with an invalid _id:", function (done) {
    const request = {
        'issue_title': 'test issue',
        '_id': 'invalid id',
      };
    chai
      .request(server)
      .put("/api/issues/chai-tests")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.deepEqual(result, { error: 'could not update', '_id': 'invalid id' })
        done();
      });
  });
  test("Delete an issue:", function (done) {
    chai
      .request(server)
      .get("/api/issues/chai-tests")
      .end(function (error, res) {
        const result = JSON.parse(res.text)[0];
        const targetObject = result;
        delete targetObject.updated_on;
        const targetId = result._id;
        const request = {
          _id: targetId
        }

        chai
          .request(server)
          .delete("/api/issues/chai-tests")
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(request)
          .end(function (error, res) {
            const deleteResult = JSON.parse(res.text);
            assert.deepEqual(deleteResult, { result: 'successfully deleted', '_id': request._id })

            chai
              .request(server)
              .get(`/api/issues/chai-tests?_id=${targetId}`)
              .end(function (error, res) {
                const result = JSON.parse(res.text);
                assert.isArray(result);
                assert.isEmpty(result);
                done();
              })
          })
      })
  });
  test("Delete an issue with an invalid _id:", function (done) {
    const request = {
        '_id': 'invalid id',
      };
    chai
      .request(server)
      .delete("/api/issues/chai-tests")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.deepEqual(result, { error: 'could not delete', '_id': 'invalid id' })
        done();
      });
  });
  test("Delete an issue with missing _id:", function (done) {
    const request = {
        'issue_title': 'test issue',
      };
    chai
      .request(server)
      .delete("/api/issues/chai-tests")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(request)
      .end(function (err, res) {
        const result = JSON.parse(res.text);
        assert.deepEqual(result, {error: 'missing _id'});
        done();
      });
  });
});
