const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;



//Get document, or throw exception on error
class EmailServiceClient {

    static emailService() {
        try {

          app.use(cors());

          // parse application/x-www-form-urlencoded
          app.use(bodyParser.urlencoded({ extended: false }))

          // parse application/json
          app.use(bodyParser.json())

          //verify tokens
          app.use((req, res, next)=>{
            if(req.path.includes('token')){
              next();
              return;
            }
            if(!req.query.token){res.status(404).send('This page does not exist. Down for maintenance'); return;}
              jwt.verify(req.query.token, process.env.key, function(err, decoded) {
              if(err) {
                return res.status(404).send('This page does not exist. Down for maintenance');
              }
              next();
            });
          })

          app.get('/token', (req, res, next)=>{
            res.json({
              "token": jwt.sign(process.env.payload, process.env.key)
            });
          })

          app.post('/sendemail', (req, res, next)=>{

            var formData = {
              // Pass a simple key-value pair
              from: req.body.from,
              // Pass data via Buffers
              to: req.body.to,
              subject: req.body.subject,
              text: req.body.text
            };

            var request = require('request')
            const username = process.env.username;
            const password = process.env.password;
            const url = "https://api.mailgun.net/v3/sandbox933c2e80fc374d9998083f771a420c84.mailgun.org/messages";
            const auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

            request({
              url : url,
              method: 'POST',
              headers : {
                  "Authorization" : auth
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
                message: "Email successfully sent!"
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
