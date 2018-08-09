const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
var bodyParser = require('body-parser');
const PORT = process.env.port || 8080;



//Get document, or throw exception on error
class EmailServiceClient {

    static emailService() {
        try {

          app.use(cors());

          // parse application/x-www-form-urlencoded
          app.use(bodyParser.urlencoded({ extended: false }))

          // parse application/json
          app.use(bodyParser.json())

          // verify tokens
          app.use((req, res, next)=>{
            if(req.path.includes('token')){
              next();
              return;
            }
            if(!req.body.token){res.status(404).send('This page does not exist. Down for maintenance'); return;}
            jwt.verify(req.body.token, process.env.secret, function(err, decoded) {
              if(err) {
                return res.status(404).send('This page does not exist. Down for maintenance');
              }
              next();
            });
          })

          app.get('/token', (req, res, next)=>{
            res.json({
              'token': jwt.sign(req.query.token, process.env.secret)
            });
          })

          app.post('/sendemail', (req, res, next)=>{

            var formData = {
              from: req.body.from,
              to: req.body.to,
              subject: req.body.subject,
              text: req.body.text
            };

            var request = require('request');
            const key = process.env.key;
            const url = process.env.url + process.env.domain + '/messages'
            const auth = 'Basic ' + new Buffer( 'api:' + key).toString('base64');

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
          
          app.listen(PORT, function() {
              console.log(`listening on ${PORT}`);
          });

        } catch (e) {
          console.log(e);
        }
    }

}

EmailServiceClient.emailService();
