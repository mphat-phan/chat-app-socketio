const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');
        let user = db.collection('users');
        let room = db.collection('rooms');
        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        // chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
        //     if(err){
        //         throw err;
        //     }

        //     // Emit the messages
        //     socket.emit('output', res);
        // });

        // room.find().limit(100).sort({_id:1}).toArray(function(err, res){
        //     if(err){
        //         throw err;
        //     }

        //     // Emit the messages
        //     socket.emit('outputRoom', res);
        // });
        //Register
        socket.on('register',async function(data){
            let email = data.email;
            let password = data.password;
            let username = data.username;
            let userExist = await user.findOne({
                email:new RegExp('^'+email+'$', "i") 
            });
            if(userExist){
                sendStatus({
                    message: 'User đã đăng ký'
                });
            }
            else{
                user.insert({email: email, password: password, username: username});
                sendStatus({
                    message: 'User đăng ký thành công',
                    status: true
                });
            }
            
        })
        //Login
        socket.on('login',async function(data){
            let email = data.email;
            let password = data.password;
            let userExist = await user.findOne({
                email:new RegExp('^'+email+'$', "i"),
                password : new RegExp('^'+password+'$', "i") 
            });
            if(userExist){
                sendStatus({
                    message: 'Đăng nhập thành công',
                    status: true,
                    username: userExist.username,
                    email: userExist.email
                });
            }
            else{
                sendStatus({
                    message: 'Sai mật khẩu hoặc tài khoản',
                    status: false
                });
            }
            
        })

        //Get room
        socket.on('getRoom',async function(data){
            //User
            let email = data.email;
            let roomExist = await room.find({
                joinedUser: {
                    $elemMatch:{
                        email:email
                    }
                }
            }).toArray(function(err, res){
                socket.emit('outputRoom', res);
            })
        })

        //get message
        socket.on('getMessage',async function(data){
            //User
            
            let roomname = data.room;
            let roomExist = await room.findOne(
                {
                    room: new RegExp('^'+roomname+'$', "i"),
                },async function(err, res){
                    socket.emit('output', res);
                }
            )
        })

        //Add group
        socket.on('createRoom',async function(data){
            //User
            let email = data.email;
            let username = data.username;
            //Room
            let password = data.password;
            let roomname = data.room;

            //Kiểm tra tồn tại tên phòng và user đã join
            let roomExist = await room.findOne({
                room:new RegExp('^'+roomname+'$', "i")
            });
            let userExist = await room.findOne({
                room:new RegExp('^'+roomname+'$', "i"),
                joinedUser:{
                    email: new RegExp('^'+email+'$', "i")
                }
            });
            if(roomExist){
                sendStatus({
                    message: 'Phòng đã tồn tại',
                    status: false
                });
            }
            else if(userExist){
                sendStatus({
                    message: 'Đã join',
                    status: false
                });
            }
            else{
                room.insert({room: roomname, password: password, joinedUser: [
                {
                    email:email,
                    username:username
                }
                ]},async function(){
                    let roomExist = await room.find({
                        joinedUser: {
                            $elemMatch:{
                                email:email
                            }
                        }
                    }).toArray(function(err, res){
                        socket.emit('outputRoom', res);
                    })
                });
            }
            
        })
        //Join group
        socket.on('joinRoom',async function(data){
            //User
            let email = data.email;
            let username = data.username;
            //Room
            let password = data.password;
            let roomname = data.room;
            //Kiểm tra tồn tại tên phòng và user ton tai
            let roomExist = await room.findOne({
                room: new RegExp('^'+roomname+'$', "i"),
                password: new RegExp('^'+password+'$', "i")
            });
            let userExist = await room.findOne({
                room: new RegExp('^'+roomname+'$', "i"),
                password: new RegExp('^'+password+'$', "i"),
                joinedUser: {
                    $elemMatch:{
                        email:email
                    }
                }
            });
            if(!roomExist){
                sendStatus({
                    message: 'Phòng khong tồn tại',
                    status: false
                });
            }
            else if(userExist){
                sendStatus({
                    message: 'Tài khoản đã join',
                    status: false
                });
            }
            else{
                room.updateOne(
                    {room: new RegExp('^'+roomname+'$', "i")},
                    {
                        $push: { 
                        joinedUser:{
                            $each:[
                                {
                                    email:email,
                                    username:username
                                }
                            ]
                        }
                    }
                    },
                    async function(){
                        let roomExist = await room.find({
                            joinedUser: {
                                $elemMatch:{
                                    email:email
                                }
                            }
                        }).toArray(function(err, res){
                            socket.emit('outputRoom', res);
                        })
                    }
                )
            }
        })
        //Leave group
        socket.on('leaveRoom',async function(data){
            //User
            let email = data.email;
            //Room
            let roomname = data.room;
            console.log(data);
            room.updateOne(
                {room: new RegExp('^'+roomname+'$', "i")},
                {
                    $pull: { 
                        joinedUser:
                        {
                            email:email
                        }
                        
                    }
                },
                async function(){
                    let roomExist = await room.find({
                        joinedUser: {
                            $elemMatch:{
                                email:email
                            }
                        }
                    }).toArray(function(err, res){
                        socket.emit('outputRoom', res);
                    })
                }
            )
        })
        //Input
        socket.on('input',async function(data){
            //User
            let email = data.email;
            let username = data.username;
            //Room
            let roomname = data.room;
            //Message
            let message = data.message;
            let date = data.date;
            //Check input
            if(username == '' || message == ''){
                sendStatus('Please enter a name and message');
            }
            else{
                room.updateOne(
                    {room: new RegExp('^'+roomname+'$', "i")},
                    {
                        $push: { 
                        messageList:{
                            $each:[
                                {
                                    email:email,
                                    username:username,
                                    message:message,
                                    date:date
                                }
                            ]
                        }
                    }
                    },
                    async function(req,res){
                        let roomExist = await room.findOne(
                            {
                                room: new RegExp('^'+roomname+'$', "i"),
                            },async function(err, res){
                                client.emit('output', res);
                            }
                        )
                    }
                )
            }
        })
        //Clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });

});