let express = require('express');
let app = express();
let mongoose = require('mongoose');
let multer = require('multer');
let cookieParser = require('cookie-parser');
let postsRouter = require('./routes/posts');
let callbackRequestsRouter = require('./routes/callback-requests');
let emailsRouter = require('./routes/emails');
let usersRouter = require('./routes/users');
let Post = require('./models/posts').Post;
let auth = require('./controllers/auth');
const path = require('path');
const https = require('https');
const qs = require('querystring');
const ejs = require('ejs');
const checksum_lib = require('./Paytm/checksum');
const config = require('./Paytm/config');
const { response } = require('express');
const parseUrl = express.urlencoded({ extended: false })
const parseJson = express.json({ extended: false })
const api = require('novelcovid');

app.set('view engine', 'ejs');

//console.log(uniqid());

mongoose.connect('mongodb://localhost/travels', {useUnifiedTopology: true , useNewUrlParser: true});
app.use(express.static('./public'))
app.use(express.json());

let imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images'),
    filename: (req, file, cb) => cb(null, file.originalname)
})
//app.use(multer({dest: 'public/images'}).single('imageFile'));
app.use(multer({storage: imageStorage}).single('imageFile'));
app.use(express.static('public'));
app.use(cookieParser()); //so that cookies are automatically generated for every request.

app.use('/posts', postsRouter);
app.use('/callback-requests', callbackRequestsRouter);
/*That means that when the request is made on the route path which starts with /callback-requests,
then it will be redirected callback-requests.js*/
app.use('/emails', emailsRouter);
app.use('/users', usersRouter);


app.get('/sight', async (req, res) =>{
    let id = req.query.id;
    let post = await Post.findOne({id:id});
    res.render('sight', {
        title: post.title,
        imageUrl: post.imageUrl,
        date: post.date,
        text: post.text
    })
})


app.get('/admin', (req,res) =>{
    /*to read the cookie */
    let token = req.cookies['auth_token'];
    if(token && auth.checkToken(token)){ //token should not be empty!
        res.render('admin');
    }else{
        res.redirect('/login'); //redirecting sign-in page!
    }
})

app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/tourpackage', (req, res) => {
  res.render('tourpackage');
})
app.get('/profile', (req, res) => {
  res.render('profile');
})
app.get('/food', (req, res) => {
  res.render('food');
})
app.get('/tours', (req, res) => {
  res.render('tours');
})

app.get('/covid', async (req, res) => {
  const global = await api.all();
  const countries = await api.countries({ sort: 'cases' });
  res.render('covid', { global, countries });
});
//
app.get('/offersforyou', (req, res) => {
  res.render('offersforyou');
})
app.get('/newsfeed', (req, res) => {
  res.render('newsfeed');
})
app.get('/musicplayer', (req, res) => {
  res.render('musicplayer');
})

app.get('/subscription', (req, res) => {
    res.render('subscription');
})

app.get('/pg', (req, res) => {
  const amt = req.query.amount
  res.render('pg', {amount : amt});
})
app.get('/aboutus', (req, res) => {
  res.render('aboutus');
})

app.post('/paynow',[parseUrl, parseJson], (req, res) => {
    if (!req.body.amount || !req.body.email || !req.body.phone) {
      res.status(400).send('Payment failed')
    } else {
      var params = {};
      params['MID'] = config.PaytmConfig.mid;
      params['WEBSITE'] = config.PaytmConfig.website;
      params['CHANNEL_ID'] = 'WEB';
      params['INDUSTRY_TYPE_ID'] = 'Retail';
      params['ORDER_ID'] = 'TEST_' + new Date().getTime();
      params['CUST_ID'] = 'customer_001';
      params['TXN_AMOUNT'] = req.body.amount.toString();
      params['CALLBACK_URL'] = 'http://localhost:3000/callback';
      params['EMAIL'] = req.body.email;
      params['MOBILE_NO'] = req.body.phone.toString();
  
  
      checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
  
        var form_fields = "";
        for (var x in params) {
          form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
      });
    }
  })
  
app.post('/callback', (req, res) => {
    var body = '';
  
    req.on('data', function (data) {
      body += data;
    });
      req.on('end', function () {
      var html = "";
      var post_data = qs.parse(body);
  
      // received params in callback
      console.log('Callback Response: ', post_data, "\n");
  
  
      // verify the checksum
      var checksumhash = post_data.CHECKSUMHASH;
      // delete post_data.CHECKSUMHASH;
      var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
      console.log("Checksum Result => ", result, "\n");
  
  
      // Send Server-to-Server request to verify Order Status
      var params = { "MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID };
  
      checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
        params.CHECKSUMHASH = checksum;
        post_data = 'JsonData=' + JSON.stringify(params);
  
        var options = {
          hostname: 'securegw-stage.paytm.in', // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: '/merchant-status/getTxnStatus',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
          }
        };
  
  
        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
            response += chunk;
          });
  
          post_res.on('end', function () {
            console.log('S2S Response: ', response, "\n");
  
            var _result = JSON.parse(response);
            res.render('response', {
              'data': _result
            })
          });
        });
  
        // post the data
        post_req.write(post_data);
        post_req.end();
      });
    });
  })

app.listen(27017, () => console.log('Listening 3000...'));
