import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export class PeerSessionDescription
{
    id: number;
    name: string;
    type: RTCSdpType;
    sdp: string;
}

export class PeerCandidate
{
    id: number;
    candidateJson: string;
}


const PeerServiceBaseUrl = "api/rtc/peer";
const CandidateServiceBaseUrl = "api/rtc/candidate";

@Injectable()
export class PeerService {

    constructor(private http: HttpClient) { }

    addPeer(name: string, type: string, sdp: string): Observable<PeerSessionDescription> {
        return this.http.post<PeerSessionDescription>(`${PeerServiceBaseUrl}`,{id: 0, name: name, type: type, sdp: sdp});
    }

    deletePeer(id: number): Observable<number> {
        return this.http.delete<number>(`${PeerServiceBaseUrl}/${id}`);
    }

    purgePeers(name: string): Observable<number> {
        return this.http.delete<number>(`${PeerServiceBaseUrl}/all/${name}`);
    }

    listPeer(): Observable<PeerSessionDescription[]> {
        return this.http.get<PeerSessionDescription[]>(`${PeerServiceBaseUrl}`);
    }

    addCandidate(peerId: number, candidateJson: string): Observable<PeerCandidate> {
        return this.http.post<PeerCandidate>(`${CandidateServiceBaseUrl}/${peerId}`, {id: 0, candidateJson: candidateJson});
    }

    getCandidates(peerId: number): Observable<PeerCandidate[]> {
        return this.http.get<PeerCandidate[]>(`${CandidateServiceBaseUrl}/${peerId}`);
    }

}