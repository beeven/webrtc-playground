import { Component, ViewChild, ElementRef, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { PeerService, PeerSessionDescription } from './peer.service';
import { tap, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent implements AfterViewInit {
  
  title = 'webrtc';

  constraints: MediaStreamConstraints = {video: true};

  mediaDevices: MediaDeviceInfo[];

  streamSource: string;
  localStream: MediaStream;

  peerConnection: RTCPeerConnection;

  rtcConfig: RTCConfiguration = {};
  //stun:stun.ideasip.com

  dataChannel: RTCDataChannel;

  userName: string = "User1";

  localPeer: PeerSessionDescription;
  remotePeers: PeerSessionDescription[];
  selectedRemotePeer: PeerSessionDescription;

  candidates: RTCIceCandidate[] = [];

  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  
  constructor(
    private peerService:PeerService
  ) {}

  ngAfterViewInit(): void {
    from(navigator.mediaDevices.enumerateDevices())
      .pipe(
        tap((devices) => {
          this.mediaDevices = [];
          for(let dev of devices) {
            if(dev.kind == 'videoinput') {
              this.mediaDevices.push(dev);
            }
          }
          this.mediaDevices.push({kind: 'videoinput', label: 'Video File', deviceId: 'file', groupId: null});
        }),
        tap(()=>{ 
          this.streamSource = this.mediaDevices[0].deviceId;
          this.getMedia();
        })
      ).subscribe();
  }

  playVideoFile() {
    this.localVideo.nativeElement.srcObject = null;
      if(this.localStream != null) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      this.localVideo.nativeElement.src = "assets/SwingOutSisters.mp4";
      this.localStream = this.localVideo.nativeElement.captureStream();
  }

  getMedia() {
    if(this.streamSource == 'file') {
      this.playVideoFile();
    } else {
      navigator.mediaDevices.getUserMedia({audio: true, video: {deviceId: this.streamSource ? {exact: this.streamSource}:undefined}})
      .then( 
      (stream)=>{
        this.localStream = stream;
        this.localVideo.nativeElement.src = null;
        this.localVideo.nativeElement.srcObject = this.localStream;
      })
      .catch(
      (err)=>{
        console.error("navigator.getUserMedia error: ", err);
      });
    }
    
  }

  // PC1 PC2
  createPeerConnection() {
    if(this.peerConnection != null) {
      this.peerConnection.close();
    }


    this.peerConnection = new RTCPeerConnection(this.rtcConfig);
    this.peerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent)=>{
      console.log("on icecandiate");
      if(ev.candidate != null){
        this.candidates.push(ev.candidate);
        this.peerService.addCandidate(this.localPeer.id, JSON.stringify(ev.candidate.toJSON())).subscribe();
      }
    }

    this.peerConnection.ondatachannel = (ev)=>{
      console.log("receive data channel");
      if(this.dataChannel == null) {
        this.dataChannel = ev.channel;
      }
    }

    this.peerConnection.ontrack = (ev)=> {
      this.remoteVideo.nativeElement.srcObject = ev.streams[0];
    }

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track);
    });

    console.log("Peer connection created.");

  }

  createDataChannel() {
    this.dataChannel = this.peerConnection.createDataChannel('sendDataChannel', { ordered: true});
    this.dataChannel.onopen = (ev)=>{
      console.log("data channel opened.");
    }
    this.dataChannel.onclose = (ev)=>{
      console.log("data channel closed.");
    }
    this.dataChannel.onerror = (ev)=> {
      console.log("data channel errored.");
    }
  }

  // PC1
  createOffer() {
    from(this.peerConnection.createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true}))
      .pipe(
        switchMap((desc: RTCSessionDescriptionInit)=>this.peerService.addPeer(this.userName, desc.type, desc.sdp)),
        tap((peer) => { this.localPeer = peer; }),

        // will yield local icecandidate
        switchMap((peer)=>this.peerConnection.setLocalDescription({type:'offer', sdp: peer.sdp})),
      ).subscribe();
  }

  fetchPeers() {
    this.peerService.listPeer().subscribe(
      (peers) => {
        this.remotePeers = peers;
      }
    )
  }

  deletePeer(peer: PeerSessionDescription) {
    this.peerService.deletePeer(peer.id).subscribe(
      ()=> {
        let index = this.remotePeers.indexOf(peer);
        this.remotePeers.splice(index,1);
      }
    );
  }

  // PC2
  acceptOffer() {
    from(this.peerConnection.setRemoteDescription({ type: this.selectedRemotePeer.type, sdp: this.selectedRemotePeer.sdp}))
      .pipe(
        switchMap(()=>this.peerService.getCandidates(this.selectedRemotePeer.id)),
        tap((candidates)=> { candidates.forEach(c => this.peerConnection.addIceCandidate(
          JSON.parse(c.candidateJson)))})
      ).subscribe();
  }

  // PC2
  createAnswer() {
    from(this.peerConnection.createAnswer({offerToReceiveVideo: true}))
    .pipe(
      switchMap((answer)=>this.peerService.addPeer(this.userName, answer.type, answer.sdp)),
      tap( (peer)=>{
        this.localPeer = peer;
      }),
      tap( (peer)=> {
        this.peerConnection.setLocalDescription({type: peer.type, sdp: peer.sdp});
      })     
    ).subscribe();
  }

  // PC1
  acceptAnswer() {
    from(this.peerConnection.setRemoteDescription({type: this.selectedRemotePeer.type, sdp: this.selectedRemotePeer.sdp}))
      .pipe(
        switchMap(()=>this.peerService.getCandidates(this.selectedRemotePeer.id)),
        tap( (candidates)=> 
          candidates.forEach(c=>
          this.peerConnection.addIceCandidate(JSON.parse(c.candidateJson)))
        )
      ).subscribe();

  }

  hangUp() {
    if(this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if(this.peerConnection){
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.getMedia();
  }


}


