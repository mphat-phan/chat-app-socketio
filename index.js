const filterMsg = (_message) => {
    let msg = upperStr(_message);
    msg = removeSpaceMsg(msg);
    return msg;
}
const isLower = (str) => {
    return /[a-z]/.test(str) && !/[A-Z]/.test(str);
}
const isUpper = (str) => {
    return !/[a-z]/.test(str) && /[A-Z]/.test(str);
}
const spaceIndexs = (_message) => {
    const spaceIndex = [];
    let index = 0;
    for(let i = 0; i < _message.length; i++){
        
        if(_message[i] == ' ' || _message[i] == '\t' || _message[i] == '\n'){
            spaceIndex.push(i - index);
            index++;
        } 
    }

    return spaceIndex;
}
const lowerIndexs = (_message) => {
    const lowerIndex = [];
    let index = 0;
    for(let i = 0; i < _message.length; i++){
        
        if(isLower(_message[i])){
            lowerIndex.push(i);
            index++;
        } 
    }

    return lowerIndex;
}
const upperStr = (_message) => {
    return _message.toUpperCase();
}
const removeSpaceMsg = (_message) => {
    _message = _message.replace(/\s+/g, '');
    return _message;
}
const lowerStr = (_message) => {
    return _message.toLowerCase();
}
const undoMsg = (msg, oldMsg) => {
    const root = []; 
    let indexSpace = 0;
    let indexLower = 0;
    const space = spaceIndexs(oldMsg);
    const lower = lowerIndexs(oldMsg);
    //Add space to msg
    for(let i=0; i<oldMsg.length; i++){
        if(i == space[indexSpace]){
            root.push(' ');
            root.push(msg[i]);
            indexSpace++;
            continue;
        }
        else{
            root.push(msg[i]);
        }
    }
    //Lower msg
    for(let i=0; i<oldMsg.length; i++){
        if(i == lower[indexLower] && isUpper(root[i])){
            root[i] = lowerStr(root[i]);
            indexLower++;
        }
    }
    return root.join('');
}
const encode = (k, text) => {
    const s = filterMsg(text);
    k = k.toUpperCase();
    var r = "";
    var c = 0;
    for(var i = 0;i<s.length;i++){
        if(s[i].charCodeAt(0)<"A".charCodeAt(0)||s[i].charCodeAt(0)>"Z".charCodeAt(0)){
            r+=s[i];
            continue;
        }
        r+=String.fromCharCode((s[i].charCodeAt(0)+k[c].charCodeAt(0)-(2*"A".charCodeAt(0)))%26+"A".charCodeAt(0));
        c = (c+1)%k.length;
    }
    return undoMsg(r,text);
}
const decode = (k, text) => {
    const s = filterMsg(text);
    k = k.toUpperCase();
    var r = "";
    var c = 0;
    for(var i = 0;i<s.length;i++){
        if(s[i].charCodeAt(0)<"A".charCodeAt(0)||s[i].charCodeAt(0)>"Z".charCodeAt(0)){
            r+=s[i];
            continue;
        }
        r+=String.fromCharCode((s[i].charCodeAt(0)-k[c].charCodeAt(0)+26)%26+"A".charCodeAt(0));
        c = (c+1)%k.length;
    }
    return undoMsg(r,text);
}
(function(){
    $(document).ready(function(){
        $('#action_menu_btn').click(function(){
            $('.action_menu').toggle();
        });
    });
    var secret_key = "hellomoinguoi";
    var element = function(id){
        return document.getElementById(id);
    }

    // Get Elements
    var status = element('status');
    var user_info = $('.user_info');
    var txtRoomName = $('#txtRoomName');
    var txtPassword = $('#txtPassword');
    var txtRoomNameJoin = $('#txtRoomNameJoin');
    var txtPasswordJoin = $('#txtPasswordJoin');
    var leaveRoom = $('#leaveRoom');
    var btnJoin = $('#joinRoom');
    var messages = element('messages');
    var rooms = element('rooms');
    var roomChoose = '';
    var messageNumber = $('.messageNumber');
    var textarea = element('textarea');
    var username = localStorage.getItem('username');
    var email = localStorage.getItem('email');
    var clearBtn = element('clear');
    var btnSend = $('#btn-send');
    var btnCreateRoom = $('#createRoom');
    // Set default status
    var statusDefault = status.textContent;

    var setStatus = function(s){
        // Set status
        status.textContent = s;

        if(s !== statusDefault){
            var delay = setTimeout(function(){
                setStatus(statusDefault);
            }, 4000);
        }
    }
    
    // Connect to socket.io
    var socket = io.connect('http://127.0.0.1:4000');

    // Check for connection
    if(socket !== undefined){
        console.log('Connected to socket...');

        // Handle Output
        socket.on('output', function(data){
            const { messageList=[] } = data;
            //if(messageList.length){
                let html = '';
                for(var x = 0;x < messageList.length;x++){
                    // Build out message div
                    if(email === messageList[x].email){
                        html+=`
                            <div class="d-flex justify-content-end mb-9" style="margin-bottom:50px">
                                
                                <div class="msg_cotainer">
                                    ${decode(secret_key,messageList[x].message)}
                                    <span class="msg_time">${decode(secret_key,messageList[x].username)}, ${new Date(messageList[x].date)}, Today</span>
                                </div>
                                <div class="img_cont_msg">
                                    <img src="user-solid.svg" class="rounded-circle user_img_msg">
                                </div>
                            </div>
                        `
                    }
                    else{
                        html += `
                            <div class="d-flex justify-content-start mb-9" style="margin-bottom:50px">
                                <div class="img_cont_msg">
                                    <img src="user-solid.svg" class="rounded-circle user_img_msg">
                                </div>
                                <div class="msg_cotainer_send">
                                    ${decode(secret_key,messageList[x].message)}
                                    <span class="msg_time_send">${decode(secret_key,messageList[x].username)}, ${new Date(messageList[x].date)}, Today</span>
                                </div>
                            </div>
                        `;
                    }
                    
                }
                messageNumber[0].innerHTML = messageList.length + ' messages'
                messages.innerHTML = html;
                messages.scrollTop+= messages.offsetWidth;
            //}
        });
        
        socket.emit('getRoom', {
            email: email
        });

        socket.on('outputRoom', function(data){
            if(data.length>0){
                let html = '';
                html+=`
                    <li data_room="${data[0].room}" class="roomList active">
                        <div class="d-flex bd-highlight" style="padding:10px">
                            <div class="img_cont" style="align-items: center;display: flex;justify-content: center;">
                                <img src="people-group-solid.svg" style="width:50px">
                            </div>
                            <div class="user_info">
                                <span>${data[0].room}</span>
                            </div>
                        </div>
                    </li>
                `;
                for(var x = 1;x < data.length;x++){
                    html+=`
                        <li data_room="${data[x].room}" class="roomList">
                            <div class="d-flex bd-highlight" style="padding:10px">
                                <div class="img_cont" style="align-items: center;display: flex;justify-content: center;">
                                    <img src="people-group-solid.svg" style="width:50px">
                                </div>
                                <div class="user_info">
                                    <span>${data[x].room}</span>
                                </div>
                            </div>
                        </li>
                    `
                }
                
                rooms.innerHTML = html;
            }
            if(roomChoose === ''){
                const choose = $(".roomList");
                const roomFirst = choose[0].getAttribute('data_room');
                $('.roomname')[0].innerHTML = roomFirst
                roomChoose = roomFirst;
                socket.emit('getMessage', {
                    room:roomFirst,
                });
            }
        });

        // Get Status From Server
        socket.on('status', function(data){
            alert(data.message);
            // get message status
            //setStatus((typeof data === 'object')? data.message : data);

            // If status is clear, clear text
            if(data.clear){
                textarea.value = '';
            }
        });
        $(function () {
            $(document).on('click', '.roomList', function (e) {
                $(".roomList").removeClass("active");
                $(this).addClass("active");
                const roomname = $(this).attr('data_room');
                $('.roomname')[0].innerHTML = roomname;
                roomChoose = roomname;
                socket.emit('getMessage', {
                    room:roomname,
                });
            })
        })
        //leave room
        leaveRoom.click(function(){
            socket.emit('leaveRoom', {
                room: roomChoose,
                email: email
            });
            const choose = $(".roomList");
            const roomFirst = choose[0].getAttribute('data_room');
            $('.roomname')[0].innerHTML = roomFirst
            roomChoose = roomFirst;
            socket.emit('getMessage', {
                room:roomFirst,
            });
            
        })
        //Create room
        btnCreateRoom.click(function(){
            socket.emit('createRoom', {
                email: email,
                username: username,
                password: txtPassword.val(),
                room: txtRoomName.val()
            });
            $('#exampleModal').find('form').trigger('reset');
            $('#exampleModal').hide();
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            event.preventDefault();
        })
        //Join room
        btnJoin.click(function(){
            socket.emit('joinRoom', {
                email: email,
                username: username,
                password: txtPasswordJoin.val(),
                room: txtRoomNameJoin.val()
            });
            $('#exampleModal2').find('form').trigger('reset');
            $('#exampleModal2').hide();
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            event.preventDefault();
        })
        // Handle Input
        btnSend.click(function(){
            //if(event.which === 13 && event.shiftKey == false){
                // Emit to server input
                const cipher = encode(secret_key,textarea.value);
                const nameCipher = encode(secret_key,username);
                const room = roomChoose;
                socket.emit('input', {
                    username:nameCipher,
                    message:cipher,
                    email : email,
                    date:Date.now(),
                    room: room,
                });

                event.preventDefault();
            //}
        })
        // textarea.addEventListener('keydown', function(event){
        //     if(event.which === 13 && event.shiftKey == false){
        //         // Emit to server input
        //         const cipher = encode(secret_key,textarea.value);
        //         const nameCipher = encode(secret_key,username)
        //         socket.emit('input', {
        //             name:nameCipher,
        //             message:cipher,
        //             date:Date.now()
        //         });

        //         event.preventDefault();
        //     }
        // })
        // Handle Chat Clear
        clearBtn.addEventListener('click', function(){
            socket.emit('clear');
        });

        // Clear Message
        socket.on('cleared', function(){
            messages.textContent = '';
        });
    }

})();

