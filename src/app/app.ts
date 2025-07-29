import { Component } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CriptoComponent } from './components/crypto-tracker/cripto.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    CriptoComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {}
