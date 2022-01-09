# Personal Video Call 

This project is build on top of repo forked from : https://github.com/fireship-io/webrtc-firebase-demo.git  

This project is created with VITE in vanilla JS.

## Technologies Used

1. #### WebRTC :
    Used for peer to peer connection, mostly browser to browser. Uses UDP protocol, so it's good to use this for for media transfer. This is used mostly for video call, audio call, etc. For important file transfer  this might not be appropriate.
2. #### Signaling Server : 
    In real world, tere is no true peer to peer conenction, we need signaling server to establish connection between peer to peer. WebRTC makes use of signaling server to help it establish connection with other peers. 
3. #### ICE server :
    Due to the firewall that sits on our network, the address for the device keeps on changing. Hence, to communicate properly, ICE collects all available candidates (local IP addresses, reflexive addresses – STUN). All the collected addresses are then sent to the remote peer via SDP.
4. #### SDP : 
    Session Description Protocol. SDP is used by WebRTC to negotiate the session’s parameters. Since there is no signaling in WebRTC, the SDP created and used by WebRTC is assumed to be communicated by the application and not by WebRTC itself.
5. #### Stun Servers :
    A STUN server is a server that runs on the public network and replies to incoming requests. The responses it sends out include the public IP address the request was sent to him from. This effectively answers the question “what is my IP address?”. Giants like google provide free stun servers.
6. #### Firebase : 
    We use firebase to be a signaling server for our video call.


## Prerequisites

1. Create an .env file with firebase configuration. (check env.sample for example)
2. From the firebaes console, initialize firestore in test mode.
 STEPS: 
    1. Login to console.firebase.com.
    2. Add project name and continue with default settings.
    3. Click on firestore databse -> create database -> start in test mode. (select any location)
    4. Create web project from settings panel.
    5. Copy the project config and use it in your code. 


## Steps to run the project.

1. Fork / clone this repo.
2. run `npm install`
3. configure your `.env` file.
4. run `npm run dev`
5. Start a call. (url will be copied, you can use that in another tab)
6. Paste the link in another tab.

## Known Issues:
1. There is echo when starting camera with {audio: true}
2. Hangup in remote peer is detected late to the caller.
And many more issues that I am yet to encounter.

NOTE: Any suggestinos and PR to improvise this project is highly appreciated.