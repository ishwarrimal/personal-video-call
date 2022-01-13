// require('dotenv').config()
import './style.scss';
import jpt from './jpt';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


if (!firebase.apps.length) {
  firebase.initializeApp(jpt);
}
const firestore = firebase.firestore();

const token = window.location.search.split('token=')[1];

if(token){
  setTimeout(() => {
    callButton.disabled = true;
    answerCall();
  },1000)
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// HTML elements
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const shareLink = document.getElementById('shareLink');
const remoteVideo = document.getElementById('remoteVideo');
const remoteVideoContainer = document.getElementById('remoteVideoContainer');
const hangupButton = document.getElementById('hangupButton');

// 1. Setup media sources

const startWebcam = (async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    remoteVideoContainer.style.display = 'block';
    hangupButton.disable = false;
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  pc.onconnectionstatechange = (event) => {
    const state = pc.iceConnectionState;
    if(state === 'disconnected'){
      resetCall();
    }
  }

  webcamVideo.srcObject = localStream;
  webcamVideo.muted = true;
  remoteVideo.srcObject = remoteStream;
  callButton.disabled = false;
})()


// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callDoc = firestore.collection('calls').doc();
  //Initiator creates an offer for other peers to connect. 
  const offerCandidates = callDoc.collection('offerCandidates');
  //The peer creates answerCandidate and sends it to the signaling server.
  const answerCandidates = callDoc.collection('answerCandidates');
  const link = `${window.location.origin}?token=${callDoc.id}`
  shareLink.innerHTML = `Copy Link: <mark>${link}</mark>`;
  navigator.clipboard.writeText(link);

  //As the IP of the peers keep changing, we need to take help of ICE (interacitivity connectivity establishment) which helps peers cordinate the discovery of their new IP address
  // Both peers will generate list of ice candidates and share it with the signaling server.
  //WebRTC will take help of stun server to get the ice candidates for peers.
  //The algorithm will automatically find out which candidate is good for establishing connection at the moment.

  // Get candidates for caller, save to db
  // Get's called when setLocalDescription is happened
  pc.onicecandidate = (event) => {
    console.log('Local candidate is added => ',event.candidate);
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer and send it to signaling server, for other peers to be able to connect. This creates an sdp object (which contains video codec, timing, etc), which we use later.
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  // This data needs to be saved in a signaling server (in our case Firebase) using which other peers read to answer the call.
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer by listening to the changes in the callDoc in the firestore (for inital connection)
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
  callButton.disabled = true;
  hangupButton.disabled = false;
};

const answerCall = async () => {
  const callDoc = firestore.collection('calls').doc(token);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');
  

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  hangupButton.disabled = false;
};

hangupButton.onclick = async (e) => {
  await pc.close();
  resetCall();
}

const resetCall = () => {
  remoteVideoContainer.style.display = 'none';
  callButton.disabled = false;
  hangupButton.disabled = true;
  shareLink.innerHTML = '';
}

shareLink.onclick = event => {
  navigator.clipboard.writeText(event.currentTarget.children[0].innerText);
}