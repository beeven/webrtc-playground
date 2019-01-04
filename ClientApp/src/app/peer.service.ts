import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export class PeerDescription
{
    id: number;
    name: string;
    type: string;
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

    addPeer(name: string, type: string, sdp: string): Observable<PeerDescription> {
        return this.http.post<PeerDescription>(`${PeerServiceBaseUrl}`,{id: 0, name: name, type: type, sdp: sdp});
    }

    deletePeer(id: number): Observable<number> {
        return this.http.delete<number>(`${PeerServiceBaseUrl}/${id}`);
    }

    purgePeers(name: string): Observable<number> {
        return this.http.delete<number>(`${PeerServiceBaseUrl}/all/${name}`);
    }

    listPeer(): Observable<PeerDescription[]> {
        return this.http.get<PeerDescription[]>(`${PeerServiceBaseUrl}`);
    }

}

@Injectable()
export class CandidateService {
    constructor(private http: HttpClient){ }
    addCandidate(peerId: number, candidateJson: string): Observable<PeerCandidate> {
        return this.http.post<PeerCandidate>(`${CandidateServiceBaseUrl}/${peerId}`, {id: 0, candidateJson: candidateJson});
    }

    getCandidates(peerId: number): Observable<PeerCandidate[]> {
        return this.http.get<PeerCandidate[]>(`${CandidateServiceBaseUrl}/${peerId}`);
    }
}