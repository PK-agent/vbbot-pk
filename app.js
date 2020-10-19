const fetch = require('node-fetch');
const firebase = require("firebase-admin");
const express = require('express');
const ejs = require("ejs");
const body_parser = require('body-parser');
const { uuid } = require('uuidv4');
const {format} = require('util');
const multer  = require('multer');
const { response } = require('express');

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
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "project_id": process.env.FIREBASE_PROJECT_ID,
    }),
    databaseURL:process.env.FIREBASE_DB_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
  let db = firebase.firestore(); 
const app = express(); 


let currentUser = {};


let adminKeyboard = {
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
                "ActionBody": "mkt-price",               
                "Text": "Add Market Price",
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
                "ActionBody": "merch-entrylist",               
                "Text": "Merchant Entry List",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },            
        ]
    };

    let staffKeyboard = {
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
                "ActionBody": "view-booked-merchants",               
                "Text": "View Booked Merchants ",
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
                "ActionBody": "tdy-pur-price",               
                "Text": "Today's Purchase Price",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },            
        ]
    };

    let merchantKeyboard = {
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
                "ActionBody": "tdy-mark-price",               
                "Text": "Today Market Price",
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
                "ActionBody": "merch-book-inv",               
                "Text": "Merchant Book Inventory",
                "TextVAlign": "middle",
                "TextHAlign": "center",
                "TextOpacity": 60,
                "TextSize": "regular"
            },            
        ]
    };



// Creating the bot with access token, name and avatar
const bot = new ViberBot({
    authToken: process.env.AUTH_TOKEN, // <--- Paste your token here
    name: "PyaungKyi",  // <--- Your bot name here
    avatar: "http://api.adorable.io/avatar/200/isitup"
});

app.use("/viber/webhook", bot.middleware());

app.use(body_parser.json());
app.use(body_parser.urlencoded());

app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');



app.get('/',function(req,res){    
    res.send('your app is up and running');
});


app.get('/merchant/register',function(req,res){   
      let data = {
        user_name: currentUser.name,
      } 
     res.render('merchant.ejs', {data:data});
});


