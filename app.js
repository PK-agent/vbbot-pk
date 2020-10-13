const fetch = require('node-fetch');
const firebase = require("firebase-admin");
const express = require('express');
const ejs = require("ejs");
const body_parser = require('body-parser');
const { uuid } = require('uuidv4');
const {format} = require('util');
const multer  = require('multer');

const ViberBot  = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const UrlMessage = require('viber-bot').Message.Url;
const TextMessage = require('viber-bot').Message.Text;
const RichMediaMessage = require('viber-bot').Message.RichMedia;
const KeyboardMessage = require('viber-bot').Message.Keyboard;
const PictureMessage = require('viber-bot').Message.Picture;

const APP_URL = process.env.APP_URL;


  //firebase initialize
  firebase.initializeApp({
    credential: firebase.credential.cert({
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "project_id": process.env.FIREBASE_PROJECT_ID,
    }),
    databaseURL:process.env.FIREBASE_DB_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
  let db = firebase.firestore(); 
  
const app = express(); 


let currentUser = {};


// Creating the bot with access token, name and avatar
const bot = new ViberBot({
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: "Viber Bot",  // <--- Your bot name here
    avatar: "https://pp.netclipart.com/pp/s/293-2935777_corn-animation-png.png" // It is recommended to be 720x720, and no more than 100kb.
});

app.use("/viber/webhook", bot.middleware());

app.use(body_parser.json());
app.use(body_parser.urlencoded());

app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');



app.get('/',function(req,res){    
    res.send('your app is up and running');
});

app.get('/test',function(req,res){    
     res.render('test.ejs');
});


app.get('/register',function(req,res){   
      let data = {
        user_name: currentUser.name,
      } 
     res.render('register.ejs', {data:data});
});

app.get('/addorder',function(req,res){   
    
   res.render('addorder.ejs');
});


app.post('/register',function(req,res){   
    
    console.log('Data from form:', req.body);

    currentUser.id=generatePushID();
    currentUser.name = req.body.name;
    currentUser.phone = req.body.phone;
    currentUser.address = req.body.address;

    let data = {
        viberid: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address
    }
  
    db.collection('users').doc(currentUser.id).set(data)
    .then(()=>{
            let data = {
                   "receiver":currentUser.id,
                   "min_api_version":1,
                   "sender":{
                      "name":"Pyaung Kyi",
                      "avatar":"https://pp.netclipart.com/pp/s/293-2935777_corn-animation-png.png"
                   },
                   "tracking_data":"tracking data",
                   "type":"text",
                   "text": "Thank you!"+req.body.name
                }                

                fetch('https://chatapi.viber.com/pa/send_message', {
                    method: 'post',
                    body:    JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': process.env.AUTH_TOKEN },
                })
                .then(res => res.json())
                .then(json => console.log('JSON', json))

    }).catch((error)=>{
        console.log('ERROR:', error);
    });
       
});

app.post('admin/addorder',function(req,res){   
    
    console.log('Data from form:', req.body);

    orderUser.id=generatePushID();
    orderUser.name = req.body.name;
    orderUser.phone = req.body.phone;
    orderUser.address = req.body.address;
    orderUser.order_qty = req.body.order_qty;
    orderUser.order_received_date = req.body.order_received_date;

    let orderUser = {
        orderid: orderUser.id,
        name: orderUser.name,
        phone: orderUser.phone,
        address: orderUser.address,
        order_qty: orderUser.order_qty,
        order_received_date: orderUser.order_received_date
    }
  
    admin
.firestore()
.collection('orders')
.add(orderUser)
       
});

app.get('/admin/merchants', async (req,res) => {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }  
    let data = [];
    snapshot.forEach(doc => {

        let user = {};
        user.id = doc.id;
        user.name = doc.data().name;
        user.phone = doc.data().phone;         
        user.address = doc.data().address;        
        data.push(user);        
    });   
 
    res.render('merchants.ejs', {data:data}); 
    
});

// customer order

app.get('/admin/orderlist', async (req,res) => {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }  
    let data = [];
    snapshot.forEach(doc => {

        let user = {};
        user.id = doc.id;
        user.name = doc.data().name;
        user.phone = doc.data().phone;         
        user.address = doc.data().address;
        user.quantity = doc.data().quantity;
        user.verified_date = doc.data().verified_date;
        data.push(user);        
    });   
 
    res.render('orderlist.ejs', {data:data}); 
    
});


