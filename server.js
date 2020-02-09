
var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({port:90}); 

//all connected to the server users 
var users = {};
  
//when a user connects to our sever 
wss.on('connection', function(connection) {
  
   console.log("User connected");
	
   //when server gets a message from a connected user 
   connection.on('message', function(message) { 
	
      var data; 
		
      //accepting only JSON messages 
      try { 
         data = JSON.parse(message); 
      } catch (e) { 
         console.log("Invalid JSON"); 
         data = {}; 
      }
		
      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login
         case "login": 
            console.log("User logged", data.name); 
            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
               sendTo(connection, { 
                  type: "login", 
                  success: false 
               }); 
            } else { 
               //save user connection on the server 
               users[data.name] = connection; 
               connection.name = data.name; 
               sendTo(connection, { 
                  type: "loginok", 
               }); 
            } 
				
            break;
				
         case "voicecall": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: ", data.name);
				
            //if UserB exists then send him offer details 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
				
               sendTo(conn, { 
                  type: "voicecall", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
			   sendTo(connection, { 
                  type: "connecting", 
               });
            }else{
			sendTo(connection, { 
                  type: "offline", 
               });
			}
				
            break;
			
         case "videocall": 
            //for ex. UserA wants to call UserB 
            console.log("Sending Video offer to: ", data.name);
				
            //if UserB exists then send him offer details 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
				
               sendTo(conn, { 
                  type: "videocall", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
			   sendTo(connection, { 
                  type: "connecting", 
               });
            }else{
			sendTo(connection, { 
                  type: "offline", 
               });
			}
				
            break;	
         case "answer": 
            console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "answer", 
                  answer: data.answer 
               }); 
            } 				
            break; 
         case "answervideo": 
            console.log("Sending answervideo to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "videoanswer", 
                  answer: data.answer 
               }); 
            } 				
            break; 

		 case "newmessage":
		  var conn = users[data.to];
		  if(conn){
		  console.log("sending message to : ",data.to);
		          sendTo(conn, { 
                  type: "newmessage", 
                  url: data.url,
                  from : data.from,
                  id : data.id,
				  by : data.fromname
               }); 
			   }
		 break;
				
         case "candidate": 
            var conn = users[data.name];
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "candidate", 
                  candidate: data.candidate 
               }); 
            } 
				
            break;
				
         case "leave": 
            var conn = users[data.name]; 

            //notify the other user so he can disconnect his peer connection 
            if(conn != null) {
            console.log("Disconnecting from", data.name); 

               sendTo(conn, { 
                  type: "leave" 
              }); 
            }
				
            break;
				
         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Command not found: " + data.type 
            }); 
				
            break; 
      }
		
   }); 
	
   //when user exits, for example closes a browser window 
   //this may help if we are still in "offer","answer" or "candidate" state 
   connection.on("close", function() { 
	
      if(connection.name) { 
         delete users[connection.name]; 
			
         if(connection.otherName) { 
            console.log("Disconnecting from ", connection.otherName); 
            var conn = users[connection.otherName]; 
            conn.otherName = null;
				
            if(conn != null) { 
               sendTo(conn, { 
                  type: "leave" 
               }); 
            }
         } 
      }
		
   });  
	
   connection.send("Hello world");  
});
  
function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}
