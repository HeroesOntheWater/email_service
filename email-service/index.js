const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
//const dotenv = require('dotenv').config();
var bodyParser = require('body-parser');
var auth = require('basic-auth');
var userList = process.env.userlist.split(';');



//Get document, or throw exception on error
class EmailServiceClient {

    static emailService() {
        try {

          // This is for testing server locally.
          app.use(cors());

          // parse application/x-www-form-urlencoded
          app.use(bodyParser.urlencoded({ extended: false }));

          // parse application/json
          app.use(bodyParser.json());

          // verify tokens
          app.use((req, res, next) => {
            if (req.path.includes('token')){
              next();
              return;
            }
            if (!req.body.token) {res.status(404).send('This page does not exist. Down for maintenance'); return;}
            jwt.verify(req.body.token, process.env.secret, function(err, decoded) {

              // Check if token passed.
              if (err) {
                return res.status(404).send('This page does not exist. Down for maintenance');
              }

              // Check to see if req has Authorization data.
              if (!_.isUndefined(auth(req))) { 

                // Get credentials from Auth Header.
                let creds = auth(req);

                // Check if credentials match what we have on file.
                if (_.includes(userList, creds.name) && creds.pass === process.env.password) {
                  next();
                } else {
                  return res.status(404).send('This page does not exist. Down for maintenance');
                }

              } else {
                return res.status(404).send('This page does not exist. Down for maintenance');
              }

            });
          });

          // Handle request for token.
          app.get('/token', (req, res, next) => {
            res.json({
              'token': jwt.sign({
                exp: Math.floor(Date.now() / 1000) + 30,
                data: 'test'
              }, process.env.secret)
            });
          });

          // Handle request made for sending emails.
          app.post('/sendemail', (req, res, next) => {

            // Build form data for mailfun to read.
            var formData = {
              from: req.body.from,
              to: req.body.to,
              subject: req.body.subject,
              text: req.body.text
            };

            // Build request object.
            var request = require('request');
            const key = process.env.key;
            const url = process.env.url + process.env.domain + '/messages'
            const auth = 'Basic ' + new Buffer('api:' + key).toString('base64');

            // Make request to mailgun API.
            request({
              url : url,
              method: 'POST',
              headers : {
                  'Authorization' : auth
              },
              formData: formData
            },
            function (error, response, body) {
              // Do more stuff with 'body' here
              if (error) {
                res.status(400).json({
                  message: ('upload failed:' + JSON.stringify(error))
                });
              }
              res.json({
                status: 'Success',
                message: body
              })
            });
          });
          
          // Set listener port for current server.
          app.listen(process.env.PORT || 8080);

        } catch (e) {
          console.log(e);
        }
    }

}

EmailServiceClient.emailService();