app.post('/merchant/register',function(req,res){   
    
    currentUser.name = req.body.name;
    currentUser.phone = req.body.phone;
    currentUser.address = req.body.address;

    let data = {
        viberid: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address
    }

   
    db.collection('users').add(data)
    .then(()=>{
            let data = {
                   "receiver":currentUser.id,
                   "min_api_version":1,
                   "sender":{
                      "name":"PyaungKyi",
                      "avatar":"http://api.adorable.io/avatar/200/isitup"
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
                .then(json => console.log('JSON', json));
                

    }).catch((error)=>{
        console.log('ERROR:', error);
    });
       
});

app.get('/merchant/book-inventory', async(req,res) => {  
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('viberid', '==', currentUser.id).limit(1).get();
    // const snapshot = await usersRef.get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }  
    let user = {};
    snapshot.forEach(doc => {
        user.id = doc.id;
        user.name = doc.data().name;
        user.phone = doc.data().phone;         
        user.address = doc.data().address;  
        user.corn_type = doc.data().corn_type;
        user.corn_qty = doc.data().corn_qty;
        user.wanted_price = doc.data().wanted_price;
        user.comment = doc.data().comment;
        user.received_date = doc.data().received_date    
    }); 

   res.render('merchant-book-inventory.ejs', {user:user});
});

app.post('/merchant/book-inventory', async (req,res) => {  
   
    let today = new Date();
    let user_id = req.body.user_id;

    let data = {
        created_on:today,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        corn_type: req.body.corn_type,
        corn_qty: req.body.corn_qty,
        wanted_price: req.body.wanted_price,
        comment: req.body.comment,
        received_date: req.body.received_date          
           
    }
   

    db.collection('users').doc(user_id).collection('orders').add(data)
    .then(()=>{
        let data = {
               "receiver":currentUser.id,
               "min_api_version":1,
               "sender":{
                  "name":"PyaungKyi",
                  "avatar":"http://api.adorable.io/avatar/200/isitup"
               },
               "tracking_data":"tracking data",
               "type":"text",
               "text": "Thank you for your book!"+req.body.name
               
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

//admin/merchant/entrylist
app.get('/admin/merchant/entrylist', async (req,res) => {
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.get();
    if (userSnapshot.empty) {
      console.log('No matching documents.');
      return;
    }  
    
    let data = [1,2,3];
    userSnapshot.forEach( doc => { console.log(doc.id);
        // const ordersRef = db.collection('users').doc(doc.id).collection('orders'); 
        // const ordersSnapshot = await ordersRef.get();
        
        // if(ordersSnapshot.empty) {
        //     console.log('No matching documents.');
        //     return;
        // }
        // ordersSnapshot.forEach(doc1 => {
        //     let user = {};
        //     user.id = doc1.id;
        //     user.name = doc1.data().name;
        //     user.phone = doc1.data().phone;         
        //     user.address = doc1.data().address;
        //     user.corn_type = doc1.data().corn_type;
        //     user.corn_qty = doc1.data().corn_qty;
        //     user.wanted_price = doc1.data().wanted_price;
        //     user.comment = doc1.data().comment;
        //     user.received_date = doc1.data().received_date;   
        //     data.push(user);  
        // });           
    });  
    console.log('ggggggggggggggggggggggggggggggggggggggggggggggggggggggg');
    res.render('merch-entryList.ejs', {data});     
});



app.get('/customer/add-order/:orderlist_id', async (req,res) => {  
    let data = { };        

    let userRef = db.collection('users').doc(req.params.orderlist_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {      
      data.orderlist_id = user.id; 
      data.orderlist_name = user.data().name;
    }
    res.render('addorder.ejs', {data:data}); 
    
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



app.get('/admin/addstock/:merchant_id', async (req,res) => {  
    let data = { };        

    let userRef = db.collection('users').doc(req.params.merchant_id);
    let user = await userRef.get();
    if (!user.exists) {
      console.log('No such user!');        
    } else {      
      data.merchant_id = user.id; 
      data.merchant_name = user.data().name;
    }
    res.render('addstock.ejs', {data:data}); 
    
});



app.post('/admin/addstock/', async (req,res) => {  
   
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
      merchant.merchant_id = user.id;      
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
      merchant.merchant_id = user.id;      
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







app.get('/newpage',function(req,res){ 
     let data = {
        title:"Hello",
        name:"Effy"
     }   
     res.render('newpage.ejs', data);
});

app.post('/test',function(req,res){

    console.log('USER ID', currentUser.id);

    
    let data = {
       "receiver":currentUser.id,
       "min_api_version":1,
       "sender":{
          "name":"PyaugnKyi",
          "avatar":"http://api.adorable.io/avatar/200/isitup"
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
    .then(json => console.log(json))   
    
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

let AdminCusStafKeyboard = {
    "Type": "keyboard",
    "BgColor": "#FFFFFF",
    "DefaultHeight": true,
    "Buttons": [
        {
            "Columns": 6,
            "Rows": 1,
            "BgColor": "#2db9b9",
            "BgMediaType": "gif",
            "BgMedia": "http://www.url.by/test.gif",
            "BgLoop": true,
            "ActionType": "reply",
            "ActionBody": "merch-view",               
            "Text": "Merchant",
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
            "ActionBody": "stf-view",               
            "Text": "Staff",
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
            "ActionBody": "adm-view",               
            "Text": "Admin",
            "TextVAlign": "middle",
            "TextHAlign": "center",
            "TextOpacity": 60,
            "TextSize": "regular"
        },

    ],
};

const message = new TextMessage("Welcome to my Pyaung Kyi",AdminCusStafKeyboard,null,null,null,3);

bot.onConversationStarted((userProfile, isSubscribed, context) => {  
    // if(userProfile.id === "sXvG8AwXZmlLW7/LCSvMXw==")  {
    //     bot.sendMessage(userProfile, new TextMessage(`Hello, Admin ${userProfile.name}! Nice to meet you.`));
    // }
    // else{
        bot.sendMessage(userProfile,message);
    // }
});


/*
bot.onTextMessage(/^hi|hello$/i, (message, response) =>
    response.send(new TextMessage(`Hi there ${response.userProfile.name}. I am robot`)));

bot.onTextMessage(/^mingalarbar$/i, (message, response) =>
    response.send(new TextMessage(`Mingalarbar. Welcome to MCC`)));
 */
bot.onTextMessage(/^admin@/i, (message, response) =>{
    const text = message.text;
    let bot_message;
    let pw_enter = text.substring(6);

    if(pw_enter == process.env.ADMIN_PASSWORD){
        bot_message = new TextMessage(`Welcome Admin`, adminKeyboard);
    }else{
        asKAdminpin(message, response);
    }
    response.send(bot_message);
});

bot.onTextMessage(/^staff@/i, (message, response) =>{
    const text = message.text;
    let bot_message;
    let pw_enter = text.substring(6);

    if(pw_enter == process.env.STAFF_PASSWORD){
        bot_message = new TextMessage(`Welcome Staff`, staffKeyboard);
    }else{
        asKStaffpin(message, response);
    }
    response.send(bot_message);
});

bot.onTextMessage(/./, (message, response) => {

    const text = message.text.toLowerCase();

    console.log('MESSAGE:', message);
    //console.log('USER', response.userProfile);

    currentUser.id = response.userProfile.id;
    currentUser.name = response.userProfile.name;

    console.log('CURRENT USER', currentUser);

    
    switch(text){
        case "merch-view":
            registerMerchant(message, response);
            break;
        case "adm-view":
            asKAdminpin(message, response);
            break;
        case "stf-view":
            asKStaffpin(message, response);
            break;        
        case "merch-book-inv":
            merchantBookInventory(message, response);
            break;
        case "merch-entrylist":
            MerchantEntryList(message, response);
            break;
        case "reg-inv":
            customerTdyStock(message, response);
            break;
        case "view-booked-merchant":
            ViewBookedMerchant(message, response);
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
});*/

const asKAdminpin= (message, response) => {
    response.send(new TextMessage(`Please Enter admin password`));
}

const asKStaffpin = (message, response) => {
    response.send(new TextMessage(`Please Enter staff password`));
}

const whoAmI = (message, response) => {
    response.send(new TextMessage(`Hello ${response.userProfile.name}! It's so nice to meet you`));
}

const textReply = (message, response) => {
    let bot_message = new TextMessage(`You have sent message: ${message.text}`);    
    response.send(bot_message);
}

const urlReply = (message, response) => {    

    let bot_message = new UrlMessage(process.env.APP_URL + '/test/');   
    response.send(bot_message);
}

const merchantBookInventory = (message, response) => {    

    let bot_message = new UrlMessage(APP_URL + '/merchant/book-inventory');   
    response.send(bot_message);
}

const MerchantEntryList = (message, response) => {    

    let bot_message = new UrlMessage(APP_URL + '/admin/merchant/entrylist');   
    response.send(bot_message);
}

const ViewBookedMerchant = (message, response) => {    

    let bot_message = new UrlMessage(APP_URL + '/staff/merchant/Booklist');   
    response.send(bot_message);
}

const pictureReply = (message, response) => {
    const bot_message = new PictureMessage('https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg');

    response.send(bot_message).catch(error=>{
        console.error('ERROR', error);
        process.exit(1);
    });
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
        "Revision": 1,
        "Buttons": [
            {
                "Columns": 6,
                "Rows": 1,
                "BgColor": "#2db9b9",
                "BgMediaType": "gif",
                "BgMedia": "http://www.url.by/test.gif",
                "BgLoop": true,
                "ActionType": "open-url",
                "ActionBody": "https://en.wikipedia.org/wiki/Effy_Stonem",
                "Image": "https://upload.wikimedia.org/wikipedia/en/6/69/Effy_Stonem.jpg",
                "Text": "Key text",
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



const registerMerchant = async (message, response) => {   

    const userRef = db.collection('users');    
    const snapshot = await userRef.where('viberid', '==', currentUser.id).limit(1).get();

    if (snapshot.empty) {
        console.log('No such document!');
        let bot_message1 = new TextMessage(`Click on following link to register`, ); 
        let bot_message2 = new UrlMessage(APP_URL + '/merchant/register');   
        response.send(bot_message1).then(()=>{
            return response.send(bot_message2);
        });
    }else{
        
          let bot_message3 = new TextMessage(`You are already registered`, merchantKeyboard);    
          response.send(bot_message3);
    }  
  
}

const checkStock = async (message, response) => {

    let user_id = '';

    const userRef = db.collection('users');    
    const snapshot = await userRef.where('viberid', '==', currentUser.id).limit(1).get();

    if (snapshot.empty) {
        console.log('No such document!');
        let bot_message1 = new TextMessage(`Click on following link to register`, ); 
        let bot_message2 = new UrlMessage(APP_URL + '/register/');   
        response.send(bot_message1).then(()=>{
            return response.send(bot_message2);
        });
    }else{
        snapshot.forEach(doc => {
            user_id = doc.id;         
        });
     }

    const stocksRef = db.collection('users').doc(user_id).collection('stocks').where("qty", ">", 0);
    const snapshot2 = await stocksRef.get();
    if (snapshot2.empty) {
        let bot_message = new TextMessage(`You have no stock`);    
        response.send(bot_message);
    }  

 
    let stock_message = '';
    snapshot2.forEach(doc => {
  
        
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


    let user_id = '';

    const userRef = db.collection('users');    
    const snapshot = await userRef.where('viberid', '==', currentUser.id).limit(1).get();

    if (snapshot.empty) {
        console.log('No such document!');
        let bot_message1 = new TextMessage(`Click on following link to register`, ); 
        let bot_message2 = new UrlMessage(APP_URL + '/register/');   
        response.send(bot_message1).then(()=>{
            return response.send(bot_message2);
        });
    }else{
        snapshot.forEach(doc => {
            user_id = doc.id;         
        });
     }
    
    

    const salesRef = db.collection('users').doc(user_id).collection('sales');
    const snapshot2 = await salesRef.get();
    if (snapshot2.empty) {
        total_sale = 0;
        let bot_message = new TextMessage(`You have no sales`);    
        response.send(bot_message);       
    } else{    
        snapshot2.forEach(doc => {   
        total_sale += doc.data().amount;                   
    });
    } 

    console.log('TOTAL SALE:', total_sale);

       

    const paymentsRef = db.collection('users').doc(user_id).collection('payments').orderBy('date', 'desc').limit(5);
    const snapshot3 = await paymentsRef.get();
    if (snapshot3.empty) {
      total_paid = 0;           
    } else{
        snapshot3.forEach(doc => {        
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


function defaultReply(message, response){
    let bot_message = new TextMessage(`Please select your activity in keyboard menu`, actionKeyboard); 

    response.send(new TextMessage(`I don't quite understand your command`)).then(()=>{
                   return response.send(bot_message);
            });
            
    }       



