const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/test1",{ useNewUrlParser: true , useUnifiedTopology: true });
var db = mongoose.connection;

db.once('open',function(){
  console.log("Connection Successful");
});

db.on('error', console.error.bind(console, 'connection error:'));

var schema = new mongoose.Schema({  usermessage: [{text: String}],
                                                       sessionId: String});
var PersonModel = mongoose.model('Person', schema);

var newschema = new mongoose.Schema({ name : String, email: String, domain:String
});
var ContactModel = mongoose.model('Contact', newschema);


const app = express();
const sessionId = uuid.v4();


app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.set("view engine", "ejs");
app.use(express.static("public", { maxAge: 2592000000 }));
var id= ""
app.post("/send-msg", (req, res) => {
  runSample(req.body.MSG).then((data) => {
    
      const p= new PersonModel({
        sessionId: sessionId,
        usermessage: [
         { text: req.body.MSG}
        ]
      });
       console.log(sessionId)
       //console.log(req.body.MSG)
       PersonModel.findByIdAndUpdate({_id: id }, {$push: {usermessage: {text: req.body.MSG}}}, {safe: true, upsert: true}, (err, r) => {
        if(!r)
        {
          p.save((p_err, p_res) => {
            if(p_err)
            console.log(p_err)
            else{
              id=p_res._id;
              console.log(p_res);
            }
            
          })
        }
        else{
          console.log(r)
        }
      })
    res.send({ Reply: data });
  });

    //if (res.send= 'Can you tell me your email please') {
      //var save= res.send({})
    //}

});

app.get("/", function (req, res) {
  res.render("index");
});

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function runSample(msg, projectId = "apiexample-xbgk") {
  // A unique identifier for the given session

  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: "apiexample-xbgk-bc2f2d1daef0.json",
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

 

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: msg,
        // The language used by the client (en-US)
        languageCode: "en-US",
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log("Detected intent");
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }
  return result.fulfillmentText;
}

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

app.listen(port, () => {
  console.log("Running on port: " + port);
});