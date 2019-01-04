import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, SDPPipe } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { PeerService, CandidateService } from './peer.service';

@NgModule({
  declarations: [
    SDPPipe,
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [PeerService, CandidateService],
  bootstrap: [AppComponent]
})
export class AppModule { }