app.get('/admin/addstock/:merchant_id', async (req,res) => {  
    let data = { };        

    let userRef = db.collection('users').doc(req.params.merchant_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {      
      data.merchant_id = user.data().viberid; 
      data.merchant_name = user.data().name;
    }
    res.render('addstock.ejs', {data:data}); 
    
});

//customer add order form

app.get('/admin/addorder/:orderlist_id', async (req,res) => {  
    let data = { };        

    let userRef = db.collection('users').doc(req.params.orderlist_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {      
      data.orderlist_id = user.data().viberid; 
      data.orderlist_name = user.data().name;
    }
    res.render('addorder.ejs', {data:data}); 
    
});



app.post('/admin/addorder', async (req,res) => {  
   
    let today = new Date();
    let merchant_id = req.body.merchant_id;

    let data = {
        batch: req.body.item_batch,
        type:req.body.item_type,
        qty:parseInt(req.body.item_qty),
        price:parseInt(req.body.item_price),
        received_date:req.body.item_received_date,
        comment:req.body.comment,    
        created_on:today   
    }
   

    db.collection('users').doc(merchant_id).collection('stocks').add(data)
    .then(()=>{
          res.json({success:'success'});  

    }).catch((error)=>{
        console.log('ERROR:', error);
    }); 
    
});

//admin addorder

app.post('/addorder', async (req,res) => {  
   
    let today = new Date();
    let orderlist_id = req.body.orderlist_id;

    let data = {
        batch: req.body.item_batch,
        type:req.body.item_type,
        qty:parseInt(req.body.item_qty),
        price:parseInt(req.body.item_price),
        received_date:req.body.item_received_date,
        comment:req.body.comment,    
        created_on:today   
    }
   

    db.collection('users').doc(merchant_id).collection('stocks').add(data)
    .then(()=>{
          res.json({success:'success'});  

    }).catch((error)=>{
        console.log('ERROR:', error);
    }); 
    
});


app.get('/admin/stocklist/:merchant_id', async (req,res) => { 
    

    const stocksRef = db.collection('users').doc(req.params.merchant_id).collection('stocks').where("qty", ">", 0);
    const snapshot = await stocksRef.get();
    if (snapshot.empty) {
      console.log('No stocks.');
      res.send('No stocks');
    }  

    let data = [];

    snapshot.forEach(doc => {
        let batch = {};

        batch.id = doc.id;
        batch.batch = doc.data().batch;
        batch.type = doc.data().type;
        batch.qty = doc.data().qty;
        batch.price = doc.data().price;
        batch.received_date = doc.data().received_date;
        batch.comment = doc.data().comment;      
        
        data.push(batch);        
    });   


    let merchant = { };        

    let userRef = db.collection('users').doc(req.params.merchant_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {    
      merchant.merchant_id = user.data().viberid;      
      merchant.merchant_name = user.data().name;
    }
 
    res.render('stocklist.ejs', {data:data, merchant:merchant});    
    
});



app.post('/admin/stocklist', async (req,res) => {     
    
    let today = new Date();
    let merchant_id = req.body.merchant_id; 

    let data = {
        date: req.body.date,
        batch_id: req.body.batch_id,
        type: req.body.type,
        qty: parseInt(req.body.qty),
        amount:parseInt(req.body.qty)*parseInt(req.body.price),
        created_on:today   
    }   

    let instock = parseInt(req.body.instock) -  parseInt(req.body.qty);
   
    
    db.collection('users').doc(merchant_id).collection('sales').add(data)
    .then(()=>{
          
          db.collection('users').doc(merchant_id).collection('stocks')
          .doc(req.body.batch_id).update({qty:instock})
              .then(()=>{
                  res.redirect('/admin/stocklist/'+merchant_id);
              }).catch((err)=>console.log('ERROR:', err));   

    }).catch((error)=>{
        console.log('ERROR:', error);
    }); 
    
});


app.get('/admin/salesrecord/:merchant_id', async (req,res) => { 
    

    const salesRef = db.collection('users').doc(req.params.merchant_id).collection('sales').orderBy('date', 'desc');
    const snapshot = await salesRef.get();
    if (snapshot.empty) {
      res.send('No sales record');
    }  

    let data = [];

    snapshot.forEach(doc => {
        let sale = {};

        sale.id = doc.id;
        sale.date = doc.data().date;
        sale.batch_id = doc.data().batch_id;
        sale.type = doc.data().type;
        sale.qty = doc.data().qty;
        sale.amount = doc.data().amount;
        
        data.push(sale);        
    });   


    let merchant = { };        

    let userRef = db.collection('users').doc(req.params.merchant_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {    
      merchant.merchant_id = user.data().viberid;      
      merchant.merchant_name = user.data().name;
    }
 
    res.render('salesrecord.ejs', {data:data, merchant:merchant});    
    
});


app.get('/admin/payment/:merchant_id', async (req,res) => {  

    let total_sale = 0;
    let total_paid = 0;
    let payment_logs = [];

    const salesRef = db.collection('users').doc(req.params.merchant_id).collection('sales');
    const snapshot = await salesRef.get();
    if (snapshot.empty) {
      total_sale = 0;
      res.send('No sales.');      
    } else{    
        snapshot.forEach(doc => {   
        total_sale += doc.data().amount;                   
    });
    } 

       

    const paymentsRef = db.collection('users').doc(req.params.merchant_id).collection('payments').orderBy('date', 'desc');
    const snapshot2 = await paymentsRef.get();
    if (snapshot2.empty) {
      total_paid = 0;
      console.log('No payments.');      
    } else{
        snapshot2.forEach(doc => {        
            total_paid += doc.data().amount;  

            let payment = {};
            payment.date = doc.data().date; 
            payment.amount = doc.data().amount; 
            payment_logs.push(payment);             
        }); 
    }

    

    let merchant = { };        

    let userRef = db.collection('users').doc(req.params.merchant_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {    
      merchant.merchant_id = user.data().viberid;      
      merchant.merchant_name = user.data().name;
    }

    merchant.total_sale = total_sale;
    merchant.total_paid = total_paid;
    merchant.payment_logs = payment_logs;
    merchant.total_balance = total_sale - total_paid;
 
 

    res.render('paymentrecord.ejs', {merchant:merchant}); 
    
});


app.post('/admin/savepayment', async (req,res) => {     
    
    let today = new Date();
    let merchant_id = req.body.merchant_id; 

    let data = {
        amount: parseInt(req.body.amount),
        date: req.body.date,        
       
        created_on:today   
    }       
   
    
    db.collection('users').doc(merchant_id).collection('payments').add(data)
    .then(()=>{  
        res.redirect('/admin/payment/'+merchant_id);   

    }).catch((error)=>{
        console.log('ERROR:', error);
    }); 
    
});






app.listen(process.env.PORT || 8080, () => {
    console.log(`webhook is listening`);
    bot.setWebhook(`${process.env.APP_URL}/viber/webhook`).catch(error => {
        console.log('Can not set webhook on following server. Is it running?');
        console.error(error);
        process.exit(1);
    });
});
 


bot.onError(err => console.log('ON ERR: ',err));


bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});

let KEYBOARD_JSON = {
        "Type": "keyboard",
        "DefaultHeight": true,
        "Buttons": [{
            "Columns": 6,
            "Rows": 1,
            "ActionType": "reply", // type of action
            "ActionBody": "register", // the value of the keyboard
            "Text": "Register", //this is text in keyboard
            "TextSize": "regular"
        }]
    };

    const message = new TextMessage("Welcome to my tea shop",KEYBOARD_JSON,null,null,null,3);

bot.onConversationStarted((userProfile, isSubscribed, context) =>     
    bot.sendMessage(userProfile,message)
);


bot.onTextMessage(/./, (message, response) => {
    const text = message.text.toLowerCase();

    console.log('MESSAGE:', message);
    //console.log('USER', response.userProfile);

    currentUser.id = response.userProfile.id;
    currentUser.name = response.userProfile.name;

    console.log('CURRENT USER', currentUser);
    
    switch(text){
        case "register":
            registerUser(message, response);
            break;        
        case "add-order":
            addOrder(message, response);
             break;
        case "my-stock":
            checkStock(message, response);
            break;
        case "my-balance":
            checkBalance(message, response);
            break;
        case "menu":
            showMenu(message, response);
            break;
        case "text":
            textReply(message, response);
            break; 
        case "url":
            urlReply(message, response);
            break;
        case "picture":
            pictureReply(message, response);
            break;
        case "rich media":
            richMediaReply(message, response);
            break;  
        case "keyboard":
            keyboardReply(message, response);
            break;           
        case "who am i":
            whoAmI(message, response);
            break;     
        default:
            defaultReply(message, response);
            
                
            
    }
});


/*
bot.onTextMessage(/view/, (message, response) => {
   viewTasks(message, response);  
});
*/
const whoAmI = (message, response) => {
    response.send(new TextMessage(`Hello ${response.userProfile.name}! It's so nice to meet you`));
}

const textReply = (message, response) => {
    let bot_message = new TextMessage(`You have sent message: ${message.text}`);    
    response.send(bot_message);
}

const pictureReply = (message, response) => {
    const bot_message = new PictureMessage('https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg');

    response.send(bot_message).catch(error=>{
        console.error('ERROR', error);
        process.exit(1);
    });
}

const urlReply = (message, response) => {    

    let bot_message = new UrlMessage(process.env.APP_URL + '/test/');   
    response.send(bot_message);
}

const addOrder = (message, response) => {    

    let bot_message = new UrlMessage(process.env.APP_URL + '/admin/addorder');   
    response.send(bot_message);
}

const richMediaReply = (message, response) => {
    const SAMPLE_RICH_MEDIA = {
    "ButtonsGroupColumns": 6,
    "ButtonsGroupRows": 7,
    "BgColor": "#FFFFFF",
    "Buttons": [
        {
        "Columns":6,
        "Rows":5,
        "ActionType":"none",           
        "Image":"https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg"
        }, 
        {
        "Columns":6,
                "Rows":1,
                "Text": "sample text",
                "ActionType":"none",
                "TextSize":"medium",
                "TextVAlign":"middle",
                "TextHAlign":"left"
        },
        {
            "Columns":6,
            "Rows":1,
            "ActionType":"reply",
            "ActionBody": "click",
            "Text":"Click",
            "TextSize":"large",
            "TextVAlign":"middle",
            "TextHAlign":"middle",
        }
    ]
    };

    let bot_message = new RichMediaMessage(SAMPLE_RICH_MEDIA);
    
    response.send(bot_message).catch(error=>{
        console.error('ERROR', error);
        process.exit(1);
    });

}

//https://developers.viber.com/docs/tools/keyboard-examples/

const keyboardReply = (message, response) => {
    let SAMPLE_KEYBOARD = {
        "Type": "keyboard",
        "Revision": 2,
        "Buttons": [
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "today_stock",                
                "Text": "Today Stocks",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "add-order",
                "Text": "Add Order",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            }

        ]
    };

    let bot_message = new KeyboardMessage(SAMPLE_KEYBOARD);
    console.log('KEYBOARD: ', bot_message);
    response.send(bot_message);
}



const registerUser = async (message, response) => {

    // response.send(new TextMessage(`Hi there ${currentUser.id} ${db.collection("üsers").doc(`sXvG8AwXZmlLW7/LCSvMXw==`)}`));
   // const userRef = db.collection("users").doc(`${currentUser.id.substring(1,14)}`);
    const userRef = db.collection('users').doc(currentUser.id);
    // response.send(new TextMessage(`ggggggg    ${userRef}`));
    const user = await userRef.get();
    // response.send(new TextMessage(user));
     if (!user.exists) {
     console.log('No such document!');
        let bot_message1 = new TextMessage(`Click on following link to register`); 
        let bot_message2 = new UrlMessage(APP_URL + '/register/');   
        response.send(bot_message1).then(()=>{
            return response.send(bot_message2);
        });
    } 
   else {
      console.log('Document data:', user.data());
      let actionKeyboard = {
        "Type": "keyboard",
        "Revision": 1,
        "Buttons": [
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "my-stock",               
                "Text": "My Stock",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "my-balance",               
                "Text": "My Balance",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },            
        ]
    };

      let bot_message3 = new TextMessage(`You are already registered`, actionKeyboard);    
      response.send(bot_message3);
    }    
}

/*
const checkStock = async (message, response) => {


    const stocksRef = db.collection('users').doc(currentUser.id).collection('stocks').where("qty", ">", 0);
    const snapshot = await stocksRef.get();
    if (snapshot.empty) {
        let bot_message = new TextMessage(`You have no stock`);    
        response.send(bot_message);
    }  

 
    let stock_message = '';
    snapshot.forEach(doc => {
  
        
        batch = doc.data().batch;
        type = doc.data().type;
        qty = doc.data().qty;        
        received_date = doc.data().received_date;    

        stock_message += `Your batch ${batch} of type ${type} has ${qty} in stock\n`;   
        
               
    }); 

    let bot_message = new TextMessage(`${stock_message}`);    
        response.send(bot_message); 
    
}

const checkBalance = async (message, response) => {    
    
    let total_sale = 0;
    let total_paid = 0;
    let payment_history_message = "";    

    const salesRef = db.collection('users').doc(currentUser.id).collection('sales');
    const snapshot = await salesRef.get();
    if (snapshot.empty) {
        total_sale = 0;
        let bot_message = new TextMessage(`You have no sales`);    
        response.send(bot_message);       
    } else{    
        snapshot.forEach(doc => {   
        total_sale += doc.data().amount;                   
    });
    } 

    console.log('TOTAL SALE:', total_sale);

       

    const paymentsRef = db.collection('users').doc(currentUser.id).collection('payments').orderBy('date', 'desc').limit(5);
    const snapshot2 = await paymentsRef.get();
    if (snapshot2.empty) {
      total_paid = 0;           
    } else{
        snapshot2.forEach(doc => {        
            total_paid += doc.data().amount; 
          
            date = doc.data().date; 
            amount = doc.data().amount; 

            payment_history_message += `Amount: ${amount} is paid on ${date}\n`;
                       
        }); 
    }

    console.log('TOTAL PAID:', total_paid);

    let total_balance = total_sale - total_paid;

    console.log('TOTAL BALANCE:', total_balance);

    let bot_message1 = new TextMessage(`Your total sale is ${total_sale} and total paid is ${total_paid}. Your balance is ${total_balance}`);    
    let bot_message2 = new TextMessage(`${payment_history_message}`);



      
    response.send(bot_message1).then(()=>{
        return response.send(bot_message2);
    });  
    
}


const showMenu = (message, response) => {

    let bot_message = new TextMessage(`Please select your activity in keyboard menu`, actionKeyboard);    
    response.send(bot_message);
}

*/
function defaultReply(message, response){
    response.send(new TextMessage(`I don't quite understand your command`)).then(()=>{
                return response.send(new TextMessage(`Another line of text`)).then(()=>{
                   return response.send(new TextMessage(`Another another line of text`)).then(()=>{
                    return response.send(new TextMessage(`If you forget who you are, type 'who am i'`));
                   }); 
                });
            });
}




generatePushID = (function() {
    // Modeled after base64 web-safe chars, but ordered by ASCII.
    var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  
    // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
    var lastPushTime = 0;
  
    // We generate 72-bits of randomness which get turned into 12 characters and appended to the
    // timestamp to prevent collisions with other clients.  We store the last characters we
    // generated because in the event of a collision, we'll use those same characters except
    // "incremented" by one.
    var lastRandChars = [];
  
    return function() {
      var now = new Date().getTime();
      var duplicateTime = (now === lastPushTime);
      lastPushTime = now;
  
      var timeStampChars = new Array(8);
      for (var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64);
      }
      if (now !== 0) throw new Error('We should have converted the entire timestamp.');
  
      var id = timeStampChars.join('');
  
      if (!duplicateTime) {
        for (i = 0; i < 12; i++) {
          lastRandChars[i] = Math.floor(Math.random() * 64);
        }
      } else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
          lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
      }
      for (i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
      }
      if(id.length != 20) throw new Error('Length should be 20.');
  
      return id;
    };
  })();
// for customer 


// for employee
/*
const functionEmployee = async (message, response) => {
   
    let SAMPLE_KEYBOARD = {
        "Type": "keyboard",
        "Revision": 1,
        "Buttons":  [
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "reply",
                "ActionBody": "today_stocks",
                "Image": "https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg",
                "Text": "TODAY STOCKS",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },
        
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "open-url",
                "ActionBody": "add_order",
                "Image": "https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg",
                "Text": "ADD Order",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            }

        ]
    };

    let bot_message = new KeyboardMessage(SAMPLE_KEYBOARD);
    console.log('KEYBOARD: ', bot_message);
    response.send(bot_message);


}
*/