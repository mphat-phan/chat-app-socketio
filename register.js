var socket = io.connect('http://127.0.0.1:4000');
var app = new Vue({
    el: '#form1',
    data: function () {
      return {
      username : "",
      email : "",
      emailBlured : false,
      valid : false,
      submitted : false,
      password:"",
      passwordBlured:false
      }
    },
  
    methods:{
  
      validate : function(){
      this.emailBlured = true;
      this.passwordBlured = true;
      if( this.validEmail(this.email) && this.validPassword(this.password)){
        this.valid = true;
      }
      },
  
  validEmail : function(email) {
     
  var re = /(.+)@(.+){2,}\.(.+){2,}/;
  if(re.test(email.toLowerCase())){
    return true;
  }
  
  },
  
  validPassword : function(password) {
     if (password.length > 7) {
      return true;
     }
  },
  
  submit : function(){
    this.validate();
    if(this.valid){
      if(socket !== undefined){
        console.log('Connected to socket...');
        socket.emit('register', {
          email: this.email,
          password : this.password,
          username : this.username,
        });
      }
      this.submit = true;
    }
  }
    }
});

socket.on('status', function(data){
  alert(data.message);  
  if(data.status === true){
    window.location ="login.html";
  }
});


