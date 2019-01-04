import { Component, ViewChild, ElementRef, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { PeerService, CandidateService, PeerDescription } from './peer.service';
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

  streamSource: string = "media";
  localStream: MediaStream;

  localPeerConnection: RTCPeerConnection;
  remotePeerConnection: RTCPeerConnection;

  rtcConfig: RTCConfiguration = {};
  //stun:stun.ideasip.com

  localDataChannel: RTCDataChannel;
  remoteDataChannel: RTCDataChannel;
  iceCandicate: RTCIceCandidate;
  

  offerDescription: RTCSessionDescriptionInit;

  userName: string = "User1";

  remotePeers: PeerDescription[];
  selectedPeer: PeerDescription;

  candidates: RTCIceCandidate[] = [];

  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;
  
  constructor(
    private peerService:PeerService
  ) {}

  ngAfterViewInit(): void {
    this.getMedia();
  }

  onStreamSourceChange() {

    if(this.streamSource == 'media') {
      this.getMedia();
    } else {
      this.localVideo.nativeElement.srcObject = null;
      if(this.localStream != null) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      this.localVideo.nativeElement.src = "assets/SwingOutSisters.mp4";
      this.localStream = this.localVideo.nativeElement.captureStream();
    }
  }

  getMedia() {
    navigator.mediaDevices.getUserMedia(this.constraints)
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

  createPeerConnection() {
    if(this.localPeerConnection != null) {
      this.localPeerConnection.close();
      this.remotePeerConnection.close();
    }


    this.localPeerConnection = new RTCPeerConnection(this.rtcConfig);
    this.localPeerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent)=>{
      this.onIceCandidate("local", ev.candidate);
      if(ev.candidate != null){
        this.candidates.push(ev.candidate);
      }
    }
    
    this.localDataChannel = this.localPeerConnection.createDataChannel('sendDataChannel', { ordered: true});
    this.localDataChannel.onopen = (ev)=>{
      console.log("data channel opened.");
    }
    this.localDataChannel.onclose = (ev)=>{
      console.log("data channel closed.");
    }
    this.localDataChannel.onerror = (ev)=> {
      console.log("data channel errored.");
    }


    this.remotePeerConnection = new RTCPeerConnection(this.rtcConfig);
    this.remotePeerConnection.onicecandidate = (ev)=>{
      this.onIceCandidate("remote", ev.candidate);
    }
    this.remotePeerConnection.ontrack = (ev)=>{
      console.log("remote on track");
      this.remoteVideo.nativeElement.srcObject = ev.streams[0];
    }
    this.remotePeerConnection.ondatachannel = (ev)=>{
      console.log("Receive data channel from remote.");
      this.remoteDataChannel = ev.channel
      this.remoteDataChannel.onopen = (e) => { console.log("remote data channel opened.")};
      this.remoteDataChannel.onmessage = (e) => { console.log("remote data channel received: ", e.data)};
      this.remoteDataChannel.onclose = (e) => {console.log("remote data channel closed.")};
    }


    this.localStream.getTracks().forEach(track => {
      this.localPeerConnection.addTrack(track);
    });

    console.log("Peer connection created.");

  }

  onIceCandidate(name: string, candidate:RTCIceCandidate ) {
    console.log("OnIceCandidate:",name, candidate);
  }

  createOffer() {
    from(this.localPeerConnection.createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true}))
      .pipe(
        tap((desc)=>{
          this.offerService.saveOffer(desc.sdp, this.userName)
        }),
        switchMap((desc)=>this.localPeerConnection.setLocalDescription(desc)),
      ).subscribe();
  }

  fetchOffers() {
    this.offerService.listOffer().subscribe(
      (offers) => {
        this.remoteOffers = offers;
      }
    )
  }

  deleteOffer(offer: Offer) {
    this.offerService.removeOffer(offer.id).subscribe(
      ()=> {
        let index = this.remoteOffers.indexOf(offer);
        this.remoteOffers.splice(index,1);
      }
    );
  }

  acceptOffer() {
    from(this.remotePeerConnection.setRemoteDescription({ type: 'offer', sdp: this.selectedOffer.offerJson}))
      .pipe(
        switchMap(()=>{
          this.
        })
      )
    this.candidates.forEach(candidate => this.remotePeerConnection.addIceCandidate(candidate));
  }

  createAnswer() {
    this.remotePeerConnection.createAnswer().then(
      (answer) => {
        this.remotePeerConnection.setLocalDescription(answer);
        this.localPeerConnection.setRemoteDescription(answer);
      }
    )
  }

  hangUp() {
    this.remoteVideo.nativeElement.srcObject = null;
    this.localDataChannel.close();
    if(this.remoteDataChannel) {
      this.remoteDataChannel.close();
    }
    this.localPeerConnection.close();
    this.remotePeerConnection.close();
    this.localPeerConnection = null;
    this.remotePeerConnection = null;
  }


}


